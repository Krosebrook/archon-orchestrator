# Contributing to Archon Orchestrator

Thank you for your interest in contributing to Archon Orchestrator! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Requirements](#testing-requirements)
6. [Documentation](#documentation)
7. [Pull Request Process](#pull-request-process)
8. [Reporting Bugs](#reporting-bugs)
9. [Feature Requests](#feature-requests)
10. [Community](#community)

---

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before contributing.

---

## Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **Deno** 1.40+ (for backend functions)
- **Git** for version control
- **Base44 Account** for SDK access

### Setting Up Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/archon-orchestrator.git
   cd archon-orchestrator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Base44 credentials
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Verify setup**
   ```bash
   # Open http://localhost:5173
   # You should see the Archon Orchestrator dashboard
   ```

---

## Development Workflow

### Branching Strategy

We follow a modified Git Flow:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature Branch

```bash
# Update develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add: description of changes"

# Push to your fork
git push origin feature/your-feature-name
```

### Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```bash
feat: add agent collaboration feature
fix: resolve memory leak in workflow execution
docs: update API documentation for training endpoints
test: add unit tests for agent creation
refactor: improve error handling in backend functions
```

---

## Coding Standards

### Frontend (React/JavaScript)

**File Structure:**
```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   └── [feature]/       # Feature-specific components
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and SDK setup
├── types/               # TypeScript type definitions
└── utils/               # Helper functions
```

**Component Guidelines:**

```jsx
// Use functional components with hooks
import React from 'react';

const MyComponent = ({ prop1, prop2 }) => {
  // Component logic
  
  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

**Styling:**
- Use Tailwind CSS for styling
- Follow existing patterns for consistency
- Keep responsive design in mind (mobile-first)

**State Management:**
- Use React Query for server state
- Use Context API for shared UI state
- Keep state as local as possible

### Backend (Deno/TypeScript)

**File Structure:**
```
functions/
├── [functionName].ts    # Individual function files
└── connectors/          # External service connectors
```

**Function Template:**

```typescript
import { sdk } from '@base44/sdk';

interface Input {
  // Define input type
}

interface Output {
  // Define output type
}

export default async function functionName(input: Input): Promise<Output> {
  try {
    // Validate input
    if (!input.required Field) {
      throw new Error('requiredField is required');
    }
    
    // Function logic
    const result = await performOperation(input);
    
    // Return output
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error in functionName:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Error Handling:**
- Always use try-catch blocks
- Log errors with context
- Return descriptive error messages
- Don't expose sensitive information in errors

---

## Testing Requirements

### Writing Tests

**Unit Tests:**
```javascript
// src/__tests__/unit/agentUtils.test.js
import { describe, it, expect } from 'vitest';
import { validateAgentConfig } from '@/utils/agentUtils';

describe('validateAgentConfig', () => {
  it('should validate valid config', () => {
    const config = {
      name: 'Test Agent',
      type: 'task'
    };
    expect(validateAgentConfig(config)).toBe(true);
  });
  
  it('should reject invalid config', () => {
    const config = {};
    expect(() => validateAgentConfig(config)).toThrow();
  });
});
```

**Component Tests:**
```javascript
// src/__tests__/integration/AgentCard.test.jsx
import { render, screen } from '@testing-library/react';
import { AgentCard } from '@/components/agents/AgentCard';

describe('AgentCard', () => {
  it('should render agent information', () => {
    const agent = {
      name: 'Test Agent',
      status: 'active'
    };
    
    render(<AgentCard agent={agent} />);
    
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test agentUtils.test.js

# Watch mode
npm run test:watch
```

### Coverage Requirements

- **Minimum**: 60% overall coverage
- **Target**: 80% coverage
- **Critical paths**: 100% coverage

---

## Documentation

### Documentation Standards

1. **Code Comments:**
   - Use JSDoc for functions and classes
   - Comment complex logic
   - Keep comments up-to-date

```javascript
/**
 * Validates agent configuration
 * @param {Object} config - Agent configuration object
 * @param {string} config.name - Agent name
 * @param {string} config.type - Agent type
 * @returns {boolean} True if valid
 * @throws {Error} If configuration is invalid
 */
function validateAgentConfig(config) {
  // Implementation
}
```

2. **README Updates:**
   - Update README.md if adding new features
   - Keep installation instructions current
   - Document new environment variables

3. **API Documentation:**
   - Document new API endpoints
   - Include request/response examples
   - Note any breaking changes

4. **Runbooks:**
   - Update operational runbooks for new features
   - Add troubleshooting steps
   - Document common issues

---

## Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout your-feature-branch
   git rebase develop
   ```

2. **Run tests**
   ```bash
   npm test
   npm run lint
   npm run typecheck  # If using TypeScript
   ```

3. **Update documentation**
   - Update CHANGELOG.md
   - Update relevant docs
   - Add JSDoc comments

4. **Self-review**
   - Review your own code
   - Check for console.logs or debug code
   - Verify no sensitive data

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin your-feature-branch
   ```

2. **Open PR on GitHub**
   - Go to the repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out PR template

3. **PR Title Format**
   ```
   [Type] Short description
   
   Examples:
   [Feature] Add agent collaboration
   [Fix] Resolve workflow timeout issue
   [Docs] Update API documentation
   ```

4. **PR Description Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] Manual testing completed
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] Tests pass
   - [ ] No new warnings
   
   ## Screenshots (if applicable)
   
   ## Related Issues
   Closes #123
   ```

### Review Process

1. **Automated Checks**
   - Tests must pass
   - Lint must pass
   - No security vulnerabilities

2. **Code Review**
   - At least one approval required
   - Address all review comments
   - Be open to feedback

3. **Merge**
   - Squash and merge (default)
   - Delete branch after merge

---

## Reporting Bugs

### Before Reporting

1. **Search existing issues**
   - Check if already reported
   - Add to existing issue if found

2. **Verify it's a bug**
   - Try to reproduce
   - Check documentation
   - Test on latest version

### Bug Report Template

```markdown
**Describe the bug**
A clear and concise description

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g., macOS 13.0]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 0.9.0]

**Additional context**
Any other relevant information
```

---

## Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Describe the problem

**Describe the solution you'd like**
Clear description of desired functionality

**Describe alternatives you've considered**
Other approaches considered

**Additional context**
Screenshots, mockups, examples

**Would you like to implement this feature?**
Yes/No
```

---

## Community

### Communication Channels

- **GitHub Discussions**: General discussion, Q&A
- **GitHub Issues**: Bug reports, feature requests
- **Slack**: [Join our Slack](https://archon-orchestrator.slack.com) (coming soon)
- **Discord**: [Join our Discord](https://discord.gg/archon) (coming soon)

### Getting Help

- **Documentation**: Check [docs](./README.md)
- **Discussions**: Ask in GitHub Discussions
- **Support**: support@archon.io

---

## Recognition

Contributors will be recognized in:
- CHANGELOG.md
- Contributors page
- Release notes
- Project website

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

---

## Questions?

If you have questions about contributing, feel free to:
- Open a GitHub Discussion
- Email: opensource@archon.io

---

**Thank you for contributing to Archon Orchestrator!**

Together, we're building the future of AI agent orchestration.

---

**Last Updated:** December 30, 2025
