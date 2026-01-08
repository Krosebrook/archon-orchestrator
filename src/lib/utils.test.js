/**
 * Utility Functions Tests
 * 
 * Tests for shared utility functions
 */

import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (className utility)', () => {
  it('merges class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });
  
  it('handles conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });
  
  it('removes false/null/undefined values', () => {
    const result = cn('text-red-500', false, null, undefined, 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });
  
  it('handles Tailwind conflicts correctly', () => {
    // twMerge should handle conflicting Tailwind classes
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2'); // Later class should override
  });
  
  it('handles empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });
  
  it('handles arrays of classes', () => {
    const result = cn(['text-red-500', 'bg-blue-500'], 'font-bold');
    expect(result).toBe('text-red-500 bg-blue-500 font-bold');
  });
  
  it('handles objects with boolean values', () => {
    const result = cn({
      'text-red-500': true,
      'bg-blue-500': false,
      'font-bold': true,
    });
    expect(result).toBe('text-red-500 font-bold');
  });
  
  it('merges duplicate classes', () => {
    const result = cn('text-red-500', 'text-red-500');
    expect(result).toBe('text-red-500');
  });
});
