/**
 * @fileoverview Onboarding Tour Configuration
 * @description Defines tour steps for new user onboarding
 * @version 1.0.0
 */

export const tourSteps = [
  {
    id: 'welcome',
    target: null,
    title: 'Welcome to Archon',
    content: 'Let\'s take a quick tour of the platform\'s key features. This will only take a minute!',
    placement: 'center',
    showSkip: true,
  },
  {
    id: 'templates',
    target: '[data-tour="templates-link"]',
    title: 'Template Library',
    content: 'Browse pre-built workflow templates to quickly get started. Each template includes AI-powered agents and best practices.',
    placement: 'right',
    page: 'Dashboard',
  },
  {
    id: 'template-card',
    target: '[data-tour="template-card"]',
    title: 'Template Features',
    content: 'Each template shows complexity, estimated cost, and usage stats. Click "Customize" to adapt it or "Use Now" to deploy immediately.',
    placement: 'top',
    page: 'Templates',
    highlight: true,
  },
  {
    id: 'customizer',
    target: '[data-tour="customize-button"]',
    title: 'AI-Powered Customization',
    content: 'Use natural language to customize workflows. Our AI will modify the template to match your specific requirements.',
    placement: 'bottom',
    page: 'Templates',
  },
  {
    id: 'workflows',
    target: '[data-tour="workflows-link"]',
    title: 'Your Workflows',
    content: 'View and manage all your workflows here. Monitor status, run history, and performance metrics.',
    placement: 'right',
    page: 'Dashboard',
  },
  {
    id: 'runs',
    target: '[data-tour="runs-link"]',
    title: 'Workflow Monitoring',
    content: 'Track workflow executions in real-time. View logs, inspect agent decisions, and debug issues.',
    placement: 'right',
    page: 'Dashboard',
  },
  {
    id: 'knowledge-base',
    target: '[data-tour="help-button"]',
    title: 'Need Help?',
    content: 'Access our knowledge base anytime for best practices, troubleshooting guides, and integration documentation.',
    placement: 'left',
  },
  {
    id: 'complete',
    target: null,
    title: 'You\'re All Set!',
    content: 'You\'re ready to build powerful AI workflows. Start by exploring templates or create your own from scratch.',
    placement: 'center',
    showSkip: false,
  },
];

