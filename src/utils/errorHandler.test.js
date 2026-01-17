/**
 * Tests for Enhanced Error Handling Utilities
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AppError,
  ErrorSeverity,
  ErrorCategory,
  parseApiError,
  handleError,
  retryWithBackoff,
  createValidationError,
  createNotFoundError,
  createAuthorizationError,
  createSafeHandler
} from './errorHandler';

describe('Enhanced Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AppError Class', () => {
    it('should create an AppError with basic properties', () => {
      const error = new AppError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AppError');
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.category).toBe(ErrorCategory.UNKNOWN);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should create an AppError with custom options', () => {
      const error = new AppError('Custom error', {
        code: 'CUSTOM_CODE',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.HIGH,
        statusCode: 422,
        details: { field: 'email' },
        traceId: 'test-trace-123'
      });

      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.statusCode).toBe(422);
      expect(error.details).toEqual({ field: 'email' });
      expect(error.traceId).toBe('test-trace-123');
    });

    it('should serialize to JSON correctly', () => {
      const error = new AppError('JSON test', {
        code: 'JSON_TEST',
        category: ErrorCategory.NETWORK
      });

      const json = error.toJSON();
      
      expect(json.name).toBe('AppError');
      expect(json.message).toBe('JSON test');
      expect(json.code).toBe('JSON_TEST');
      expect(json.category).toBe(ErrorCategory.NETWORK);
      expect(json).toHaveProperty('timestamp');
      expect(json).toHaveProperty('traceId');
    });

    it('should capture stack trace', () => {
      const error = new AppError('Stack test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('parseApiError', () => {
    it('should return AppError as-is', async () => {
      const originalError = new AppError('Original');
      const result = await parseApiError(originalError);
      expect(result).toBe(originalError);
    });

    it('should parse Response objects', async () => {
      const mockResponse = {
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockResolvedValue({
          message: 'Resource not found',
          code: 'RESOURCE_NOT_FOUND',
          trace_id: 'trace-123'
        })
      };

      const error = await parseApiError(mockResponse);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Resource not found');
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.category).toBe(ErrorCategory.NOT_FOUND);
      expect(error.traceId).toBe('trace-123');
    });

    it('should handle Response with invalid JSON', async () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      };

      const error = await parseApiError(mockResponse);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toContain('Internal Server Error');
      expect(error.statusCode).toBe(500);
      expect(error.category).toBe(ErrorCategory.SERVER_ERROR);
    });

    it('should handle network errors', async () => {
      const networkError = new TypeError('Failed to fetch');
      const error = await parseApiError(networkError);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toContain('Network connection failed');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should handle generic Error objects', async () => {
      const genericError = new Error('Generic error message');
      const error = await parseApiError(genericError);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Generic error message');
      expect(error.code).toBe('GENERIC_ERROR');
    });

    it('should handle string errors', async () => {
      const error = await parseApiError('Simple error string');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Simple error string');
    });

    it('should handle plain object errors', async () => {
      const objError = { message: 'Object error', code: 'OBJ_ERROR' };
      const error = await parseApiError(objError);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Object error');
      expect(error.code).toBe('OBJ_ERROR');
    });
  });

  describe('Error Categorization', () => {
    it('should categorize 401 as AUTHENTICATION', async () => {
      const mockResponse = {
        status: 401,
        statusText: 'Unauthorized',
        json: vi.fn().mockResolvedValue({ message: 'Unauthorized' })
      };

      const error = await parseApiError(mockResponse);
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
    });

    it('should categorize 403 as AUTHORIZATION', async () => {
      const mockResponse = {
        status: 403,
        statusText: 'Forbidden',
        json: vi.fn().mockResolvedValue({ message: 'Forbidden' })
      };

      const error = await parseApiError(mockResponse);
      expect(error.category).toBe(ErrorCategory.AUTHORIZATION);
    });

    it('should categorize 422 as VALIDATION', async () => {
      const mockResponse = {
        status: 422,
        statusText: 'Unprocessable Entity',
        json: vi.fn().mockResolvedValue({ message: 'Validation failed' })
      };

      const error = await parseApiError(mockResponse);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
    });

    it('should categorize 5xx as SERVER_ERROR', async () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockResolvedValue({ message: 'Server error' })
      };

      const error = await parseApiError(mockResponse);
      expect(error.category).toBe(ErrorCategory.SERVER_ERROR);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });
  });

  describe('handleError', () => {
    it('should process error and return AppError', async () => {
      const testError = new Error('Test error');
      const result = await handleError(testError, { showToast: false, logToConsole: false });

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Test error');
    });

    it('should not log when logToConsole is false', async () => {
      const consoleError = vi.spyOn(console, 'error');
      await handleError(new Error('Silent error'), { 
        showToast: false, 
        logToConsole: false 
      });

      expect(consoleError).not.toHaveBeenCalled();
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(fn, { 
        maxAttempts: 3, 
        initialDelay: 10 
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(
        retryWithBackoff(fn, { maxAttempts: 2, initialDelay: 10 })
      ).rejects.toThrow('Persistent failure');

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should call onRetry callback', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Retry needed'))
        .mockResolvedValue('success');
      
      const onRetry = vi.fn();

      await retryWithBackoff(fn, { 
        maxAttempts: 3, 
        initialDelay: 10,
        onRetry 
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.any(AppError));
    });

    it('should not retry non-retryable errors', async () => {
      const validationError = new AppError('Validation failed', {
        code: 'VALIDATION_ERROR',
        category: ErrorCategory.VALIDATION,
        statusCode: 422
      });

      const fn = vi.fn().mockRejectedValue(validationError);

      await expect(
        retryWithBackoff(fn, { maxAttempts: 3, initialDelay: 10 })
      ).rejects.toThrow('Validation failed');

      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('Helper Functions', () => {
    it('should create validation error', () => {
      const error = createValidationError('email', 'Invalid email format', { value: 'test' });

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid email format');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.statusCode).toBe(422);
      expect(error.details.field).toBe('email');
      expect(error.details.value).toBe('test');
    });

    it('should create not found error', () => {
      const error = createNotFoundError('Agent', '123');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toContain('Agent not found');
      expect(error.message).toContain('123');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.category).toBe(ErrorCategory.NOT_FOUND);
      expect(error.statusCode).toBe(404);
    });

    it('should create authorization error', () => {
      const error = createAuthorizationError('delete', 'workflow');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toContain("don't have permission");
      expect(error.message).toContain('delete');
      expect(error.message).toContain('workflow');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.category).toBe(ErrorCategory.AUTHORIZATION);
      expect(error.statusCode).toBe(403);
    });
  });

  describe('createSafeHandler', () => {
    it('should handle successful execution', async () => {
      const handler = vi.fn().mockResolvedValue('success');
      const safeHandler = createSafeHandler(handler, { showToast: false, logToConsole: false });

      const result = await safeHandler('arg1', 'arg2');

      expect(result).toBe('success');
      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should catch and handle errors', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Handler error'));
      const safeHandler = createSafeHandler(handler, { showToast: false, logToConsole: false });

      const result = await safeHandler();

      expect(result).toBeUndefined();
      expect(handler).toHaveBeenCalled();
    });

    it('should use fallback on error', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Handler error'));
      const fallback = vi.fn().mockReturnValue('fallback-result');
      const safeHandler = createSafeHandler(handler, { 
        showToast: false, 
        logToConsole: false, 
        fallback 
      });

      const result = await safeHandler('test-arg');

      expect(result).toBe('fallback-result');
      expect(fallback).toHaveBeenCalledWith('test-arg');
    });
  });
});
