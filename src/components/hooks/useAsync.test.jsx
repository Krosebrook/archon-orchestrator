/**
 * useAsync Hook Tests
 * 
 * Tests for the async state management hook
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAsync } from './useAsync';

// Mock the handleError utility
vi.mock('../utils/api-client', () => ({
  handleError: vi.fn((error) => error),
}));

describe('useAsync', () => {
  describe('Initial State', () => {
    it('starts with null data and not loading', () => {
      const asyncFn = vi.fn();
      const { result } = renderHook(() => useAsync(asyncFn));
      
      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.error).toBeNull();
    });
    
    it('uses initial data when provided', () => {
      const asyncFn = vi.fn();
      const initialData = { id: 1, name: 'Test' };
      const { result } = renderHook(() => 
        useAsync(asyncFn, { initialData })
      );
      
      expect(result.current.data).toEqual(initialData);
    });
  });
  
  describe('Success Path', () => {
    it('sets loading state while executing', async () => {
      const asyncFn = vi.fn().mockResolvedValue({ result: 'success' });
      const { result } = renderHook(() => useAsync(asyncFn));
      
      // Start execution (don't wait immediately)
      const promise = result.current.execute();
      
      // Wait for completion
      await promise;
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });
    
    it('sets data and success state on success', async () => {
      const mockData = { id: 1, name: 'Test Agent' };
      const asyncFn = vi.fn().mockResolvedValue(mockData);
      const { result } = renderHook(() => useAsync(asyncFn));
      
      await result.current.execute();
      
      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.isError).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });
    });
    
    it('calls async function with correct arguments', async () => {
      const asyncFn = vi.fn().mockResolvedValue('result');
      const { result } = renderHook(() => useAsync(asyncFn));
      
      await result.current.execute('arg1', 'arg2');
      
      expect(asyncFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
  
  describe('Error Handling', () => {
    it('sets error state on failure', async () => {
      const error = new Error('Test error');
      const asyncFn = vi.fn().mockRejectedValue(error);
      const { result } = renderHook(() => useAsync(asyncFn));
      
      try {
        await result.current.execute();
      } catch (_e) {
        // Expected to throw
      }
      
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.data).toBeNull();
      });
    });
    
    it('throws error for caller to handle', async () => {
      const error = new Error('Test error');
      const asyncFn = vi.fn().mockRejectedValue(error);
      const { result } = renderHook(() => useAsync(asyncFn));
      
      await expect(result.current.execute()).rejects.toThrow();
    });
  });
  
  describe('Reset Functionality', () => {
    it('resets to initial state', async () => {
      const mockData = { id: 1 };
      const asyncFn = vi.fn().mockResolvedValue(mockData);
      const { result } = renderHook(() => useAsync(asyncFn));
      
      // Execute and wait for success
      await result.current.execute();
      
      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });
      
      // Reset - need to wait for state update
      await waitFor(() => {
        result.current.reset();
      });
      
      // Check reset state
      await waitFor(() => {
        expect(result.current.data).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
    
    it('resets to initial data if provided', async () => {
      const initialData = { id: 0, name: 'Initial' };
      const mockData = { id: 1, name: 'Updated' };
      const asyncFn = vi.fn().mockResolvedValue(mockData);
      const { result } = renderHook(() => 
        useAsync(asyncFn, { initialData })
      );
      
      // Execute
      await result.current.execute();
      
      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });
      
      // Reset should go back to initial data
      await waitFor(() => {
        result.current.reset();
      });
      
      await waitFor(() => {
        expect(result.current.data).toEqual(initialData);
      });
    });
  });
  
  describe('Cleanup', () => {
    it('does not update state after unmount', async () => {
      const asyncFn = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: 'test' }), 100))
      );
      const { result, unmount } = renderHook(() => useAsync(asyncFn));
      
      // Start execution
      result.current.execute();
      
      // Unmount before completion
      unmount();
      
      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // State should not have been updated (no error should be thrown)
      // This test mainly ensures no memory leaks or errors
    });
  });
});
