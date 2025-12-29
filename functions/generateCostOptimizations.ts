import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate AI-driven cost optimization recommendations
 * Analyzes usage patterns and suggests improvements
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scope = 'organization', scope_id = null, lookback_days = 30 } = await req.json();

    const now = new Date();
    const lookbackDate = new Date(now.getTime() - (lookback_days * 24 * 60 * 60 * 1000));

    // Fetch metrics and agents
    let metricsFilter = {
      timestamp: { $gte: lookbackDate.toISOString() },
      org_id: user.organization.id,
    };

    if (scope === 'agent' && scope_id) {
      metricsFilter.agent_id = scope_id;
    }

    const [metrics, agents] = await Promise.all([
      base44.asServiceRole.entities.AgentMetric.filter(metricsFilter, 'timestamp', 10000),
      base44.asServiceRole.entities.Agent.filter({ org_id: user.organization.id }),
    ]);

    if (metrics.length < 10) {
      return Response.json({
        error: 'Insufficient data for optimization analysis',
        hint: 'Need at least 10 metric entries',
      }, { status: 400 });
    }

    // Analyze and generate recommendations
    const recommendations = [];
    
    // 1. Model selection analysis
    const modelRecs = analyzeModelUsage(metrics, agents);
    recommendations.push(...modelRecs);
    
    // 2. Token optimization
    const tokenRecs = analyzeTokenUsage(metrics);
    recommendations.push(...tokenRecs);
    
    // 3. Caching opportunities
    const cacheRecs = analyzeCachingOpportunities(metrics);
    recommendations.push(...cacheRecs);
    
    // 4. Scheduling optimization
    const scheduleRecs = analyzeScheduling(metrics);
    recommendations.push(...scheduleRecs);

    // Use AI to enhance recommendations
    const enhancedRecs = await enhanceRecommendationsWithAI(
      recommendations,
      { metrics, agents, scope, scope_id }
    );

    // Store recommendations
    const stored = [];
    for (const rec of enhancedRecs) {
      const record = await base44.asServiceRole.entities.CostOptimizationRecommendation.create({
        ...rec,
        scope,
        scope_id,
        status: 'new',
        org_id: user.organization.id,
      });
      stored.push(record);
    }

    return Response.json({
      success: true,
      recommendations: stored,
      summary: {
        total_recommendations: stored.length,
        estimated_total_savings: stored.reduce((sum, r) => sum + (r.estimated_savings_cents || 0), 0),
        high_priority_count: stored.filter(r => r.priority === 'high' || r.priority === 'critical').length,
      },
    });

  } catch (error) {
    console.error('Optimization generation error:', error);
    return Response.json({ 
      error: error.message,
      trace_id: `OPTIMIZE_ERROR_${Date.now()}`,
    }, { status: 500 });
  }
});

function analyzeModelUsage(metrics, agents) {
  const recommendations = [];
  const modelUsage = new Map();

  // Aggregate by agent and model
  for (const metric of metrics) {
    const key = `${metric.agent_id}_${metric.model}`;
    const current = modelUsage.get(key) || {
      agent_id: metric.agent_id,
      model: metric.model,
      count: 0,
      total_cost: 0,
      total_tokens: 0,
      avg_latency: 0,
    };
    
    current.count++;
    current.total_cost += metric.cost_cents || 0;
    current.total_tokens += (metric.prompt_tokens || 0) + (metric.completion_tokens || 0);
    current.avg_latency = ((current.avg_latency * (current.count - 1)) + (metric.latency_ms || 0)) / current.count;
    
    modelUsage.set(key, current);
  }

  // Identify expensive models that could be downgraded
  for (const [key, usage] of modelUsage.entries()) {
    if (usage.model.includes('gpt-4') && usage.count > 50) {
      const avgCostPerCall = usage.total_cost / usage.count;
      const estimatedSavings = Math.round(avgCostPerCall * 0.4 * usage.count); // 40% savings estimate
      
      recommendations.push({
        title: `Consider downgrading from ${usage.model} for simpler tasks`,
        description: `Agent is using ${usage.model} which costs significantly more than GPT-3.5. For ${usage.count} calls with average latency of ${usage.avg_latency.toFixed(0)}ms, consider using gpt-3.5-turbo for simpler operations.`,
        category: 'model_selection',
        priority: estimatedSavings > 1000 ? 'high' : 'medium',
        estimated_savings_cents: estimatedSavings,
        estimated_savings_percentage: 40,
        implementation_effort: 'low',
        actionable_steps: [
          'Analyze task complexity for this agent',
          'Test with gpt-3.5-turbo on sample inputs',
          'Compare output quality vs. cost savings',
          'Update agent configuration if acceptable',
        ],
        current_config: { model: usage.model },
        recommended_config: { model: 'gpt-3.5-turbo' },
      });
    }
  }

  return recommendations;
}

