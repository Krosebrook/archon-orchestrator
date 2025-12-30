# Runbook: Disaster Recovery

**Severity:** Critical  
**Last Updated:** December 30, 2025  
**Owner:** Infrastructure Team

---

## Overview

Disaster recovery procedures for restoring Archon Orchestrator services following a catastrophic event.

---

## Recovery Time Objectives (RTO/RPO)

| Service Tier | RTO | RPO |
|--------------|-----|-----|
| Critical (API, Auth) | 1 hour | 5 minutes |
| High (Agents, Workflows) | 4 hours | 15 minutes |
| Medium (Analytics) | 8 hours | 1 hour |
| Low (Reports) | 24 hours | 24 hours |

---

## Disaster Scenarios

### Scenario 1: Complete Region Failure

**Trigger:** Primary AWS region unavailable

**Steps:**

1. **Activate DR Site** (0-15 min)
   ```bash
   # Failover to DR region
   ./scripts/dr-failover.sh --region us-west-2
   
   # Update DNS
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z123 \
     --change-batch file://dns-failover.json
   ```

2. **Verify Services** (15-30 min)
   ```bash
   # Health check all services
   ./scripts/health-check-all.sh
   
   # Verify database replication
   psql -c "SELECT pg_last_wal_receive_lsn();"
   ```

3. **Resume Operations** (30-60 min)
   - Monitor error rates
   - Verify data integrity
   - Communicate status to users

---

### Scenario 2: Database Corruption

**Trigger:** Database inconsistency or corruption detected

**Steps:**

1. **Stop Writes** (0-5 min)
   ```bash
   # Enable read-only mode
   kubectl scale deployment archon-api --replicas=0
   
   # Backup current state
   pg_dump archon_db > corruption-backup-$(date +%s).sql
   ```

2. **Restore from Backup** (5-45 min)
   ```bash
   # Restore latest good backup
   psql archon_db < backups/latest-good-backup.sql
   
   # Verify integrity
   psql -c "SELECT count(*) FROM agents;"
   psql -c "SELECT count(*) FROM workflows;"
   ```

3. **Replay Transaction Log** (if RPO < backup age)
   ```bash
   # Apply WAL files
   pg_waldump /path/to/wal
   ```

4. **Resume Service** (45-60 min)
   ```bash
   # Scale up
   kubectl scale deployment archon-api --replicas=5
   
   # Monitor for issues
   kubectl logs -f deployment/archon-api
   ```

---

### Scenario 3: Ransomware Attack

**Trigger:** Ransomware detected, systems encrypted

**Steps:**

1. **Isolate Systems** (0-10 min)
   ```bash
   # Disconnect all servers
   for node in $(kubectl get nodes -o name); do
     kubectl drain $node
   done
   
   # Block all external traffic
   aws ec2 modify-security-group --group-id sg-123 --ip-permissions IpProtocol=-1
   ```

2. **Assess Damage** (10-30 min)
   - Identify encrypted systems
   - Check backup integrity
   - Verify backups aren't compromised

3. **Restore from Clean Backups** (30 min - 4 hours)
   ```bash
   # Spin up new infrastructure
   terraform apply -target=module.compute
   
   # Restore data
   ./scripts/restore-all-services.sh --from-backup 2025-12-29
   
   # Deploy clean application code
   ./scripts/deploy-clean.sh
   ```

4. **Security Hardening** (Ongoing)
   - Patch all vulnerabilities
   - Reset all credentials
   - Enhanced monitoring

---

### Scenario 4: Data Center Failure

**Trigger:** Physical data center unavailable

**Steps:**

1. **Activate Cloud Failover** (0-15 min)
   ```bash
   # Spin up cloud infrastructure
   terraform workspace select dr-cloud
   terraform apply -auto-approve
   ```

2. **Restore Data** (15-60 min)
   ```bash
   # Restore from offsite backups
   aws s3 sync s3://archon-backups/latest ./restore/
   
   # Import to new database
   psql -h new-db-host -U admin archon_db < restore/db-backup.sql
   ```

3. **Redirect Traffic** (60-90 min)
   ```bash
   # Update DNS to cloud
   ./scripts/update-dns-cloud.sh
   
   # Monitor traffic shift
   watch -n 5 'curl -s https://api.archon.io/health'
   ```

---

## Recovery Procedures

### Database Recovery

**From Point-in-Time Backup:**
```bash
# Restore to specific timestamp
pg_restore -h localhost -U admin -d archon_db \
  --clean --if-exists \
  backups/archon-db-2025-12-30-10-00.dump

# Verify data
psql -d archon_db -c "SELECT count(*) FROM agents;"
```

