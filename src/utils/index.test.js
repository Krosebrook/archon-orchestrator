/**
 * @fileoverview Utils Tests
 * @description Test suite for utility functions
 */

import { describe, it, expect } from 'vitest';
import { createPageUrl } from './index.ts';

describe('Utility Functions', () => {
  describe('createPageUrl', () => {
    it('should convert page name to lowercase URL', () => {
      const result = createPageUrl('Dashboard');
      expect(result).toBe('/dashboard');
    });

    it('should replace spaces with hyphens', () => {
      const result = createPageUrl('Agent Details');
      expect(result).toBe('/agent-details');
    });

    it('should handle multiple spaces', () => {
      const result = createPageUrl('My Agent Dashboard');
      expect(result).toBe('/my-agent-dashboard');
    });

    it('should handle already lowercase names', () => {
      const result = createPageUrl('agents');
      expect(result).toBe('/agents');
    });

    it('should handle mixed case with spaces', () => {
      const result = createPageUrl('Workflow Builder Page');
      expect(result).toBe('/workflow-builder-page');
    });

    it('should handle single word pages', () => {
      const result = createPageUrl('Home');
      expect(result).toBe('/home');
    });

    it('should handle empty string', () => {
      const result = createPageUrl('');
      expect(result).toBe('/');
    });

    it('should handle names with special characters (spaces only)', () => {
      const result = createPageUrl('Agent   Settings');
      expect(result).toBe('/agent---settings');
    });

    it('should always start with slash', () => {
      const urls = [
        createPageUrl('Home'),
        createPageUrl('Agents'),
        createPageUrl('Workflow Detail'),
      ];
      
      urls.forEach((url) => {
        expect(url).toMatch(/^\//);
      });
    });
  });
});
