/**
 * @fileoverview Error Logging Utility
 * @description Centralized error logging with fallback mechanisms
 * Placeholder for future integration with error monitoring services (e.g., Sentry)
 * @version 1.0.0
 */

/**
 * Log levels for error severity
 */
export const LogLevel = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Error logger class with multiple fallback mechanisms
 * Future: Can be extended to integrate with Sentry, LogRocket, or other services
 */
class ErrorLogger {
  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.appVersion = import.meta.env.VITE_APP_VERSION || '0.0.0';
  }

  /**
   * Main logging method with try/catch fallback
   * @param {string} level - Log level (info, warn, error, critical)
   * @param {string} message - Error message
   * @param {Object} context - Additional context (error object, user info, etc.)
   */
  log(level, message, context = {}) {
    try {
      // Prepare log entry
      const logEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        appVersion: this.appVersion,
        url: typeof window !== 'undefined' ? window.location.href : null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        ...context
      };

      // In production, this would send to an error monitoring service
      // For now, we log to console with appropriate level
      if (this.isProduction) {
        // Production: Only log errors and critical issues to console
        if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
          console.error('[ErrorLogger]', logEntry);
          // TODO: Integrate with error monitoring service here
          // Example: Sentry.captureException(context.error, { contexts: { custom: logEntry } });
        }
      } else {
        // Development: Log everything for debugging
        switch (level) {
          case LogLevel.INFO:
            console.info('[ErrorLogger]', logEntry);
            break;
          case LogLevel.WARN:
            console.warn('[ErrorLogger]', logEntry);
            break;
          case LogLevel.ERROR:
          case LogLevel.CRITICAL:
            console.error('[ErrorLogger]', logEntry);
            break;
          default:
            console.log('[ErrorLogger]', logEntry);
        }
      }

      return logEntry;
    } catch (loggingError) {
      // Ultimate fallback: If logging itself fails, use bare console.error
      console.error('[ErrorLogger] Logging failed:', loggingError);
      console.error('[ErrorLogger] Original message:', message, context);
      return null;
    }
  }

  /**
   * Log informational messages
   */
  info(message, context = {}) {
    return this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warnings
   */
  warn(message, context = {}) {
    return this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log errors
   */
  error(message, context = {}) {
    return this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Log critical errors
   */
  critical(message, context = {}) {
    return this.log(LogLevel.CRITICAL, message, context);
  }

  /**
   * Async safe error logging wrapper
   * Wraps async functions with error logging
   */
  async safeAsync(fn, errorMessage = 'Async operation failed') {
    try {
      return await fn();
    } catch (error) {
      this.error(errorMessage, { error, stack: error.stack });
      throw error; // Re-throw after logging
    }
  }

  /**
   * Sync safe error logging wrapper
   * Wraps sync functions with error logging
   */
  safeSync(fn, errorMessage = 'Operation failed') {
    try {
      return fn();
    } catch (error) {
      this.error(errorMessage, { error, stack: error.stack });
      throw error; // Re-throw after logging
    }
  }
}

// Singleton instance
const errorLogger = new ErrorLogger();

export default errorLogger;

// Convenience exports
export const logInfo = (message, context) => errorLogger.info(message, context);
export const logWarn = (message, context) => errorLogger.warn(message, context);
export const logError = (message, context) => errorLogger.error(message, context);
export const logCritical = (message, context) => errorLogger.critical(message, context);
export const safeAsync = (fn, errorMessage) => errorLogger.safeAsync(fn, errorMessage);
export const safeSync = (fn, errorMessage) => errorLogger.safeSync(fn, errorMessage);
