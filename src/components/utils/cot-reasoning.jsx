/**
 * @fileoverview Chain-of-Thought (CoT) Reasoning Engine
 * @description Structured AI reasoning with multi-step analysis,
 * dual-path reasoning, prompt compression, and cost tracking.
 * 
 * @module utils/cot-reasoning
 * @version 2.0.0
 * 
 * @example
 * import { executeCoTReasoning, executeDualPathReasoning, estimateCoTCost } from '@/components/utils/cot-reasoning';
 * 
 * // Single-path reasoning
 * const result = await executeCoTReasoning(
 *   'Analyze this customer complaint',
 *   { context: { complaint, history }, maxSteps: 5 }
 * );
 * 
 * // Dual-path (conservative + optimistic)
 * const analysis = await executeDualPathReasoning(
 *   'Should we launch this feature?',
 *   { context: { metrics, risks } }
 * );
 * 
 * // Estimate cost before execution
 * const cost = estimateCoTCost(taskLength, contextLength, 5);
 */

import { base44 } from '@/api/base44Client';
import { ReasoningStepType, ConfidenceLevel } from '../shared/constants';

// Re-export for backwards compatibility
export { ReasoningStepType, ConfidenceLevel };

// =============================================================================
// STRUCTURED OUTPUT SCHEMA
// =============================================================================

const DEFAULT_COT_SCHEMA = {
  type: "object",
  properties: {
    reasoning_trace: {
      type: "array",
      items: {
        type: "object",
        properties: {
          step_number: { type: "integer" },
          step_type: { type: "string" },
          thought: { type: "string" },
          evidence: { type: "array", items: { type: "string" } },
          confidence: { type: "string" }
        }
      }
    },
    final_answer: {
      type: "object",
      properties: {
        conclusion: { type: "string" },
        confidence: { type: "string" },
        key_insights: { type: "array", items: { type: "string" } },
        limitations: { type: "array", items: { type: "string" } }
      }
    },
    metadata: {
      type: "object",
      properties: {
        total_steps: { type: "integer" },
        reasoning_path: { type: "string" },
        alternative_considered: { type: "boolean" }
      }
    }
  }
};

// =============================================================================
// COT PROMPT TEMPLATES
// =============================================================================

const COT_SYSTEM_PROMPT = `You are an expert reasoning system that thinks step-by-step.

CRITICAL INSTRUCTIONS:
1. Break down complex problems into 3-7 explicit reasoning steps
2. For each step, clearly state:
   - What you're analyzing
   - Evidence or data supporting your reasoning
   - Your confidence level (high/medium/low/uncertain)
3. Consider alternative explanations before concluding
4. Acknowledge limitations and uncertainties
5. Provide a structured final answer with key insights

Always respond in the specified JSON format.`;

const DUAL_PATH_PROMPT = `You will analyze this problem from TWO different perspectives:

PATH A (Conservative): Analyze with caution, considering risks and edge cases.
PATH B (Optimistic): Analyze focusing on opportunities and best-case scenarios.

For each path:
1. Provide 3-5 reasoning steps
2. Reach a preliminary conclusion
3. Note confidence level

Then act as an ARBITER:
1. Compare both paths
2. Identify where they agree and disagree
3. Synthesize a final balanced conclusion`;

// =============================================================================
// PROMPT COMPRESSION
// =============================================================================

export function compressPrompt(prompt, options = {}) {
  const { maxLength = 4000, _preserveKeywords = [] } = options;
  
  if (prompt.length <= maxLength) {
    return { compressed: prompt, ratio: 1 };
  }
  
  let compressed = prompt;
  
  // Remove excessive whitespace
  compressed = compressed.replace(/\s+/g, ' ');
  
  // Remove common filler phrases
  const fillerPhrases = [
    /\bplease\s+/gi,
    /\bkindly\s+/gi,
    /\bI would like you to\s+/gi,
    /\bCould you please\s+/gi,
    /\bIt would be great if you could\s+/gi,
    /\bin other words,?\s+/gi,
    /\bthat is to say,?\s+/gi,
    /\bfor example,?\s+/gi,
    /\bas mentioned (earlier|above|before),?\s+/gi
  ];
  
  for (const phrase of fillerPhrases) {
    compressed = compressed.replace(phrase, '');
  }
  
  // Shorten common phrases
  const shortenings = [
    [/\band also\b/gi, '&'],
    [/\bbecause of the fact that\b/gi, 'because'],
    [/\bin order to\b/gi, 'to'],
    [/\bat this point in time\b/gi, 'now'],
    [/\bdue to the fact that\b/gi, 'because'],
    [/\bfor the purpose of\b/gi, 'for'],
    [/\bin the event that\b/gi, 'if']
  ];
  
  for (const [pattern, replacement] of shortenings) {
    compressed = compressed.replace(pattern, replacement);
  }
  
  // If still too long, truncate intelligently
  if (compressed.length > maxLength) {
    // Find a good breakpoint (end of sentence)
    const truncateAt = compressed.lastIndexOf('.', maxLength - 50);
    if (truncateAt > maxLength * 0.7) {
      compressed = compressed.substring(0, truncateAt + 1) + ' [truncated]';
    } else {
      compressed = compressed.substring(0, maxLength - 15) + '... [truncated]';
    }
  }
  
  return {
    compressed,
    originalLength: prompt.length,
    compressedLength: compressed.length,
    ratio: compressed.length / prompt.length,
    tokensSaved: Math.round((prompt.length - compressed.length) / 4)
  };
}

