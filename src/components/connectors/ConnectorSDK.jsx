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
 * GraphQL Client
 * Simplifies GraphQL queries and mutations
 */
export class GraphQLClient {
  constructor(config) {
    this.endpoint = config.endpoint;
    this.credentials = config.credentials;
    this.defaultHeaders = config.headers || {};
  }

  async query(query, variables = {}, options = {}) {
    return await this.request(query, variables, options);
  }

  async mutation(mutation, variables = {}, options = {}) {
    return await this.request(mutation, variables, options);
  }

  async request(query, variables, options) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
        operationName: options.operationName,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL HTTP error: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  async batchQuery(queries) {
    const promises = queries.map(({ query, variables, options }) =>
      this.query(query, variables, options)
    );
    return await Promise.all(promises);
  }

  getAuthHeaders() {
    if (this.credentials?.bearer) {
      return { 'Authorization': `Bearer ${this.credentials.bearer}` };
    }
    if (this.credentials?.apiKey) {
      return { 'X-API-Key': this.credentials.apiKey };
    }
    return {};
  }
}

/**
 * Data Transformation Utilities
 */
export class DataTransformer {
  /**
   * XML to JSON conversion
   */
  static xmlToJson(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    function parseNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent.trim() || null;
      }

      const obj = {};
      
      // Attributes
      if (node.attributes?.length > 0) {
        obj['@attributes'] = {};
        for (const attr of node.attributes) {
          obj['@attributes'][attr.name] = attr.value;
        }
      }

      // Child nodes
      const children = Array.from(node.childNodes);
      const textContent = children
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim())
        .join('');

      if (textContent && children.length === 1) {
        return textContent;
      }

      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const childData = parseNode(child);
          
          if (obj[child.nodeName]) {
            if (!Array.isArray(obj[child.nodeName])) {
              obj[child.nodeName] = [obj[child.nodeName]];
            }
            obj[child.nodeName].push(childData);
          } else {
            obj[child.nodeName] = childData;
          }
        }
      }

      return obj;
    }

    return parseNode(doc.documentElement);
  }

  /**
   * JSON to XML conversion
   */
  static jsonToXml(json, rootName = 'root') {
    function buildXml(obj, name) {
      if (obj === null || obj === undefined) return '';
      
      if (typeof obj !== 'object') {
        return `<${name}>${escapeXml(String(obj))}</${name}>`;
      }

      if (Array.isArray(obj)) {
        return obj.map(item => buildXml(item, name)).join('');
      }

      const attributes = obj['@attributes'] || {};
      const attrStr = Object.entries(attributes)
        .map(([k, v]) => `${k}="${escapeXml(String(v))}"`)
        .join(' ');

      let inner = '';
      for (const [key, value] of Object.entries(obj)) {
        if (key !== '@attributes') {
          inner += buildXml(value, key);
        }
      }

      return `<${name}${attrStr ? ' ' + attrStr : ''}>${inner}</${name}>`;
    }

    function escapeXml(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }

    return `<?xml version="1.0" encoding="UTF-8"?>${buildXml(json, rootName)}`;
  }

  /**
   * CSV to JSON conversion
   */
  static csvToJson(csv, options = {}) {
    const { delimiter = ',', headers = null } = options;
    const lines = csv.trim().split('\n');
    const headerLine = headers || lines[0].split(delimiter).map(h => h.trim());
    const startIndex = headers ? 0 : 1;

    return lines.slice(startIndex).map(line => {
      const values = line.split(delimiter).map(v => v.trim());
      const obj = {};
      headerLine.forEach((header, i) => {
        obj[header] = values[i] || '';
      });
      return obj;
    });
  }

  /**
   * JSON to CSV conversion
   */
  static jsonToCsv(json, options = {}) {
    if (!json.length) return '';
    
    const { delimiter = ',', headers = null } = options;
    const keys = headers || Object.keys(json[0]);
    
    const headerRow = keys.join(delimiter);
    const dataRows = json.map(obj => 
      keys.map(key => {
        const value = obj[key] || '';
        return String(value).includes(delimiter) ? `"${value}"` : value;
      }).join(delimiter)
    );

    return [headerRow, ...dataRows].join('\n');
  }

  /**
   * Flatten nested object
   */
  static flatten(obj, prefix = '') {
    const result = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flatten(value, newKey));
      } else {
        result[newKey] = value;
      }
    }
    
    return result;
  }

  /**
   * Unflatten object
   */
  static unflatten(obj) {
    const result = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const keys = key.split('.');
      let current = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
    }
    
    return result;
  }

  /**
   * Transform keys (camelCase, snake_case, etc.)
   */
  static transformKeys(obj, transformer) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.transformKeys(item, transformer));
    }
    
    if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[transformer(key)] = this.transformKeys(value, transformer);
      }
      return result;
    }
    
    return obj;
  }

  static toCamelCase(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  static toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

/**
 * Connector Debugger
 * Development and debugging utilities
 */
export class ConnectorDebugger {
  constructor(options = {}) {
    this.logs = [];
    this.metrics = [];
    this.verbose = options.verbose || false;
  }

  log(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
    
    this.logs.push(entry);
    
    if (this.verbose) {
      console[level === 'error' ? 'error' : 'log'](`[${level}]`, message, data);
    }
  }

  startTimer(label) {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.metrics.push({ label, duration });
      return duration;
    };
  }

  async trace(fn, label) {
    const stopTimer = this.startTimer(label);
    this.log('info', `Starting: ${label}`);
    
    try {
      const result = await fn();
      const duration = stopTimer();
      this.log('info', `Completed: ${label}`, { duration: `${duration.toFixed(2)}ms` });
      return result;
    } catch (error) {
      stopTimer();
      this.log('error', `Failed: ${label}`, { error: error.message });
      throw error;
    }
  }

  async inspectRequest(url, options) {
    this.log('info', 'HTTP Request', {
      url,
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body,
    });

    const stopTimer = this.startTimer(`Request: ${url}`);
    
    try {
      const response = await fetch(url, options);
      const duration = stopTimer();
      
      const body = await response.clone().text();
      
      this.log('info', 'HTTP Response', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: body.slice(0, 500),
        duration: `${duration.toFixed(2)}ms`,
      });

      return response;
    } catch (error) {
      stopTimer();
      this.log('error', 'HTTP Error', { error: error.message });
      throw error;
    }
  }

  getLogs(filter = {}) {
    let filtered = this.logs;
    
    if (filter.level) {
      filtered = filtered.filter(log => log.level === filter.level);
    }
    
    if (filter.since) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= filter.since);
    }
    
    return filtered;
  }

  getMetrics() {
    return {
      total: this.metrics.length,
      average: this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length,
      min: Math.min(...this.metrics.map(m => m.duration)),
      max: Math.max(...this.metrics.map(m => m.duration)),
      breakdown: this.metrics,
    };
  }

  exportReport() {
    return {
      summary: {
        totalLogs: this.logs.length,
        errors: this.logs.filter(l => l.level === 'error').length,
        warnings: this.logs.filter(l => l.level === 'warn').length,
      },
      metrics: this.getMetrics(),
      logs: this.logs,
    };
  }

  clear() {
    this.logs = [];
    this.metrics = [];
  }
}

