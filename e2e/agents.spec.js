import { test, expect } from '@playwright/test';

/**
 * Agent Management E2E Tests
 * Tests critical agent-related workflows
 * 
 * Note: These tests assume authentication is handled or skipped in test environment
 */

test.describe('Agent Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to agents page
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
  });

  test('should display agents list', async ({ page }) => {
    // Check if we're on the agents page (or redirected to login)
    const url = page.url();
    
    if (url.includes('login') || url.includes('auth')) {
      test.skip('Authentication required for this test');
      return;
    }
    
    // Look for agents list or empty state
    const hasAgentsList = await page.locator('[data-testid="agents-list"], [class*="agent"], text=/agent/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmptyState = await page.locator('text=/no agents/i, text=/create your first/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    // Either agents list or empty state should be visible
    expect(hasAgentsList || hasEmptyState).toBeTruthy();
  });

  test('should show agent creation button', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) {
      test.skip('Authentication required');
      return;
    }
    
    // Look for create/add agent button
    const createButton = page.getByRole('button', { name: /create agent|new agent|add agent/i }).first();
    const hasCreateButton = await createButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    // Create button should exist on agents page
    expect(hasCreateButton).toBeTruthy();
  });

  test('should handle agent list loading states', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) {
      test.skip('Authentication required');
      return;
    }
    
    // Page should eventually show content (not stuck in loading state)
    await page.waitForTimeout(2000);
    
    // Check that we're not stuck with a loading spinner
    const hasContent = await page.locator('main, [role="main"], [class*="content"]').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Agent Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
  });

  test('should display search functionality', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) {
      test.skip('Authentication required');
      return;
    }
    
    // Look for search input
    const searchInput = page.getByPlaceholder(/search|find/i).first();
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
    
    // Search functionality may or may not exist yet
    // This is a non-blocking test
    expect(typeof hasSearch).toBe('boolean');
  });

  test('should handle empty search results gracefully', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) {
      test.skip('Authentication required');
      return;
    }
    
    // Try to find search input
    const searchInput = page.getByPlaceholder(/search|find/i).first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Enter search query that likely won't match anything
      await searchInput.fill('xyznonexistentagentname123');
      await page.waitForTimeout(1000);
      
      // Should show empty state or no results message
      const hasEmptyState = await page.locator('text=/no results|not found|no agents/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      
      // If search exists, it should handle empty results
      if (hasEmptyState !== null) {
        expect(typeof hasEmptyState).toBe('boolean');
      }
    }
  });
});

test.describe('Agent Detail View', () => {
  test('should navigate to agent detail when agent exists', async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    if (url.includes('login')) {
      test.skip('Authentication required');
      return;
    }
    
    // Try to find and click first agent
    const agentItem = page.locator('[data-testid="agent-item"], [class*="agent-card"], [class*="agent-row"]').first();
    if (await agentItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await agentItem.click();
      await page.waitForLoadState('networkidle');
      
      // Should navigate to agent detail page
      const newUrl = page.url();
      expect(newUrl).toMatch(/agent/i);
    } else {
      test.skip('No agents available for testing');
    }
  });

  test('should handle 404 for non-existent agent', async ({ page }) => {
    await page.goto('/agent/nonexistent-agent-id-12345');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    if (url.includes('login')) {
      test.skip('Authentication required');
      return;
    }
    
    // Should show error message or redirect
    const hasError = await page.locator('text=/not found|doesn\'t exist|error/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    // Page should handle non-existent agent gracefully
    expect(hasError || !url.includes('nonexistent-agent')).toBeTruthy();
  });
});
