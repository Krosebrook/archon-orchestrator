/**
 * @fileoverview Error Boundary Component
 * @description React error boundary that catches JavaScript errors anywhere in the child
 * component tree and displays a fallback UI with error reporting.
 * 
 * @module shared/ErrorBoundary
 * @version 2.0.0
 * 
 * @example
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import { auditCritical, AuditEntities, AuditActions } from '../utils/audit-logger';

/**
 * Error Boundary component that catches and handles React errors.
 * @extends React.Component
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCode: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const errorCode = `ERR_${Date.now()}`;
    
    // Structured error logging
    const errorData = {
      error: error?.message || String(error),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      errorCode,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      url: typeof window !== 'undefined' ? window.location.href : null
    };
    
    console.error('[ErrorBoundary] Caught error:', errorData);

    this.setState({ 
      errorInfo, 
      errorCode 
    });

    // Audit critical error
    auditCritical(
      AuditActions.EXECUTE,
      AuditEntities.SYSTEM,
      'error_boundary',
      {
        error_code: errorCode,
        error_message: error?.message,
        component_stack: errorInfo?.componentStack?.slice(0, 500)
      }
    ).catch(() => {
      // Silently fail if audit logging fails
    });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCode: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
          <Card className="max-w-lg w-full bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    Something went wrong
                  </h2>
                  <p className="text-slate-400 text-sm">
                    We're sorry for the inconvenience. The error has been logged.
                  </p>
                </div>

                {this.state.errorCode && (
                  <div className="w-full p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Error Code</p>
                    <code className="text-sm text-slate-300 font-mono">
                      {this.state.errorCode}
                    </code>
                  </div>
                )}

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="w-full text-left">
                    <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300">
                      Technical Details
                    </summary>
                    <pre className="mt-2 p-3 bg-slate-950 rounded text-xs text-red-400 overflow-auto max-h-40">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}

                <div className="flex gap-3 w-full">
                  <Button
                    onClick={this.handleReset}
                    variant="outline"
                    className="flex-1 border-slate-700 text-white"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={() => window.location.href = createPageUrl('Dashboard')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}