/**
 * @fileoverview Common Test Helpers
 * @description Shared utilities for testing React components
 */

import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Custom render function that includes common providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @returns {Object} Render result with utilities
 */
export function renderWithProviders(ui, options = {}) {
  const {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    route = '/',
    ...renderOptions
  } = options;

  // Set initial route if needed
  if (route !== '/') {
    window.history.pushState({}, 'Test page', route);
  }

  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

/**
 * Wait for element to be removed (useful for loading states)
 * @param {Function} callback - Function that returns element query
 * @param {Object} options - Waitfor options
 */
export async function waitForElementToBeRemoved(callback, options) {
  const { waitFor } = await import('@testing-library/react');
  return waitFor(() => {
    const element = callback();
    if (element) {
      throw new Error('Element is still present');
    }
  }, options);
}

/**
 * Create mock function that resolves after delay
 * @param {*} returnValue - Value to return
 * @param {number} delay - Delay in ms
 * @returns {Function} Mock function
 */
export function createDelayedMock(returnValue, delay = 100) {
  return vi.fn().mockImplementation(
    () => new Promise((resolve) => setTimeout(() => resolve(returnValue), delay))
  );
}

/**
 * Suppress console warnings/errors in a test
 * @param {Function} callback - Test function
 */
export async function suppressConsole(callback) {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = vi.fn();
  console.error = vi.fn();
  
  try {
    await callback();
  } finally {
    console.warn = originalWarn;
    console.error = originalError;
  }
}

/**
 * Mock router utilities
 */
export const mockRouter = {
  navigate: vi.fn(),
  location: {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  },
  params: {},
};

/**
 * Create mock toast notifications
 */
export function mockToast() {
  return {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  };
}

/**
 * Wait for promises to resolve
 */
export async function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Create test component props with defaults
 */
export function createTestProps(overrides = {}) {
  return {
    isLoading: false,
    error: null,
    data: null,
    ...overrides,
  };
}

/**
 * Assert that element has specific aria attributes
 */
export function assertAccessibility(element, attributes) {
  Object.entries(attributes).forEach(([key, value]) => {
    expect(element).toHaveAttribute(`aria-${key}`, value);
  });
}

/**
 * Simulate user typing with delay
 */
export async function typeWithDelay(user, element, text, delay = 50) {
  for (const char of text) {
    await user.type(element, char);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
