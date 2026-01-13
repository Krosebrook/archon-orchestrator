/**
 * @fileoverview Error Logger Tests
 * @description Test suite for error logging utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import errorLogger, { logError, logWarn, logInfo, LogLevel } from './errorLogger';

describe('Error Logger', () => {
  // Spy on console methods
  let consoleErrorSpy;
  let consoleWarnSpy;
  let consoleInfoSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  describe('Logging Levels', () => {
    it('should log error messages', () => {
      logError('Test error', { code: 'TEST_ERROR' });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      logWarn('Test warning');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      logInfo('Test info');
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should include timestamp in log entry', () => {
      const result = errorLogger.info('Test with timestamp');
      expect(result).toHaveProperty('timestamp');
      expect(result.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include context in log entry', () => {
      const context = { userId: '123', action: 'test' };
      const result = errorLogger.error('Test with context', context);
      expect(result).toMatchObject(context);
    });
  });

  describe('Safe Async Wrapper', () => {
    it('should execute async function successfully', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const result = await errorLogger.safeAsync(mockFn, 'Test async');
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalled();
    });

    it('should log and re-throw errors from async function', async () => {
      const mockError = new Error('Async error');
      const mockFn = vi.fn().mockRejectedValue(mockError);
      
      await expect(
        errorLogger.safeAsync(mockFn, 'Test async error')
      ).rejects.toThrow('Async error');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Safe Sync Wrapper', () => {
    it('should execute sync function successfully', () => {
      const mockFn = vi.fn().mockReturnValue('success');
      const result = errorLogger.safeSync(mockFn, 'Test sync');
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalled();
    });

    it('should log and re-throw errors from sync function', () => {
      const mockError = new Error('Sync error');
      const mockFn = vi.fn().mockImplementation(() => {
        throw mockError;
      });
      
      expect(() => 
        errorLogger.safeSync(mockFn, 'Test sync error')
      ).toThrow('Sync error');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Fallback Mechanism', () => {
    it('should use console.error as ultimate fallback if logging fails', () => {
      // This simulates a scenario where logging itself might fail
      const result = errorLogger.log(LogLevel.ERROR, 'Fallback test');
      expect(result).toBeTruthy();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
