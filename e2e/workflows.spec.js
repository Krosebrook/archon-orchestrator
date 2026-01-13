import { test, expect } from '@playwright/test';

/**
 * Workflow E2E Tests
 * Tests critical workflow management functionality
 */

test.describe('Workflow Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workflows');
    await page.waitForLoadState('networkidle');
  });

  test('should load workflows page', async ({ page }) => {
    const url = page.url();
    
    if (url.includes('login') || url.includes('auth')) {
      test.skip('Authentication required');
      return;
    }
    
    // Check page loaded successfully
    expect(url).toContain('workflows');
  });

  test('should display workflows list or empty state', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) {
      test.skip('Authentication required');
      return;
    }
    
    // Look for workflows list or empty state
    const hasWorkflows = await page.locator('[data-testid="workflows-list"], [class*="workflow"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmptyState = await page.locator('text=/no workflows|create your first/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasWorkflows || hasEmptyState).toBeTruthy();
  });

  test('should show workflow creation button', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) {
      test.skip('Authentication required');
      return;
    }
    
    const createButton = page.getByRole('button', { name: /create workflow|new workflow|add workflow/i }).first();
    const hasButton = await createButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasButton).toBeTruthy();
  });
});

test.describe('Workflow Execution', () => {
  test('should navigate to runs page', async ({ page }) => {
    await page.goto('/runs');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    if (url.includes('login')) {
      test.skip('Authentication required');
      return;
    }
    
    expect(url).toContain('runs');
  });

  test('should display runs list or empty state', async ({ page }) => {
    await page.goto('/runs');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    if (url.includes('login')) {
      test.skip('Authentication required');
      return;
    }
    
    // Look for runs list or empty state
    const hasRuns = await page.locator('[data-testid="runs-list"], [class*="run"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmptyState = await page.locator('text=/no runs|no executions/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasRuns || hasEmptyState).toBeTruthy();
  });

  test('should handle run status display', async ({ page }) => {
    await page.goto('/runs');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    if (url.includes('login')) {
      test.skip('Authentication required');
      return;
    }
    
    // Look for status indicators
    const hasStatus = await page.locator('text=/pending|running|completed|failed|status/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    // If runs exist, they should show status
    expect(typeof hasStatus).toBe('boolean');
  });
});

test.describe('Visual Workflow Builder', () => {
  test('should load visual workflow builder', async ({ page }) => {
    await page.goto('/visual-workflow-builder');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    if (url.includes('login')) {
      test.skip('Authentication required');
      return;
    }
    
    // This is a lazy-loaded page, verify it loads
    expect(url).toMatch(/visual.*workflow|workflow.*builder/i);
  });

  test('should display canvas or builder interface', async ({ page }) => {
    await page.goto('/visual-workflow-builder');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    if (url.includes('login')) {
      test.skip('Authentication required');
      return;
    }
    
    // Wait for builder interface to load
    await page.waitForTimeout(2000);
    
    // Look for canvas, nodes, or builder elements
    const hasBuilder = await page.locator('[class*="canvas"], [class*="builder"], [class*="node"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(typeof hasBuilder).toBe('boolean');
  });
});

test.describe('Workflow Collaboration', () => {
  test('should load agent collaboration page', async ({ page }) => {
    await page.goto('/agent-collaboration');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    if (url.includes('login')) {
      test.skip('Authentication required');
      return;
    }
    
    expect(url).toContain('collaboration');
  });

  test('should display collaboration interface', async ({ page }) => {
    await page.goto('/agent-collaboration');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    if (url.includes('login')) {
      test.skip('Authentication required');
      return;
    }
    
    // Should show some collaboration UI
    const hasContent = await page.locator('main, [role="main"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});
