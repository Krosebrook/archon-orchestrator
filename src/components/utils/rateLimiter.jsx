import { checkRateLimit } from './validation';
import { toast } from 'sonner';

/**
 * Rate limiter for client-side operations
 */
export class RateLimiter {
  constructor(key, limit = 10, windowMs = 60000) {
    this.key = key;
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check() {
    const result = checkRateLimit(this.key, this.limit, this.windowMs);
    
    if (!result.allowed) {
      toast.error('Too many requests. Please slow down.');
      return false;
    }
    
    return true;
  }
}

/**
 * Rate limit decorator for async functions
 */
export function rateLimit(key, limit, windowMs) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const limiter = new RateLimiter(key, limit, windowMs);
    
    descriptor.value = async function (...args) {
      if (!limiter.check()) {
        throw new Error('Rate limit exceeded');
      }
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}