**From Continuous Backup:**
```bash
# Restore with Point-in-Time Recovery (PITR)
pg_basebackup -h primary -D /var/lib/postgresql/data
# Edit recovery.conf
echo "recovery_target_time = '2025-12-30 10:00:00'" >> recovery.conf
# Start PostgreSQL
pg_ctl start
```

---

### Application Recovery

**From Container Registry:**
```bash
# Pull latest known-good images
docker pull registry.archon.io/archon-api:v1.2.3
docker pull registry.archon.io/archon-worker:v1.2.3

# Deploy
kubectl set image deployment/archon-api \
  archon-api=registry.archon.io/archon-api:v1.2.3
```

**From Source:**
```bash
# Clone specific version
git clone -b v1.2.3 https://github.com/archon/orchestrator
cd orchestrator

# Build and deploy
npm install
npm run build
npm run deploy:production
```

---

### Configuration Recovery

**From Git:**
```bash
# Restore configurations
git clone https://github.com/archon/infrastructure-config
cd infrastructure-config

# Apply Terraform
terraform init
terraform apply

# Apply Kubernetes configs
kubectl apply -f kubernetes/
```

**From Backup:**
```bash
# Restore config files
aws s3 sync s3://archon-backups/config/latest ./config/

# Apply
./scripts/apply-config.sh
```

---

## Backup Verification

### Daily Verification

```bash
#!/bin/bash
# Automated backup verification

# 1. Check backup exists
if [ ! -f "backups/daily-$(date +%Y-%m-%d).sql" ]; then
  echo "ERROR: Daily backup missing"
  exit 1
fi

# 2. Verify backup integrity
pg_restore --list backups/daily-$(date +%Y-%m-%d).sql > /dev/null
if [ $? -ne 0 ]; then
  echo "ERROR: Backup corrupted"
  exit 1
fi

# 3. Test restore (on test instance)
psql -h test-db -d test_archon < backups/daily-$(date +%Y-%m-%d).sql
if [ $? -ne 0 ]; then
  echo "ERROR: Restore test failed"
  exit 1
fi

echo "SUCCESS: Backup verified"
```

---

## Communication Plan

### Status Page Updates

```bash
# Update status page
curl -X POST https://status.archon.io/api/incidents \
  -H "Authorization: Bearer $STATUS_API_KEY" \
  -d '{
    "name": "Service Disruption",
    "status": "investigating",
    "message": "We are investigating connectivity issues..."
  }'
```

### Customer Communication

**Email Template:**
```
Subject: [URGENT] Service Disruption - [DATE]

Dear Archon Orchestrator Users,

We are currently experiencing a service disruption affecting
[affected services]. Our team is actively working to restore
full functionality.

Current Status: [Investigating/Restoring/Resolved]
Affected Services: [List]
Estimated Resolution: [Time]

We will provide updates every [frequency].

Latest Update: [URL to status page]

We apologize for any inconvenience.

- Archon Team
```

---

## Testing & Drills

### Quarterly DR Drills

**Schedule:**
- Q1: Database failover
- Q2: Region failover  
- Q3: Full DR test
- Q4: Cyber attack simulation

**Drill Checklist:**
- [ ] Notify team 24h in advance
- [ ] Document start time
- [ ] Execute recovery procedures
- [ ] Measure RTO/RPO
- [ ] Document issues
- [ ] Update runbooks
- [ ] Conduct post-drill review

---

## Post-Recovery

### Validation Checklist

- [ ] All services responding
- [ ] Database integrity verified
- [ ] User authentication working
- [ ] API endpoints functional
- [ ] Agents can execute
- [ ] Workflows can run
- [ ] Monitoring active
- [ ] Backups resuming

### Post-Mortem

Document:
1. Incident timeline
2. Root cause
3. Impact assessment
4. Recovery actions
5. Lessons learned
6. Improvement actions

---

## Contact Information

**24/7 On-Call:** +1-XXX-XXX-XXXX  
**Infrastructure Lead:** infrastructure@archon.io  
**Escalation:** VP Engineering

**Vendors:**
- AWS Support: [Case URL]
- Database Support: [Contact]
- CDN Provider: [Contact]

---

## Backup Schedule

| Backup Type | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| Database Full | Daily | 30 days | S3 + Glacier |
| Database Incremental | Hourly | 7 days | S3 |
| Application Config | On change | 90 days | Git + S3 |
| User Data | Daily | 90 days | S3 + Glacier |
| Logs | Continuous | 1 year | CloudWatch |

---

**Maintainer:** Infrastructure Team  
**Classification:** Confidential  
**Last Review:** December 30, 2025  
**Next Drill:** Q1 2025
