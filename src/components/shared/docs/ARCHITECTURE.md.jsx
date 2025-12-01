/**
 * @fileoverview Architecture Documentation
 * This file contains the architecture documentation as a string export.
 * Access via: import { ARCHITECTURE_DOC } from '@/components/shared/docs/ARCHITECTURE.md';
 * 
 * @module shared/docs/ARCHITECTURE
 */

export const ARCHITECTURE_DOC = `
# Archon Architecture Documentation

> AI Agent Orchestration Platform - Technical Architecture

## Overview

Archon is an enterprise-grade AI agent orchestration platform built on Base44's hosting environment. This document describes the system architecture, design decisions, and key patterns.

## System Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Pages     │  │  Components │  │   Layout    │  │   Shared    │   │
│  │  (Routes)   │  │  (Features) │  │  (Shell)    │  │    (UI)     │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Hooks     │  │  Contexts   │  │   Utils     │  │  Providers  │   │
│  │ (useAsync,  │  │ (AuthCtx,   │  │ (api-client │  │  (Toast,    │   │
│  │  useRBAC)   │  │  Theme)     │  │  validation)│  │   Query)    │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             SERVICE LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  base44     │  │  Functions  │  │Integrations │  │   Agents    │   │
│  │   SDK       │  │  (Backend)  │  │  (OAuth)    │  │  (AI/LLM)   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Base44 Entities (RLS)                         │   │
│  │   Agent │ Workflow │ Run │ Policy │ Audit │ Metric │ Skill      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
\`\`\`

## Module Structure

### /components - UI Components

\`\`\`
components/
├── shared/               # Platform-wide shared utilities
│   ├── constants/        # Centralized configuration constants
│   ├── types/            # JSDoc type definitions
│   ├── ErrorBoundary.jsx # Error boundary component
│   ├── RBACGuard.jsx     # Permission guard component
│   └── ...
├── contexts/             # React contexts
│   └── AuthContext.jsx   # Authentication context
├── hooks/                # Custom React hooks
│   ├── useAsync.jsx      # Async state management
│   └── useRBAC.jsx       # RBAC permission hook
├── utils/                # Utility functions
│   ├── api-client.jsx    # API client with error handling
│   ├── validation.jsx    # Input validation & sanitization
│   ├── audit-logger.jsx  # Audit trail logging
│   ├── performance.jsx   # Performance utilities
│   └── cot-reasoning.jsx # AI reasoning engine
├── providers/            # Context providers
└── [feature]/            # Feature-specific components
\`\`\`

## Core Patterns

### 1. Error Handling (Circuit Breaker + Retry)

Features:
- Exponential backoff with jitter
- Circuit breaker (5 failures → open)
- Request deduplication (5s TTL)
- Correlation ID propagation
- Structured error taxonomy

### 2. Input Validation (Defense in Depth)

Features:
- XSS prevention (HTML escaping)
- Prompt injection detection (20+ patterns)
- Zod-like schema validation
- Sliding window rate limiting

### 3. Audit Trail (Tamper-Evident)

Features:
- SHA-256 integrity hashing
- Automatic PII redaction
- Session/correlation tracking
- Batch processing (10 entries, 5s flush)
- CSV/JSON export

### 4. Performance Optimization

Features:
- Performance budgets (300ms API, 1.5s AI)
- LRU cache with TTL
- Request batching
- Debounce/throttle with options
- Web Vitals monitoring (LCP, FID, CLS)
- Metrics collection with percentiles

### 5. AI Reasoning (Chain-of-Thought)

Features:
- Multi-step explicit reasoning
- Dual-path analysis with arbiter
- Prompt compression (filler removal)
- Cost estimation
- Output validation

## Security Architecture

### RBAC Model

\`\`\`
Owner ──▶ Admin ──▶ Operator ──▶ Viewer
  │         │          │           │
  │         │          │           └── view only
  │         │          └── run, create workflows
  │         └── manage agents, approve
  └── full access, delete, settings
\`\`\`

### Data Protection

| Layer | Protection |
|-------|------------|
| Input | XSS sanitization, prompt injection detection |
| Transport | HTTPS enforced |
| Storage | RLS by org_id, PII redaction in audits |
| Output | HTML escaping, content filtering |

## Performance Budgets

| Operation | Budget | Target P95 |
|-----------|--------|------------|
| API Call | 300ms | ~200ms |
| AI Call | 1500ms | ~1200ms |
| Render | 16ms | ~10ms |
| LCP | 2500ms | ~1800ms |

## ADR Index

| ADR | Decision |
|-----|----------|
| ADR-001 | Use Base44 SDK for data layer |
| ADR-002 | Circuit breaker over simple retry |
| ADR-003 | Client-side rate limiting |
| ADR-004 | Batch audit processing |
| ADR-005 | CoT reasoning for complex decisions |

---

*Last updated: 2025-12-01*
`;

export default ARCHITECTURE_DOC;