function analyzeTokenUsage(metrics) {
  const recommendations = [];
  
  // Calculate prompt/completion ratio
  const avgPromptTokens = metrics.reduce((sum, m) => sum + (m.prompt_tokens || 0), 0) / metrics.length;
  const avgCompletionTokens = metrics.reduce((sum, m) => sum + (m.completion_tokens || 0), 0) / metrics.length;

  if (avgPromptTokens > 2000) {
    recommendations.push({
      title: 'Reduce average prompt size',
      description: `Your average prompt size is ${avgPromptTokens.toFixed(0)} tokens, which is quite large. Consider summarizing context, removing redundant instructions, or using prompt templates.`,
      category: 'token_optimization',
      priority: 'high',
      estimated_savings_cents: Math.round((avgPromptTokens - 1000) * 0.002 * metrics.length),
      estimated_savings_percentage: 30,
      implementation_effort: 'medium',
      actionable_steps: [
        'Review and optimize system prompts',
        'Implement prompt caching for repeated instructions',
        'Use function calling instead of verbose examples',
        'Summarize long context before passing to agent',
      ],
      current_config: { avg_prompt_tokens: Math.round(avgPromptTokens) },
      recommended_config: { target_prompt_tokens: 1000 },
    });
  }

  if (avgCompletionTokens > 1000) {
    recommendations.push({
      title: 'Limit completion length with max_tokens',
      description: `Average completion is ${avgCompletionTokens.toFixed(0)} tokens. Setting appropriate max_tokens can prevent unnecessarily long responses.`,
      category: 'token_optimization',
      priority: 'medium',
      estimated_savings_cents: Math.round((avgCompletionTokens - 500) * 0.002 * metrics.length),
      estimated_savings_percentage: 25,
      implementation_effort: 'low',
      actionable_steps: [
        'Analyze whether full completion length is needed',
        'Set max_tokens parameter based on use case',
        'Use stop sequences to end responses early',
      ],
      current_config: { avg_completion_tokens: Math.round(avgCompletionTokens) },
      recommended_config: { max_tokens: 500 },
    });
  }

  return recommendations;
}

function analyzeCachingOpportunities(metrics) {
  const recommendations = [];
  
  // Look for repeated calls (simplified - in production, would analyze actual prompts)
  const agentCallCounts = new Map();
  
  for (const metric of metrics) {
    const count = agentCallCounts.get(metric.agent_id) || 0;
    agentCallCounts.set(metric.agent_id, count + 1);
  }

  for (const [agentId, count] of agentCallCounts.entries()) {
    if (count > 100) {
      recommendations.push({
        title: 'Implement response caching',
        description: `This agent has ${count} calls in the analysis period. Implementing a cache for common queries could significantly reduce costs.`,
        category: 'caching',
        priority: 'high',
        estimated_savings_cents: Math.round(count * 0.3 * 2), // 30% cache hit rate assumption
        estimated_savings_percentage: 30,
        implementation_effort: 'medium',
        actionable_steps: [
          'Identify common/repeated queries',
          'Implement Redis or in-memory cache',
          'Set appropriate TTL based on data freshness needs',
          'Monitor cache hit rates',
        ],
        current_config: { caching_enabled: false },
        recommended_config: { caching_enabled: true, cache_ttl: 3600 },
      });
    }
  }

  return recommendations;
}

function analyzeScheduling(metrics) {
  const recommendations = [];
  
  // Analyze time distribution
  const hourCounts = new Array(24).fill(0);
  
  for (const metric of metrics) {
    const hour = new Date(metric.timestamp).getHours();
    hourCounts[hour]++;
  }

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const offPeakHours = hourCounts.filter((_, h) => h < 6 || h > 22).reduce((a, b) => a + b, 0);
  
  if (offPeakHours > metrics.length * 0.3) {
    recommendations.push({
      title: 'Batch non-urgent operations during off-peak',
      description: 'Significant usage during off-peak hours. Consider batching these operations to negotiate better rates or use reserved capacity.',
      category: 'scheduling',
      priority: 'low',
      estimated_savings_cents: Math.round(offPeakHours * 0.5),
      estimated_savings_percentage: 10,
      implementation_effort: 'medium',
      actionable_steps: [
        'Identify non-time-sensitive operations',
        'Implement job queue for batch processing',
        'Schedule batch jobs during lowest usage periods',
      ],
      current_config: { batching: false },
      recommended_config: { batching: true, batch_window: '2-5am' },
    });
  }

  return recommendations;
}

async function enhanceRecommendationsWithAI(recommendations, context) {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY || recommendations.length === 0) {
    return recommendations;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: 'You are a cost optimization expert for AI systems. Enhance the given recommendations with specific, actionable insights.',
        }, {
          role: 'user',
          content: `Given these preliminary cost optimization recommendations:\n\n${JSON.stringify(recommendations, null, 2)}\n\nAnd this context: ${context.metrics.length} metrics, ${context.agents.length} agents.\n\nProvide enhanced descriptions and additional implementation details for the top 3 recommendations. Return as JSON array with enhanced 'description' and 'actionable_steps' fields.`,
        }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const enhanced = JSON.parse(data.choices[0].message.content);
      
      // Merge enhanced data back
      return recommendations.map((rec, i) => ({
        ...rec,
        ...(enhanced[i] || {}),
      }));
    }
  } catch (error) {
    console.warn('AI enhancement failed:', error);
  }

  return recommendations;
}