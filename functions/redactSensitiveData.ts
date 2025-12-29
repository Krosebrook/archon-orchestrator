import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from 'node:crypto';

/**
 * Redact sensitive data based on privacy policies
 * Supports PII detection and multiple redaction strategies
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      content, 
      policy_id,
      data_type = 'prompt',
      agent_id = null,
      run_id = null,
    } = await req.json();
    
    if (!content || !policy_id) {
      return Response.json({ 
        error: 'content and policy_id are required' 
      }, { status: 400 });
    }

    // Fetch policy
    const policies = await base44.asServiceRole.entities.DataPrivacyPolicy.filter({
      id: policy_id,
      status: 'active',
    });

    if (!policies.length) {
      return Response.json({ error: 'Policy not found or inactive' }, { status: 404 });
    }

    const policy = policies[0];

    // Apply redaction rules
    let redactedContent = content;
    let redactionCount = 0;
    const patternsMatched = [];

    for (const rule of policy.redaction_rules || []) {
      const result = applyRedactionRule(redactedContent, rule);
      redactedContent = result.content;
      redactionCount += result.count;
      if (result.count > 0) {
        patternsMatched.push(rule.pattern_type);
      }
    }

    // Additional PII detection using built-in patterns
    if (policy.data_categories.includes('pii')) {
      const piiResult = detectAndRedactPII(redactedContent);
      redactedContent = piiResult.content;
      redactionCount += piiResult.count;
      patternsMatched.push(...piiResult.patterns);
    }

    // Create hash of original for audit
    const originalHash = createHash('sha256').update(content).digest('hex');

    // Log redaction event
    await base44.asServiceRole.entities.DataRedactionLog.create({
      policy_id,
      agent_id,
      run_id,
      data_type,
      redaction_count: redactionCount,
      patterns_matched: [...new Set(patternsMatched)],
      original_hash: originalHash,
      redacted_preview: redactedContent.slice(0, 200),
      timestamp: new Date().toISOString(),
      org_id: user.organization.id,
    });

    return Response.json({
      success: true,
      redacted_content: redactedContent,
      redaction_count: redactionCount,
      patterns_matched: [...new Set(patternsMatched)],
      original_hash: originalHash,
    });

  } catch (error) {
    console.error('Redaction error:', error);
    return Response.json({ 
      error: error.message,
      trace_id: `REDACT_ERROR_${Date.now()}`,
    }, { status: 500 });
  }
});

function applyRedactionRule(content, rule) {
  let count = 0;
  let result = content;

  let pattern;
  if (rule.pattern_type === 'custom_regex' && rule.regex) {
    pattern = new RegExp(rule.regex, 'gi');
  } else {
    pattern = getBuiltInPattern(rule.pattern_type);
  }

  if (!pattern) return { content, count: 0 };

  const matches = content.match(pattern) || [];
  count = matches.length;

  if (count > 0) {
    switch (rule.replacement) {
      case 'mask':
        result = content.replace(pattern, (match) => '*'.repeat(match.length));
        break;
      case 'hash':
        result = content.replace(pattern, (match) => 
          createHash('sha256').update(match).digest('hex').slice(0, 16)
        );
        break;
      case 'remove':
        result = content.replace(pattern, '[REDACTED]');
        break;
      case 'tokenize':
        result = content.replace(pattern, () => `[TOKEN_${Date.now()}_${Math.random().toString(36).slice(2)}]`);
        break;
    }
  }

  return { content: result, count };
}

function getBuiltInPattern(type) {
  const patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    credit_card: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  };
  return patterns[type];
}

function detectAndRedactPII(content) {
  let result = content;
  let count = 0;
  const patterns = [];

  // Email
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  if (emailPattern.test(content)) {
    result = result.replace(emailPattern, '[EMAIL_REDACTED]');
    count += (content.match(emailPattern) || []).length;
    patterns.push('email');
  }

  // Phone numbers
  const phonePattern = /\b(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g;
  if (phonePattern.test(result)) {
    result = result.replace(phonePattern, '[PHONE_REDACTED]');
    count += (result.match(phonePattern) || []).length;
    patterns.push('phone');
  }

  // SSN
  const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
  if (ssnPattern.test(result)) {
    result = result.replace(ssnPattern, '[SSN_REDACTED]');
    count += (result.match(ssnPattern) || []).length;
    patterns.push('ssn');
  }

  // Credit cards
  const ccPattern = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
  if (ccPattern.test(result)) {
    result = result.replace(ccPattern, '[CC_REDACTED]');
    count += (result.match(ccPattern) || []).length;
    patterns.push('credit_card');
  }

  return { content: result, count, patterns };
}