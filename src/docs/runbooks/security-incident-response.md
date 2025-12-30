# Runbook: Security Incident Response

**Severity:** Critical  
**Last Updated:** December 30, 2025  
**Owner:** Security Team

---

## Overview

Procedures for responding to security incidents in Archon Orchestrator.

---

## ⚠️ IMMEDIATE ACTIONS

If you suspect a security incident:

1. **DO NOT DELAY** - Act immediately
2. **NOTIFY** security team: security@archon.io
3. **PRESERVE** evidence - don't delete logs
4. **DOCUMENT** everything you observe

---

## Incident Classification

### Severity Levels

**P0 - Critical:**
- Data breach
- Unauthorized access to production
- Ransomware/malware
- DDoS attack affecting service

**P1 - High:**
- Suspected compromise
- Privilege escalation
- API abuse
- Authentication bypass

**P2 - Medium:**
- Suspicious activity
- Failed intrusion attempts
- Policy violations

**P3 - Low:**
- Security configuration issues
- Non-critical vulnerabilities

---

## Response Procedures

### P0: Data Breach

**IMMEDIATE (0-15 min):**

1. **Contain the breach**
   ```bash
   # Isolate affected systems
   kubectl cordon node-affected
   
   # Rotate all credentials
   ./scripts/rotate-all-credentials.sh
   
   # Enable enhanced logging
   kubectl set env deployment/archon-api LOG_LEVEL=debug
   ```

2. **Notify stakeholders**
   - Security team
   - Legal team
   - Executive team
   - Affected customers (if confirmed)

3. **Preserve evidence**
   ```bash
   # Snapshot all logs
   kubectl logs --all-namespaces > incident-logs-$(date +%s).log
   
   # Backup database
   pg_dump archon_db > incident-db-backup-$(date +%s).sql
   ```

**SHORT-TERM (15 min - 4 hours):**

4. **Investigate scope**
   ```typescript
   // Audit log analysis
   const suspiciousActivity = await sdk.functions.invoke('auditLogAnalysis', {
     timeRange: { last: '24h' },
     severity: 'high',
     anomalies: true
   });
   ```

5. **Assess impact**
   - What data was accessed?
   - How many users affected?
   - What systems compromised?

6. **Implement additional controls**
   ```bash
   # Enable MFA for all users
   # Block suspicious IPs
   # Revoke compromised API keys
   ```

**MEDIUM-TERM (4-48 hours):**

7. **Root cause analysis**
8. **Remediation**
9. **Security hardening**
10. **Customer communication**

---

### P1: Unauthorized Access Attempt

**Steps:**

1. **Identify attack vector**
   ```bash
   # Review auth logs
   cat /var/log/auth.log | grep "Failed"
   
   # Check firewall logs
   sudo iptables -L -n -v
   ```

2. **Block attacker**
   ```bash
   # Block IP immediately
   sudo iptables -A INPUT -s <ATTACKER_IP> -j DROP
   
   # Update WAF rules
   ./scripts/update-waf-rules.sh --block <IP>
   ```

3. **Review access logs**
   ```typescript
   const accessAttempts = await sdk.entities.query('AccessLog', {
     filters: {
       ip: attackerIP,
       timestamp: { $gt: Date.now() - 24 * 60 * 60 * 1000 }
     }
   });
   ```

4. **Force password resets** (if credentials compromised)

---

### P2: API Abuse

**Steps:**

1. **Identify abusive pattern**
   ```typescript
   const abuse = await sdk.functions.invoke('detectAPIAbuse', {
     timeRange: { last: '1h' }
   });
   ```

2. **Rate limit the source**
   ```bash
   # Implement stricter rate limits
   redis-cli SET rate_limit:$API_KEY 10
   ```

3. **Investigate intent**
   - Misconfigured client?
   - Malicious actor?
   - Security researcher?

4. **Contact user** (if legitimate)

---

## Evidence Collection

### What to Collect

1. **System Logs**
   ```bash
   # Application logs
   kubectl logs deployment/archon-api > app-logs.txt
   
   # System logs
   journalctl --since "1 hour ago" > system-logs.txt
   
   # Database logs
   tail -1000 /var/log/postgresql/postgresql.log > db-logs.txt
   ```

2. **Network Traffic**
   ```bash
   # Capture network traffic
   tcpdump -i eth0 -w incident-$(date +%s).pcap
   ```

3. **Audit Logs**
   ```typescript
   const auditLogs = await sdk.functions.invoke('exportAuditLog', {
     timeRange: { start, end },
     format: 'json'
   });
   ```

4. **System State**
   ```bash
   # Process list
   ps aux > process-list.txt
   
   # Network connections
   netstat -tupan > network-connections.txt
   
   # File integrity
   tripwire --check > integrity-check.txt
   ```

---

## Communication

### Internal Notification

**Slack Channel:** `#security-incidents`

**Template:**
```
🚨 SECURITY INCIDENT - P[0/1/2/3]

Type: [Data Breach / Unauthorized Access / etc]
Detected: [TIME]
Status: [Investigating / Contained / Resolved]

Impact:
- [Summary of impact]

Actions Taken:
- [List actions]

Next Steps:
- [What's next]

POC: [Name]
```

### Customer Notification

**When Required:**
- Personal data accessed
- Service disruption >4 hours
- Legal/regulatory requirement

**Template:**
```
Subject: Security Incident Notification

Dear [Customer],

We are writing to inform you of a security incident
that may have affected your Archon Orchestrator account...

What happened:
[Brief description]

What data was involved:
[Specific data types]

What we're doing:
[Actions taken]

What you should do:
[Recommended actions]

Questions: security@archon.io
```

---

## Post-Incident

### Post-Mortem

Conduct within 48 hours:

1. **Timeline reconstruction**
2. **Root cause analysis**
3. **Response evaluation**
4. **Lessons learned**
5. **Action items**

### Follow-Up Actions

- Implement security improvements
- Update runbooks
- Train team on lessons learned
- Review and update security policies
- Schedule security audit

---

## Prevention

### Security Best Practices

1. **Regular Security Audits**
   - Monthly vulnerability scans
   - Quarterly penetration testing
   - Annual third-party audits

2. **Access Control**
   - Principle of least privilege
   - Regular access reviews
   - MFA for all users
   - API key rotation

3. **Monitoring & Detection**
   ```yaml
   security_monitoring:
     - failed_login_attempts
     - unusual_api_patterns
     - data_access_anomalies
     - privilege_escalations
     - configuration_changes
   ```

4. **Patch Management**
   - Apply security patches within 48 hours
   - Regular dependency updates
   - Automated vulnerability scanning

---

## Contacts

**Security Team:** security@archon.io  
**24/7 Hotline:** +1-XXX-XXX-XXXX  
**Legal:** legal@archon.io  
**PR/Comms:** pr@archon.io

**External:**
- Law Enforcement: [Contact info]
- Cyber Insurance: [Policy #, Contact]
- Forensics Partner: [Contact info]

---

## Compliance

### Regulatory Requirements

- **GDPR:** Notify within 72 hours
- **CCPA:** Notify without unreasonable delay
- **SOC 2:** Document all incidents
- **HIPAA:** Notify within 60 days

---

**Maintainer:** Security Team  
**Classification:** Confidential  
**Last Review:** December 30, 2025  
**Next Review:** Q1 2025
