/**
 * Enhanced Error Boundary Component
 * Catches React errors and provides graceful fallback UI
 * Integrates with centralized error handling system
 * 
 * @component ErrorBoundary
 */

import { Component } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { formatReactError } from '../../utils/errorHandler';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorDetails: null
    };
  }

  static getDerivedStateFromError(_error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Format error details for logging
    const errorDetails = formatReactError(error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      errorDetails
    });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group('🚨 React Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Formatted Details:', errorDetails);
      console.groupEnd();
    }

    // Log to external service if configured
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorDetails);
    }

    // Optionally log to server
    if (this.props.logToServer) {
      this.logErrorToServer(errorDetails);
    }
  }

  async logErrorToServer(errorDetails) {
    try {
      await fetch('/api/logs/react-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...errorDetails,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error('Failed to log error to server:', err);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorDetails: null
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI from props
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          errorDetails: this.state.errorDetails,
          reset: this.handleReset
        });
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {this.props.title || 'Something went wrong'}
                  </CardTitle>
                  <CardDescription>
                    {this.props.description || 'An unexpected error occurred. Our team has been notified.'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error Message */}
              {import.meta.env.DEV && this.state.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-mono text-sm text-red-800">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              {/* Trace ID for support */}
              {this.state.errorDetails?.traceId && (
                <div className="p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Error ID:</span>{' '}
                    <code className="font-mono text-xs">
                      {this.state.errorDetails.traceId}
                    </code>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Include this ID when contacting support
                  </p>
                </div>
              )}

              {/* Component Stack (Development Only) */}
              {import.meta.env.DEV && this.state.errorInfo?.componentStack && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-700 font-medium mb-2">
                    Component Stack (Development Only)
                  </summary>
                  <pre className="p-3 bg-gray-100 rounded-lg overflow-auto text-xs text-gray-800 font-mono">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={this.handleReset}
                  className="flex items-center gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {/* Additional Help Text */}
              {this.props.helpText && (
                <p className="text-sm text-gray-600 pt-2 border-t">
                  {this.props.helpText}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary component for specific sections
 * Can be used to wrap smaller parts of the UI
 */
export function SafeComponent({ children, fallback, componentName }) {
  return (
    <ErrorBoundary
      fallback={fallback}
      title={`Error in ${componentName || 'Component'}`}
      description="This component encountered an error, but the rest of the application should continue working."
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Minimal error boundary for non-critical components
 * Shows inline error message without full page takeover
 */
export function InlineErrorBoundary({ children, componentName }) {
  const fallback = () => (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900">
            {componentName || 'Component'} Error
          </h3>
          <p className="text-sm text-red-700 mt-1">
            This component failed to load. Please try refreshing the page.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
