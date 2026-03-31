import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<any, any> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let details = null;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) {
            errorMessage = `Firestore Error: ${parsed.operationType} on ${parsed.path}`;
            details = parsed.error;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-void flex items-center justify-center p-6">
          <div className="glass-card p-8 max-w-lg w-full text-center space-y-6 border-red-500/20">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Something went wrong</h2>
              <p className="text-white/50 text-sm">{errorMessage}</p>
              {details && (
                <pre className="mt-4 p-4 bg-black/40 rounded-lg text-left text-xs text-red-400 overflow-auto max-h-40">
                  {details}
                </pre>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="emerald-btn w-full flex items-center justify-center space-x-2"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
