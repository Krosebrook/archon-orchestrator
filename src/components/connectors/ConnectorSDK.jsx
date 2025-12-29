/**
 * Archon Connector SDK
 * A comprehensive toolkit for building custom connectors
 * 
 * @version 1.0.0
 * @license MIT
 */

import { createHash, randomBytes } from 'node:crypto';

/**
 * OAuth 2.0 PKCE Helper
 * Implements Proof Key for Code Exchange (RFC 7636)
 */
export class OAuth2PKCE {
  /**
   * Generate code verifier (43-128 characters, base64url encoded)
   */
  static generateCodeVerifier() {
    return randomBytes(32)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate code challenge from verifier using S256 method
   */
  static generateCodeChallenge(verifier) {
    return createHash('sha256')
      .update(verifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Build authorization URL with PKCE parameters
   */
  static buildAuthURL(config) {
    const { 
      authUrl, 
      clientId, 
      redirectUri, 
      scope, 
      state, 
      codeChallenge 
    } = config;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: Array.isArray(scope) ? scope.join(' ') : scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCode(config) {
    const { tokenUrl, clientId, clientSecret, code, redirectUri, codeVerifier } = config;

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    });

    if (clientSecret) {
      params.append('client_secret', clientSecret);
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Refresh access token
   */
  static async refreshToken(config) {
    const { tokenUrl, clientId, clientSecret, refreshToken } = config;

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    });

    if (clientSecret) {
      params.append('client_secret', clientSecret);
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return await response.json();
  }
}

/**
 * Webhook Signature Validator
 * Validates webhook signatures from various providers
 */
export class WebhookValidator {
  /**
   * HMAC SHA-256 validation (used by Stripe, GitHub, etc.)
   */
  static validateHMAC(payload, signature, secret, algorithm = 'sha256') {
    const computedSignature = createHash(algorithm)
      .update(payload)
      .update(secret)
      .digest('hex');

    return this.secureCompare(signature, computedSignature);
  }

  /**
   * Stripe webhook validation
   */
  static validateStripe(payload, signature, secret) {
    const [timestamp, ...sigs] = signature.split(',');
    const t = timestamp.split('=')[1];
    const signedPayload = `${t}.${payload}`;

    const expectedSig = createHash('sha256')
      .update(signedPayload)
      .update(secret)
      .digest('hex');

    return sigs.some(sig => {
      const s = sig.split('=')[1];
      return this.secureCompare(s, expectedSig);
    });
  }

  /**
   * GitHub webhook validation
   */
  static validateGitHub(payload, signature, secret) {
    const computedSignature = 'sha256=' + createHash('sha256')
      .update(payload)
      .update(secret)
      .digest('hex');

    return this.secureCompare(signature, computedSignature);
  }

  /**
   * Slack webhook validation
   */
  static validateSlack(timestamp, signature, payload, signingSecret) {
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
    if (parseInt(timestamp) < fiveMinutesAgo) {
      return false;
    }

    const sigBaseString = `v0:${timestamp}:${payload}`;
    const computedSignature = 'v0=' + createHash('sha256')
      .update(sigBaseString)
      .update(signingSecret)
      .digest('hex');

    return this.secureCompare(signature, computedSignature);
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  static secureCompare(a, b) {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}

/**
 * API Request Builder
 * Simplifies making authenticated API requests
 */
export class APIClient {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.credentials = config.credentials;
    this.defaultHeaders = config.headers || {};
  }

  async request(method, path, options = {}) {
    const url = `${this.baseURL}${path}`;
    const headers = {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const config = {
      method,
      headers,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
      headers['Content-Type'] = 'application/json';
    }

    if (options.params) {
      const params = new URLSearchParams(options.params);
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  getAuthHeaders() {
    if (this.credentials.bearer) {
      return { 'Authorization': `Bearer ${this.credentials.bearer}` };
    }
    if (this.credentials.apiKey) {
      return { 'X-API-Key': this.credentials.apiKey };
    }
    if (this.credentials.basic) {
      return { 'Authorization': `Basic ${this.credentials.basic}` };
    }
    return {};
  }

  get(path, options) {
    return this.request('GET', path, options);
  }

  post(path, body, options = {}) {
    return this.request('POST', path, { ...options, body });
  }

  put(path, body, options = {}) {
    return this.request('PUT', path, { ...options, body });
  }

  patch(path, body, options = {}) {
    return this.request('PATCH', path, { ...options, body });
  }

  delete(path, options) {
    return this.request('DELETE', path, options);
  }
}

/**
 * Rate Limiter
 * Implements token bucket algorithm
 */
export class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.tokens = maxRequests;
    this.lastRefill = Date.now();
  }

  async acquire() {
    this.refill();
    
    if (this.tokens <= 0) {
      const waitTime = this.windowMs - (Date.now() - this.lastRefill);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.refill();
    }

    this.tokens--;
  }

  refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    
    if (timePassed >= this.windowMs) {
      this.tokens = this.maxRequests;
      this.lastRefill = now;
    }
  }
}

/**
 * Retry Handler
 * Implements exponential backoff with jitter
 */
export class RetryHandler {
  static async retry(fn, options = {}) {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      factor = 2,
      jitter = true,
    } = options;

    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (i === maxRetries) break;
        
        let delay = Math.min(initialDelay * Math.pow(factor, i), maxDelay);
        
        if (jitter) {
          delay = delay * (0.5 + Math.random() * 0.5);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

/**
 * Connector Testing Utilities
 */
export class ConnectorTester {
  constructor(connector) {
    this.connector = connector;
    this.results = [];
  }

  async testConnection(credentials) {
    const test = {
      name: 'Connection Test',
      status: 'pending',
      startTime: Date.now(),
    };

    try {
      await this.connector.testConnection(credentials);
      test.status = 'passed';
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
    }

    test.duration = Date.now() - test.startTime;
    this.results.push(test);
    return test;
  }

  async testOperation(operation, params, credentials) {
    const test = {
      name: `Operation: ${operation}`,
      status: 'pending',
      startTime: Date.now(),
    };

    try {
      const result = await this.connector.execute(operation, params, credentials);
      test.status = 'passed';
      test.result = result;
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
    }

    test.duration = Date.now() - test.startTime;
    this.results.push(test);
    return test;
  }

  generateReport() {
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    
    return {
      summary: {
        total: this.results.length,
        passed,
        failed,
        successRate: (passed / this.results.length * 100).toFixed(2) + '%',
      },
      tests: this.results,
    };
  }
}