// =============================================================================
// COT REASONING ENGINE
// =============================================================================

export async function executeCoTReasoning(task, options = {}) {
  const {
    context = {},
    maxSteps = 7,
    minSteps = 3,
    requireEvidence = true,
    outputSchema = null,
    compress = true
  } = options;
  
  // Compress context if needed
  const contextStr = JSON.stringify(context);
  const processedContext = compress && contextStr.length > 2000
    ? compressPrompt(contextStr, { maxLength: 2000 })
    : { compressed: contextStr };
  
  const prompt = `${COT_SYSTEM_PROMPT}

TASK: ${task}

CONTEXT:
${processedContext.compressed}

Provide your reasoning in ${minSteps}-${maxSteps} explicit steps.
${requireEvidence ? 'Each step MUST include supporting evidence.' : ''}

Respond with a JSON object containing:
- reasoning_trace: Array of steps with step_number, step_type, thought, evidence[], confidence
- final_answer: Object with conclusion, confidence, key_insights[], limitations[]
- metadata: Object with total_steps, reasoning_path, alternative_considered`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: outputSchema || DEFAULT_COT_SCHEMA
  });
  
  // Validate the output
  const validation = validateCoTOutput(result);
  
  return {
    success: validation.valid,
    result,
    validation,
    compression: processedContext.ratio !== 1 ? processedContext : null
  };
}

// =============================================================================
// DUAL-PATH REASONING
// =============================================================================