export const helpArticles = [
  {
    id: 'getting-started',
    category: 'Getting Started',
    title: 'Quick Start Guide',
    description: 'Learn the basics of creating and deploying workflows',
    tags: ['basics', 'tutorial', 'beginner'],
    content: `
# Quick Start Guide

## Creating Your First Workflow

1. **Browse Templates**: Navigate to the Templates page to explore pre-built workflows
2. **Customize or Deploy**: Either customize the template to your needs or deploy it immediately
3. **Monitor Execution**: Track your workflow runs in the Runs page

## Best Practices

- Start with templates for common use cases
- Use descriptive names for workflows and agents
- Test workflows in staging before production deployment
- Monitor costs and performance regularly

## Next Steps

- Explore agent collaboration features
- Set up integrations with external services
- Configure approval workflows for production deployments
    `,
  },
  {
    id: 'template-customization',
    category: 'Templates',
    title: 'Customizing Workflow Templates',
    description: 'How to adapt templates to your specific requirements',
    tags: ['templates', 'customization', 'ai'],
    content: `
# Customizing Workflow Templates

## AI-Powered Customization

Our AI assistant can modify templates using natural language:

**Example Prompts:**
- "Add error handling for API timeouts"
- "Include a step to send email notifications"
- "Change the data processing to use batch mode"

## Manual Customization

You can also edit workflows directly in the Visual Workflow Builder:
- Drag and drop nodes
- Configure agent parameters
- Set up conditional logic
- Add integrations

## Saving Custom Templates

Save your customized workflows as templates to reuse across your organization.
    `,
  },
  {
    id: 'monitoring-workflows',
    category: 'Monitoring',
    title: 'Monitoring Workflow Executions',
    description: 'Track and debug workflow runs',
    tags: ['monitoring', 'debugging', 'logs'],
    content: `
# Monitoring Workflow Executions

## Real-Time Tracking

View live execution status in the Runs page:
- Current step being executed
- Agent interactions and decisions
- Data flow between nodes
- Performance metrics

## Debugging Failed Runs

When a workflow fails:
1. Check the error message and stack trace
2. Review agent logs for decision context
3. Inspect input/output data at each step
4. Use the AI Debugger for automatic suggestions

## Performance Optimization

Monitor these key metrics:
- **Latency**: Total execution time
- **Cost**: Token usage and API calls
- **Success Rate**: Percentage of successful runs
- **Resource Usage**: Memory and CPU utilization
    `,
  },
  {
    id: 'agent-configuration',
    category: 'Agents',
    title: 'Configuring AI Agents',
    description: 'Best practices for agent setup and optimization',
    tags: ['agents', 'configuration', 'best practices'],
    content: `
# Configuring AI Agents

## Choosing the Right Model

- **GPT-4**: Best for complex reasoning and planning
- **GPT-3.5-turbo**: Fast and cost-effective for simple tasks
- **Claude-3**: Excellent for long context and analysis

## Temperature Settings

- **0.0-0.3**: Deterministic, factual responses
- **0.4-0.7**: Balanced creativity and consistency
- **0.8-1.0**: More creative and varied outputs

## Prompt Engineering Tips

1. Be specific about desired output format
2. Provide examples when possible
3. Use system prompts to set behavior guidelines
4. Test different prompt variations

## Token Management

- Set max_tokens to control costs
- Use streaming for better UX
- Monitor token usage per run
    `,
  },
  {
    id: 'integrations',
    category: 'Integrations',
    title: 'Setting Up External Integrations',
    description: 'Connect external services and APIs',
    tags: ['integrations', 'api', 'setup'],
    content: `
# Setting Up External Integrations

## Available Integrations

- **Slack**: Send notifications and updates
- **GitHub**: Trigger workflows on code events
- **AWS S3**: Store and retrieve files
- **Google Drive**: Access documents
- **Stripe**: Handle payment events
- **Custom APIs**: Connect any REST API

## Configuration Steps

1. Navigate to Integrations page
2. Select the service to connect
3. Provide credentials (API keys, tokens)
4. Test the connection
5. Use in workflows via integration nodes

## Security Best Practices

- Use environment variables for secrets
- Rotate API keys regularly
- Implement least-privilege access
- Enable audit logging
    `,
  },
  {
    id: 'troubleshooting-common-issues',
    category: 'Troubleshooting',
    title: 'Common Issues and Solutions',
    description: 'Quick fixes for frequent problems',
    tags: ['troubleshooting', 'errors', 'fixes'],
    content: `
# Common Issues and Solutions

## Workflow Not Starting

**Problem**: Workflow remains in "pending" state

**Solutions**:
- Check trigger configuration
- Verify agent availability
- Review approval requirements
- Check rate limits

## Agent Timeout Errors

**Problem**: Agent execution times out

**Solutions**:
- Increase timeout settings
- Optimize prompt length
- Use faster model variant
- Split complex tasks into steps

## Integration Connection Failures

**Problem**: External service integration fails

**Solutions**:
- Verify API credentials
- Check service status
- Review rate limits
- Test connection manually

## High Costs

**Problem**: Unexpected token usage

**Solutions**:
- Review agent model selection
- Optimize prompts
- Set token limits
- Use caching when possible
- Monitor usage dashboards
    `,
  },
  {
    id: 'approval-workflows',
    category: 'Governance',
    title: 'Setting Up Approval Workflows',
    description: 'Configure human-in-the-loop approvals',
    tags: ['approvals', 'governance', 'compliance'],
    content: `
# Setting Up Approval Workflows

## When to Use Approvals

- Production deployments
- High-cost operations
- Sensitive data access
- External communications

## Configuration

1. Add approval node to workflow
2. Specify required approvers (role or user)
3. Set timeout for approval requests
4. Configure fallback behavior

## Approval Process

1. Workflow pauses at approval node
2. Notification sent to approvers
3. Approver reviews context and data
4. Approve/reject with optional comments
5. Workflow continues or halts

## Best Practices

- Document approval criteria
- Set reasonable timeouts
- Use role-based approvers
- Track approval metrics
    `,
  },
];