/**
 * Mock Server for Local Development
 */
export class MockServer {
  constructor() {
    this.routes = new Map();
    this.requestLog = [];
  }

  mock(method, path, handler) {
    const key = `${method}:${path}`;
    this.routes.set(key, handler);
  }

  async handleRequest(method, path, body, headers) {
    const key = `${method}:${path}`;
    
    this.requestLog.push({
      timestamp: new Date().toISOString(),
      method,
      path,
      body,
      headers,
    });

    const handler = this.routes.get(key);
    
    if (!handler) {
      return {
        status: 404,
        body: { error: 'Route not found' },
      };
    }

    try {
      const result = await handler({ body, headers, path });
      return {
        status: 200,
        body: result,
      };
    } catch (error) {
      return {
        status: 500,
        body: { error: error.message },
      };
    }
  }

  getRequestLog() {
    return this.requestLog;
  }

  clearLog() {
    this.requestLog = [];
  }
}

/**
 * Connector Testing Utilities
 */
export class ConnectorTester {
  constructor(connector) {
    this.connector = connector;
    this.results = [];
    this.debugger = new ConnectorDebugger({ verbose: true });
  }

  async testConnection(credentials) {
    const test = {
      name: 'Connection Test',
      status: 'pending',
      startTime: Date.now(),
    };

    try {
      await this.debugger.trace(
        () => this.connector.testConnection(credentials),
        'Connection Test'
      );
      test.status = 'passed';
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
    }

    test.duration = Date.now() - test.startTime;
    test.logs = this.debugger.getLogs();
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
      const result = await this.debugger.trace(
        () => this.connector.execute(operation, params, credentials),
        operation
      );
      test.status = 'passed';
      test.result = result;
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
    }

    test.duration = Date.now() - test.startTime;
    test.logs = this.debugger.getLogs();
    test.metrics = this.debugger.getMetrics();
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
      debugReport: this.debugger.exportReport(),
    };
  }
}