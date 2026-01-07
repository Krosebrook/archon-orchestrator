/**
 * Custom Test Utilities
 * 
 * Provides custom render functions and utilities for testing React components
 * with all necessary providers (QueryClient, Router, etc.)
 */

import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

/**
 * Create a test QueryClient with disabled retries and caching
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

/**
 * Custom render function that wraps components with necessary providers
 * 
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {QueryClient} options.queryClient - Custom QueryClient instance
 * @param {string} options.initialRoute - Initial route for BrowserRouter
 * @returns {Object} - Render result with user event utilities
 */
export function renderWithProviders(
  ui,
  {
    queryClient = createTestQueryClient(),
    initialRoute = '/',
    ...renderOptions
  } = {}
) {
  // Set initial route
  window.history.pushState({}, 'Test page', initialRoute);
  
  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
  }
  
  return {
    user: userEvent.setup(),
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Wait for an element to be removed from the document
 */
export { waitForElementToBeRemoved, waitFor, screen, within } from '@testing-library/react';

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

/**
 * Helper to create mock functions with proper typing
 */
export { vi } from 'vitest';
