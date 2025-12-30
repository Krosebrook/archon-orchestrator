# Contributing to Archon Orchestrator

Thank you for your interest in contributing to Archon Orchestrator! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [How to Contribute](#how-to-contribute)
5. [Coding Standards](#coding-standards)
6. [Commit Guidelines](#commit-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Testing Guidelines](#testing-guidelines)
9. [Documentation](#documentation)
10. [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We pledge to:

- Be respectful and considerate
- Welcome diverse perspectives and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, trolling, or discriminatory language
- Personal attacks or insults
- Publishing private information without permission
- Spam or excessive self-promotion
- Any conduct that could be considered inappropriate

### Reporting

If you experience or witness unacceptable behavior, please report it to [Add contact email].

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** 18+ and npm installed
- **Deno** 1.40+ installed (for backend functions)
- **Git** for version control
- A **Base44 account** for testing
- Familiarity with React, TypeScript, and modern web development

### Finding Issues to Work On

1. Check the [Issues](https://github.com/Krosebrook/archon-orchestrator/issues) page
2. Look for issues labeled:
   - `good first issue` - Great for newcomers
   - `help wanted` - Community contributions welcome
   - `bug` - Bug fixes needed
   - `enhancement` - Feature requests
   - `documentation` - Documentation improvements

3. Comment on the issue to express interest and get assigned

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/archon-orchestrator.git
cd archon-orchestrator

# Add upstream remote
git remote add upstream https://github.com/Krosebrook/archon-orchestrator.git
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Verify Deno installation
deno --version
```

### 3. Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit .env with your Base44 credentials
# VITE_BASE44_PROJECT_ID=your_project_id
# VITE_BASE44_API_URL=https://api.base44.com
```

### 4. Start Development Server

```bash
# Start frontend dev server
npm run dev

# Open http://localhost:5173
```

### 5. Verify Setup

```bash
# Run linting
npm run lint

# Build project
npm run build
```

---

## How to Contribute

### Types of Contributions

1. **Bug Fixes** - Fix reported bugs or issues you discover
2. **Features** - Implement new features from the roadmap or your ideas
3. **Documentation** - Improve docs, add examples, fix typos
4. **Tests** - Add test coverage (we need this!)
5. **Performance** - Optimize code, reduce bundle size
6. **UI/UX** - Improve user interface and experience
7. **Refactoring** - Code quality improvements

### Contribution Workflow

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Follow coding standards (see below)
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
   ```bash
   npm run lint
   npm run build
   # Run any tests
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   # Follow commit guidelines (see below)
   ```

5. **Keep your branch updated**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create Pull Request**
   - Go to GitHub and create a PR
   - Fill out the PR template completely
   - Link related issues
   - Request review

---

## Coding Standards

### General Principles

1. **Keep it Simple** - Prefer simple, readable code over clever solutions
2. **DRY (Don't Repeat Yourself)** - Extract reusable logic
3. **Single Responsibility** - Each function/component should do one thing well
4. **Consistent Naming** - Use clear, descriptive names
5. **Comments** - Comment complex logic, not obvious code

### JavaScript/TypeScript Style

```javascript
// ✅ Good
function calculateTotalCost(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad
function calc(i) {
  let s = 0;
  for (let x of i) s += x.price;
  return s;
}
```

### React Component Style

```jsx
// ✅ Good - Functional component with clear structure
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function AgentCard({ agent, onExecute }) {
  const [isExecuting, setIsExecuting] = useState(false);
  
  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await onExecute(agent.id);
    } finally {
      setIsExecuting(false);
    }
  };
  
  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold">{agent.name}</h3>
      <p className="text-sm text-muted-foreground">{agent.description}</p>
      <Button onClick={handleExecute} disabled={isExecuting}>
        {isExecuting ? 'Executing...' : 'Execute'}
      </Button>
    </div>
  );
}

// ❌ Bad - Unclear, inconsistent
export default ({ a, e }) => {
  const [x, setX] = useState(false);
  return <div onClick={() => { setX(true); e(a.id); }}>
    <h3>{a.name}</h3>
  </div>;
};
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `AgentCard`, `WorkflowBuilder` |
| Functions | camelCase | `executeAgent`, `calculateCost` |
| Variables | camelCase | `isLoading`, `totalCost` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_URL` |
| Files (Components) | PascalCase | `AgentCard.jsx` |
| Files (Utils) | camelCase | `apiClient.js`, `validation.js` |
| CSS Classes | kebab-case | `agent-card`, `workflow-node` |

### File Organization

```
src/components/feature-name/
├── FeatureComponent.jsx      # Main component
├── FeatureComponent.css       # Styles (if needed)
├── FeatureComponent.test.jsx  # Tests
├── useFeatureHook.js          # Custom hooks
├── featureUtils.js            # Utility functions
└── index.js                   # Public exports
```

### Import Order

```javascript
// 1. React imports
import { useState, useEffect } from 'react';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';

// 3. UI components
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

// 4. Internal components
import { AgentCard } from '@/components/dashboard/AgentCard';

// 5. Utilities and helpers
import { formatDate } from '@/utils/date';
import { validateAgent } from '@/utils/validation';

// 6. Styles
import './styles.css';
```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear, semantic commit messages.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring (no feature change)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, tooling
- **ci**: CI/CD changes

### Examples

```bash
# Feature
feat(agents): add agent cloning functionality

Allows users to duplicate existing agents with new names.
Includes validation to prevent name conflicts.

Closes #123

# Bug fix
fix(workflow): resolve execution timeout issue

Increased timeout from 30s to 60s for complex workflows.
Added better error messaging for timeout scenarios.

Fixes #456

# Documentation
docs(readme): update installation instructions

Added prerequisites section and troubleshooting guide.

# Refactoring
refactor(api): extract common validation logic

Moved validation to utils/validation.js to reduce duplication
across multiple API client functions.
```

### Commit Best Practices

1. **Use present tense** - "add feature" not "added feature"
2. **Be concise** - Subject line under 72 characters
3. **Explain why** - Body explains reasoning, not what (code shows what)
4. **Reference issues** - Use "Closes #123" or "Fixes #456"
5. **One logical change** - One commit per logical change
6. **Test before committing** - Ensure code works

---

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No unnecessary files included
- [ ] All tests pass (when tests exist)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Refactoring
- [ ] Performance improvement

## Related Issues
Closes #123

## Changes Made
- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing
How to test these changes:
1. Step 1
2. Step 2
3. Expected result

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All checks passing
```

### Review Process

1. **Automated Checks** - Linting, build, tests must pass
2. **Code Review** - At least one maintainer approval required
3. **Testing** - Reviewer tests changes manually if needed
4. **Feedback** - Address review comments and update PR
5. **Approval** - Once approved, maintainer will merge

### After Your PR is Merged

1. **Delete your branch**
   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

2. **Update your fork**
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

3. **Celebrate!** 🎉 Your contribution is now part of Archon!

---

## Testing Guidelines

### Writing Tests

Currently, the project is setting up testing infrastructure. When tests are established:

```javascript
// Example test structure (Jest + React Testing Library)
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentCard } from './AgentCard';

describe('AgentCard', () => {
  const mockAgent = {
    id: '123',
    name: 'Test Agent',
    description: 'A test agent'
  };
  
  it('renders agent information', () => {
    render(<AgentCard agent={mockAgent} onExecute={jest.fn()} />);
    
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('A test agent')).toBeInTheDocument();
  });
  
  it('calls onExecute when button clicked', () => {
    const mockExecute = jest.fn();
    render(<AgentCard agent={mockAgent} onExecute={mockExecute} />);
    
    fireEvent.click(screen.getByText('Execute'));
    
    expect(mockExecute).toHaveBeenCalledWith('123');
  });
});
```

### Testing Priorities

1. **Critical paths** - Agent creation, workflow execution
2. **User interactions** - Form submissions, button clicks
3. **Error handling** - Network errors, validation errors
4. **Edge cases** - Empty states, loading states
5. **Accessibility** - Keyboard navigation, screen readers

---

## Documentation

### Documentation Standards

1. **Code Comments** - Explain complex logic
2. **JSDoc** - Document functions with parameters and return values
3. **README files** - Add README to complex feature directories
4. **API docs** - Document all backend functions
5. **User guides** - Update user-facing documentation

### Example Documentation

```javascript
/**
 * Executes an AI agent with the given prompt
 * 
 * @param {string} agentId - The unique identifier of the agent
 * @param {string} prompt - The prompt to send to the agent
 * @param {Object} options - Additional execution options
 * @param {number} options.timeout - Execution timeout in milliseconds
 * @param {Object} options.context - Additional context for the agent
 * @returns {Promise<Object>} The agent's response
 * @throws {Error} If agent not found or execution fails
 * 
 * @example
 * const result = await executeAgent('agent-123', 'Analyze this data', {
 *   timeout: 30000,
 *   context: { dataset: 'sales-2024' }
 * });
 */
async function executeAgent(agentId, prompt, options = {}) {
  // Implementation...
}
```

---

## Community

### Getting Help

- **GitHub Discussions** - Ask questions, share ideas
- **GitHub Issues** - Report bugs, request features
- **Documentation** - Check docs first
- **Code Examples** - Look at existing code

### Communication Channels

- **GitHub** - Primary communication platform
- **Issues** - Bug reports and feature requests
- **Discussions** - Questions and community chat
- **Pull Requests** - Code review and feedback

### Recognition

Contributors will be:
- Listed in the [Contributors](https://github.com/Krosebrook/archon-orchestrator/graphs/contributors) page
- Mentioned in release notes for significant contributions
- Given credit in documentation for major features

---

## Questions?

If you have questions about contributing:

1. Check this guide and other documentation
2. Search existing issues and discussions
3. Ask in GitHub Discussions
4. Create an issue with the `question` label

---

## Thank You!

Your contributions make Archon Orchestrator better for everyone. We appreciate your time and effort! 🙏

---

**Happy Contributing!** 🚀
