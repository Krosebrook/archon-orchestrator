import { toast } from 'sonner';

export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT'
};

export class APIError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.hint = options.hint;
    this.retryable = options.retryable ?? false;
    this.trace_id = options.trace_id;
    this.status = options.status;
  }
}

export function normalizeError(error) {
  if (error instanceof APIError) return error;
  if (!error.response) {
    return new APIError(ErrorCodes.NETWORK_ERROR, 'Network connection failed', { retryable: true });
  }
  const status = error.response?.status;
  const data = error.response?.data || {};
  switch (status) {
    case 401: return new APIError(ErrorCodes.UNAUTHORIZED, 'Authentication required', { status });
    case 403: return new APIError(ErrorCodes.FORBIDDEN, data.message || 'Permission denied', { status });
    case 404: return new APIError(ErrorCodes.NOT_FOUND, 'Resource not found', { status });
    case 422: return new APIError(ErrorCodes.VALIDATION_ERROR, data.message || 'Invalid input', { status });
    case 429: return new APIError(ErrorCodes.RATE_LIMITED, 'Too many requests', { retryable: true, status });
    default: return new APIError(ErrorCodes.SERVER_ERROR, 'Unexpected error', { retryable: status >= 500, status });
  }
}

export function handleError(error, options = {}) {
  const normalized = normalizeError(error);
  console.error('API Error:', normalized.code, normalized.message);
  if (!options.silent) {
    toast.error(normalized.hint ? `${normalized.message}. ${normalized.hint}` : normalized.message);
  }
  return normalized;
}