export async function executeDualPathReasoning(task, options = {}) {
  const { context = {}, arbiterWeight = { conservative: 0.5, optimistic: 0.5 } } = options;
  
  const dualPathSchema = {
    type: "object",
    properties: {
      path_a: {
        type: "object",
        properties: {
          name: { type: "string" },
          steps: { type: "array", items: { type: "object", properties: { thought: { type: "string" }, evidence: { type: "string" } } } },
          conclusion: { type: "string" },
          confidence: { type: "string" },
          risks_identified: { type: "array", items: { type: "string" } }
        }
      },
      path_b: {
        type: "object",
        properties: {
          name: { type: "string" },
          steps: { type: "array", items: { type: "object", properties: { thought: { type: "string" }, evidence: { type: "string" } } } },
          conclusion: { type: "string" },
          confidence: { type: "string" },
          opportunities_identified: { type: "array", items: { type: "string" } }
        }
      },
      arbiter: {
        type: "object",
        properties: {
          agreements: { type: "array", items: { type: "string" } },
          disagreements: { type: "array", items: { type: "string" } },
          final_synthesis: { type: "string" },
          recommended_action: { type: "string" },
          confidence: { type: "string" }
        }
      }
    }
  };
  
  const prompt = `${DUAL_PATH_PROMPT}

TASK: ${task}

CONTEXT:
${JSON.stringify(context)}

Respond with a JSON object containing path_a (Conservative), path_b (Optimistic), and arbiter analysis.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: dualPathSchema
  });
  
  // Calculate weighted confidence
  const pathAConfidence = confidenceToScore(result.path_a?.confidence);
  const pathBConfidence = confidenceToScore(result.path_b?.confidence);
  const weightedConfidence = (
    pathAConfidence * arbiterWeight.conservative + 
    pathBConfidence * arbiterWeight.optimistic
  );
  
  return {
    success: true,
    result,
    paths: {
      conservative: result.path_a,
      optimistic: result.path_b
    },
    synthesis: result.arbiter,
    weightedConfidence: scoreToConfidence(weightedConfidence)
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

export function validateCoTOutput(output) {
  const errors = [];
  const warnings = [];
  
  // Check reasoning trace
  if (!output.reasoning_trace || !Array.isArray(output.reasoning_trace)) {
    errors.push('Missing or invalid reasoning_trace');
  } else {
    if (output.reasoning_trace.length < 2) {
      warnings.push('Reasoning trace has fewer than 2 steps');
    }
    
    output.reasoning_trace.forEach((step, i) => {
      if (!step.thought) {
        errors.push(`Step ${i + 1} missing thought`);
      }
      if (!step.confidence) {
        warnings.push(`Step ${i + 1} missing confidence`);
      }
    });
  }
  
  // Check final answer
  if (!output.final_answer) {
    errors.push('Missing final_answer');
  } else {
    if (!output.final_answer.conclusion) {
      errors.push('Missing conclusion in final_answer');
    }
  }
  
  // Check for logical consistency
  if (output.reasoning_trace && output.final_answer) {
    const lastStep = output.reasoning_trace[output.reasoning_trace.length - 1];
    if (lastStep?.confidence === 'low' && output.final_answer.confidence === 'high') {
      warnings.push('Confidence inconsistency: low confidence step leads to high confidence conclusion');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    quality: errors.length === 0 && warnings.length === 0 ? 'high' : 
             errors.length === 0 ? 'medium' : 'low'
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function confidenceToScore(confidence) {
  const scores = { high: 0.9, medium: 0.6, low: 0.3, uncertain: 0.1 };
  return scores[confidence?.toLowerCase()] || 0.5;
}

function scoreToConfidence(score) {
  if (score >= 0.8) return 'high';
  if (score >= 0.5) return 'medium';
  if (score >= 0.2) return 'low';
  return 'uncertain';
}

// =============================================================================
// REASONING TEMPLATES
// =============================================================================

export const ReasoningTemplates = {
  problemSolving: (problem) => ({
    task: `Solve this problem: ${problem}`,
    steps: [
      { type: ReasoningStepType.ANALYZE, prompt: 'Understand the problem statement and constraints' },
      { type: ReasoningStepType.DECOMPOSE, prompt: 'Break into sub-problems' },
      { type: ReasoningStepType.EVALUATE, prompt: 'Consider possible approaches' },
      { type: ReasoningStepType.SYNTHESIZE, prompt: 'Develop a solution' },
      { type: ReasoningStepType.VALIDATE, prompt: 'Verify the solution' },
      { type: ReasoningStepType.CONCLUDE, prompt: 'Present final answer' }
    ]
  }),
  
  decisionMaking: (decision) => ({
    task: `Make a decision: ${decision}`,
    steps: [
      { type: ReasoningStepType.ANALYZE, prompt: 'Identify the decision criteria' },
      { type: ReasoningStepType.DECOMPOSE, prompt: 'List all options' },
      { type: ReasoningStepType.EVALUATE, prompt: 'Evaluate each option against criteria' },
      { type: ReasoningStepType.SYNTHESIZE, prompt: 'Weigh trade-offs' },
      { type: ReasoningStepType.CONCLUDE, prompt: 'Recommend a decision with rationale' }
    ]
  }),
  
  rootCauseAnalysis: (issue) => ({
    task: `Find root cause: ${issue}`,
    steps: [
      { type: ReasoningStepType.ANALYZE, prompt: 'Define the problem symptoms' },
      { type: ReasoningStepType.DECOMPOSE, prompt: 'Apply 5 Whys analysis' },
      { type: ReasoningStepType.EVALUATE, prompt: 'Identify contributing factors' },
      { type: ReasoningStepType.VALIDATE, prompt: 'Test each hypothesis' },
      { type: ReasoningStepType.CONCLUDE, prompt: 'Identify root cause(s)' }
    ]
  })
};

// =============================================================================
// COST TRACKING
// =============================================================================

export function estimateCoTCost(taskLength, contextLength, steps = 5) {
  // Rough estimation: 4 chars ≈ 1 token
  const inputTokens = Math.ceil((taskLength + contextLength + 500) / 4); // +500 for system prompt
  const outputTokens = steps * 150; // ~150 tokens per step
  
  // GPT-4 pricing (approximate)
  const inputCostPer1K = 0.03;
  const outputCostPer1K = 0.06;
  
  const estimatedCost = (
    (inputTokens / 1000) * inputCostPer1K +
    (outputTokens / 1000) * outputCostPer1K
  );
  
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCostUSD: Math.round(estimatedCost * 10000) / 10000,
    estimatedCostCents: Math.round(estimatedCost * 100)
  };
}