# Archon Orchestrator

**Enterprise AI Agent Orchestration Platform**

[![Built with Base44](https://img.shields.io/badge/Built%20with-Base44-blue)](https://base44.com)
[![React](https://img.shields.io/badge/React-18.2-61dafb)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.1-646cff)](https://vitejs.dev)

Archon Orchestrator is a comprehensive enterprise platform for managing, training, monitoring, and orchestrating AI agents with built-in governance, compliance, and cost management features. Built on modern technologies, it provides a scalable foundation for AI-powered workflows across your organization.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [Technology Stack](#%EF%B8%8F-technology-stack)
- [Architecture](#-architecture)
- [Documentation](#-documentation)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Security](#-security)
- [Support](#-support)
- [License](#-license)

---

## 🌟 Overview

Archon Orchestrator enables organizations to harness the power of AI agents with confidence through robust governance, monitoring, and collaboration tools. Whether you're managing AI-powered CI/CD pipelines, building intelligent workflows, or ensuring regulatory compliance, Archon provides the tools you need.

### Target Audience

- **Enterprise DevOps Teams** - AI-powered CI/CD pipelines
- **AI/ML Engineers** - Building and training AI agents
- **Data Scientists** - Creating intelligent workflows
- **IT Operations** - Monitoring and maintaining AI systems
- **Compliance Officers** - Ensuring regulatory compliance
- **Business Analysts** - Analyzing AI performance and costs

### Project Statistics

- **Lines of Code:** ~10,500+
- **Frontend Components:** 337 React components
- **Pages/Routes:** 46 distinct pages
- **Backend Functions:** 54 TypeScript serverless functions
- **Test Files:** 5 test suites with comprehensive coverage
- **Component Categories:** 44 feature domains

---

## 🎯 Key Features

### 🤖 Agent Management
- Create, configure, and manage AI agents with multiple providers (OpenAI, Anthropic, etc.)
- Agent versioning and lifecycle management
- Agent collaboration and multi-agent workflows
- Persona-based agent identity and memory
- Performance metrics and behavior analysis

### 🔄 Workflow Orchestration
- Visual workflow builder with drag-and-drop interface
- Pre-built workflow templates
- Multi-agent coordination
- Conditional logic and branching
- Human-in-the-loop approvals
- Workflow versioning and rollback

### 📊 Monitoring & Observability
- Real-time dashboards and analytics
- Performance metrics and cost tracking
- Distributed tracing with trace IDs
- Agent execution logs and debugging
- Anomaly detection and alerting
- System health monitoring

### 🛡️ Governance & Compliance
- Role-based access control (RBAC)
- Policy management and simulation
- Comprehensive audit logging
- Compliance reporting
- Data redaction and privacy controls
- Export capabilities for audits

### 💰 Cost Management
- Real-time cost tracking per agent/workflow
- Cost optimization recommendations
- Forecasting and budgeting
- Token usage analytics
- Provider cost comparison

### 🔌 Integration & Extensibility
- 50+ serverless backend functions
- RESTful API design
- Webhook support for external systems
- Connector marketplace
- Custom tool integration
- Skills and capability marketplace

### 🔬 Training & Optimization
- AI-driven agent training
- Synthetic training data generation
- Behavior adaptation and learning
- A/B testing framework
- Performance optimization suggestions

### 🚀 CI/CD Integration
- Automated deployment pipelines
- Git branch management
- Approval workflows
- Rollback capabilities
- Environment management

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Deno** 1.40+ (for backend functions)
- **Git** for version control
- **Base44 Account** - [Sign up at base44.com](https://base44.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/Krosebrook/archon-orchestrator.git
cd archon-orchestrator

# Install dependencies
npm install

# Configure environment (create .env file)
cp .env.example .env
# Edit .env with your Base44 credentials
```

### Development

```bash
# Start development server (frontend)
npm run dev

# The app will be available at http://localhost:5173
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting & Type Checking

```bash
# Run ESLint
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Type checking (via jsconfig.json)
npm run typecheck
```

### Testing

```bash
# Run all tests once
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

**Test Statistics:**
- ✅ 8 test suites with 120 tests total
- ✅ 114 tests passing (6 pre-existing failures in errorHandler tests)
- 📊 Test infrastructure: Vitest 4.0.16 + Testing Library + JSDOM
- 🎯 Test coverage: Components, hooks, utilities, and error handling
- 🧪 Test utilities: Custom providers for TanStack Query and React Router
- 📁 Test files: button.test.jsx, StatCard.test.jsx, useAsync.test.jsx, errorHandler.test.js, errorLogger.test.js, validation.test.jsx, utils tests

See [TESTING.md](./TESTING.md) and [TESTING_IMPLEMENTATION.md](./TESTING_IMPLEMENTATION.md) for detailed testing guide.

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Type checking (via tsconfig.json)
npm run typecheck
```

**Code Quality Metrics:**
- ✅ 0 ESLint errors (100% resolution)
- ✅ 49 ESLint warnings (down from 182 - 73% reduction)
- ✅ TypeScript configuration in place (tsconfig.json)
- ✅ 401 .jsx files, 19 .ts files (migration to TypeScript ongoing)
- 📊 All remaining warnings are intentional (unused error parameters in catch blocks)

---

## 🏗️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2 | UI framework |
| **Vite** | 6.1 | Build tool and dev server |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework |
| **Radix UI** | Latest | Accessible UI components |
| **TanStack Query** | 5.84 | Server state management |
| **React Router** | 6.26 | Client-side routing |
| **React Hook Form** | 7.54 | Form management |
| **Zod** | 3.24 | Schema validation |
| **Framer Motion** | 11.16 | Animation library |
| **Recharts** | 2.15 | Data visualization |
| **Lucide React** | Latest | Icon library |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Deno** | 1.40+ | TypeScript runtime |
| **Base44 SDK** | 0.8.3 - 0.8.6 | Backend framework (functions use 0.8.4-0.8.6) |
| **TypeScript** | 5.8 | Type safety |

### Development Tools

- **ESLint** 9.19 - Code linting
- **Vitest** 4.0.16 - Unit testing framework
- **Testing Library** - React component testing
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

---

## 🏛️ Architecture

Archon Orchestrator follows a modern, scalable architecture:

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Pages    │  │  Components  │  │  State (Query)   │   │
│  │  (46 routes)│  │  (334 files) │  │  Management      │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Base44 SDK (0.8.3)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │    Auth     │  │  Entities   │  │   Integrations   │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           Backend Functions (Deno/TypeScript)               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │Agent Mgmt    │  │Workflow Exec │  │Monitoring       │  │
│  │Training      │  │Cost Tracking │  │Audit/Compliance │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Patterns

- **Component-Based Architecture** - Modular, reusable React components
- **Serverless Functions** - Edge-deployed Deno functions for scalability
- **Entity-Driven Design** - Base44 entity system for data management
- **Query-Based State** - TanStack Query for server state synchronization
- **RBAC** - Role-based access control throughout the platform
- **Audit-First Design** - Comprehensive logging for compliance

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 📚 Documentation

### Core Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture deep-dive
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes
- **[API.md](./API.md)** - API reference documentation
- **[AGENTS.md](./AGENTS.md)** - Agent module documentation

### Planning & Strategy

- **[PRD.md](./PRD.md)** - Product requirements document
- **[ROADMAP.md](./ROADMAP.md)** - Feature roadmap and timeline
- **[AUDIT.md](./AUDIT.md)** - Codebase audit findings
- **[RECOMMENDATIONS.md](./RECOMMENDATIONS.md)** - Best practices and recommendations

### Technical Guides

- **[src/docs/api/](./src/docs/api/)** - API endpoint documentation
- **[src/docs/architecture/](./src/docs/architecture/)** - Architecture diagrams
- **[src/docs/runbooks/](./src/docs/runbooks/)** - Operational runbooks

---

## 💻 Development

### Project Structure

```
archon-orchestrator/
├── functions/              # Backend Deno functions (54)
│   ├── createAgent.ts
│   ├── executeAgent.ts
│   ├── runWorkflow.ts
│   └── ...
├── src/
│   ├── api/               # API client utilities
│   ├── components/        # React components (337 files)
│   │   ├── ui/           # UI primitives (Radix-based)
│   │   ├── dashboard/    # Dashboard components
│   │   ├── workflow-builder/
│   │   └── ...
│   ├── docs/             # In-app documentation
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── pages/            # Page components (46 routes)
│   ├── utils/            # Utility functions
│   ├── App.jsx           # Root component
│   └── main.jsx          # Entry point
├── public/               # Static assets
├── tests/                # Test files (5 test suites)
├── index.html            # HTML template
├── package.json          # Dependencies
├── vite.config.js        # Vite configuration
├── vitest.config.js      # Vitest test configuration
├── tailwind.config.js    # Tailwind configuration
└── eslint.config.js      # ESLint configuration
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code patterns
   - Use TypeScript for backend functions
   - Follow React best practices for frontend

3. **Write tests**
   ```bash
   # Run tests in watch mode while developing
   npm run test:watch
   
   # Run all tests
   npm test
   
   # Check coverage
   npm run test:coverage
   ```

4. **Test your changes**
   ```bash
   npm run lint
   npm run typecheck
   npm run build
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Provide clear description
   - Reference any related issues
   - Wait for review

### Code Style Guidelines

- **React Components**: Use functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions/variables
- **File Organization**: Co-locate related files (component + styles + tests)
- **State Management**: Use TanStack Query for server state, useState for UI state
- **Error Handling**: Always handle errors gracefully with user feedback
- **Accessibility**: Follow WCAG 2.1 AA standards

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## 🚢 Deployment

### Production Build

```bash
# Create optimized production build
npm run build

# Output will be in ./dist directory
```

### Deployment Options

1. **Base44 Platform** (Recommended)
   - Integrated deployment via Base44 CLI
   - Automatic serverless function deployment
   - Built-in scaling and monitoring

2. **Static Hosting**
   - Deploy `dist/` folder to any static host
   - Netlify, Vercel, Cloudflare Pages compatible
   - Configure backend functions separately

3. **Self-Hosted**
   - Use nginx or Apache to serve `dist/`
   - Deploy Deno functions to your infrastructure
   - Configure environment variables

### Environment Variables

Create a `.env` file with:

```bash
VITE_BASE44_PROJECT_ID=your_project_id
VITE_BASE44_API_URL=https://api.base44.com
# Add other required variables
```

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Commit your changes** (`git commit -m 'feat: add amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style and patterns
- Write clear commit messages (use Conventional Commits)
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines.

---

## 🔒 Security

Security is a top priority for Archon Orchestrator.

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities. Instead:

1. Email security concerns to: [Add security contact]
2. Include detailed description of the vulnerability
3. Provide steps to reproduce if possible

We will respond within 48 hours and work with you to address the issue.

### Security Features

- **Authentication**: Base44 authentication system
- **RBAC**: Role-based access control
- **Audit Logging**: Comprehensive audit trails
- **Data Encryption**: Encrypted data at rest and in transit
- **Secure Secrets**: Environment-based secret management
- **Input Validation**: Zod schema validation throughout

---

## 🛣️ Roadmap

### Current Phase: Foundation Strengthening (Q1 2026)

- ✅ Core platform development complete
- ✅ Testing infrastructure implemented (Vitest + Testing Library)
- ✅ Comprehensive documentation suite
- 🔄 Expanding test coverage
- 🔄 Performance optimization ongoing

### Upcoming Phases

- **Q2 2026**: AI Enhancement & Training
- **Q3 2026**: Enterprise Features & Security Hardening
- **Q4 2026**: Scale & Performance Optimization
- **Q1 2027**: Intelligence & Automation
- **Q2 2027**: Ecosystem & Community Building

See [ROADMAP.md](./ROADMAP.md) for detailed timeline and features.

---

## 💬 Support

### Getting Help

- **Documentation**: Check [docs](./src/docs)
- **Issues**: [GitHub Issues](https://github.com/Krosebrook/archon-orchestrator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Krosebrook/archon-orchestrator/discussions)
- **Base44 Support**: [base44.com/support](https://base44.com/support)

### Community

- Follow development updates
- Share feedback and feature requests
- Contribute to discussions

---

## 📄 License

[Add license information - MIT, Apache 2.0, etc.]

---

## 🙏 Acknowledgments

- Built with [Base44](https://base44.com)
- UI components from [Radix UI](https://radix-ui.com)
- Icons from [Lucide](https://lucide.dev)
- And all our [contributors](https://github.com/Krosebrook/archon-orchestrator/graphs/contributors)

---

## 🔗 Links

- **Website**: [Add website URL]
- **Base44 Platform**: https://base44.com
- **GitHub**: https://github.com/Krosebrook/archon-orchestrator
- **Documentation**: [./src/docs](./src/docs)

---

**Built with ❤️ by the Archon team using Base44**
