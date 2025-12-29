import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate GDPR/CCPA compliance reports
 * Analyzes data access, retention, consent, and violations
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can generate compliance reports
    if (user.role !== 'admin' && user.role !== 'owner') {
      return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { 
      report_type = 'gdpr',
      days_back = 30,
    } = await req.json();

    const now = new Date();
    const periodStart = new Date(now.getTime() - (days_back * 24 * 60 * 60 * 1000));

    // Fetch relevant data
    const [redactionLogs, audits, policies] = await Promise.all([
      base44.asServiceRole.entities.DataRedactionLog.filter({
        org_id: user.organization.id,
        timestamp: { $gte: periodStart.toISOString() },
      }, 'timestamp', 10000),
      base44.asServiceRole.entities.Audit.filter({
        org_id: user.organization.id,
        timestamp: { $gte: periodStart.toISOString() },
      }, 'timestamp', 10000),
      base44.asServiceRole.entities.DataPrivacyPolicy.filter({
        org_id: user.organization.id,
        status: 'active',
      }),
    ]);

    // Calculate metrics
    const metrics = {
      data_access_requests: audits.filter(a => a.action === 'data_access_request').length,
      data_deletion_requests: audits.filter(a => a.action === 'data_deletion_request').length,
      consent_granted: audits.filter(a => a.action === 'consent_granted').length,
      consent_revoked: audits.filter(a => a.action === 'consent_revoked').length,
      redaction_events: redactionLogs.length,
      policy_violations: 0, // Would detect violations based on rules
      average_response_time_hours: 24, // Would calculate from actual response times
    };

    // Detect violations
    const violations = detectViolations(audits, policies, report_type);
    metrics.policy_violations = violations.length;

    // Determine status
    let status = 'compliant';
    if (violations.some(v => v.severity === 'critical')) {
      status = 'non_compliant';
    } else if (violations.some(v => v.severity === 'high')) {
      status = 'at_risk';
    }

    // Generate recommendations
    const recommendations = generateRecommendations(metrics, violations, report_type);

    // Create report
    const report = await base44.asServiceRole.entities.ComplianceReport.create({
      report_type,
      period_start: periodStart.toISOString(),
      period_end: now.toISOString(),
      metrics,
      violations,
      recommendations,
      status,
      generated_by: user.email,
      org_id: user.organization.id,
    });

    return Response.json({
      success: true,
      report,
      summary: {
        status,
        total_violations: violations.length,
        critical_violations: violations.filter(v => v.severity === 'critical').length,
        recommendations_count: recommendations.length,
      },
    });

  } catch (error) {
    console.error('Compliance report error:', error);
    return Response.json({ 
      error: error.message,
      trace_id: `COMPLIANCE_ERROR_${Date.now()}`,
    }, { status: 500 });
  }
});

function detectViolations(audits, policies, reportType) {
  const violations = [];

  // Check for data retention violations
  const oldDataAccess = audits.filter(a => {
    const age = Date.now() - new Date(a.timestamp).getTime();
    return age > (365 * 24 * 60 * 60 * 1000); // Over 1 year
  });

  if (oldDataAccess.length > 0) {
    violations.push({
      violation_type: 'data_retention',
      description: `${oldDataAccess.length} audit records older than 1 year without documented retention justification`,
      severity: 'medium',
      timestamp: new Date().toISOString(),
      resolved: false,
    });
  }

  // Check for missing consent
  if (reportType === 'gdpr') {
    const processingWithoutConsent = audits.filter(a => 
      a.action.includes('process') && !a.metadata?.consent_id
    );

    if (processingWithoutConsent.length > 0) {
      violations.push({
        violation_type: 'missing_consent',
        description: `${processingWithoutConsent.length} data processing actions without documented consent`,
        severity: 'high',
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    }
  }

  // Check for delayed responses
  if (reportType === 'ccpa') {
    const delayedRequests = audits.filter(a => 
      a.action.includes('request') && 
      a.metadata?.response_time_hours > 45 * 24 // Over 45 days
    );

    if (delayedRequests.length > 0) {
      violations.push({
        violation_type: 'delayed_response',
        description: `${delayedRequests.length} data requests not responded to within 45 days`,
        severity: 'critical',
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    }
  }

  return violations;
}

function generateRecommendations(metrics, violations, reportType) {
  const recommendations = [];

  if (violations.some(v => v.violation_type === 'data_retention')) {
    recommendations.push(
      'Implement automated data retention policies with configurable periods',
      'Review and document retention justification for all long-term data',
      'Set up automated deletion workflows for expired data'
    );
  }

  if (violations.some(v => v.violation_type === 'missing_consent')) {
    recommendations.push(
      'Implement consent tracking for all data processing activities',
      'Add consent verification step before sensitive operations',
      'Create user-facing consent management portal'
    );
  }

  if (metrics.redaction_events === 0) {
    recommendations.push(
      'Enable automated PII redaction for agent inputs/outputs',
      'Review and activate data privacy policies',
      'Train agents on sensitive data handling'
    );
  }

  if (reportType === 'gdpr') {
    recommendations.push(
      'Document legal basis for all data processing activities',
      'Ensure data portability mechanisms are in place',
      'Maintain up-to-date records of processing activities (ROPA)'
    );
  }

  if (reportType === 'ccpa') {
    recommendations.push(
      'Provide clear opt-out mechanisms for data sales',
      'Implement "Do Not Sell My Personal Information" link',
      'Ensure consumers can access and delete their data within 45 days'
    );
  }

  return recommendations;
}