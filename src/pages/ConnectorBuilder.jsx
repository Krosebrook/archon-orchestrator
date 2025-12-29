import React from 'react';
import ConnectorBuilder from '../components/connectors/ConnectorBuilder';

export default function ConnectorBuilderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Custom Connector Builder</h1>
        <p className="text-slate-400 mt-2">
          Build and deploy your own connectors using the Archon SDK
        </p>
      </div>

      <ConnectorBuilder />

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">SDK Documentation</h2>
        <div className="space-y-2 text-sm text-slate-300">
          <p>
            <strong>OAuth 2.0 PKCE:</strong> Secure authentication flow for third-party APIs
          </p>
          <p>
            <strong>Webhook Validation:</strong> HMAC signature verification for Stripe, GitHub, Slack
          </p>
          <p>
            <strong>Rate Limiting:</strong> Token bucket algorithm to respect API limits
          </p>
          <p>
            <strong>Retry Handler:</strong> Exponential backoff with jitter for resilient calls
          </p>
          <p>
            <strong>Testing Tools:</strong> Built-in connector testing and validation
          </p>
        </div>
      </div>
    </div>
  );
}