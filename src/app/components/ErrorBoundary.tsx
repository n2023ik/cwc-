import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime error in component:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 rounded-xl border border-rose-500/50 bg-rose-500/10 text-rose-400">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            ⚠️ Component Error
          </h2>
          <p className="text-sm mb-4 text-rose-300">
            This section failed to load. The rest of the dashboard is unaffected.
          </p>
          <pre className="text-xs bg-rose-950/50 p-4 rounded-lg overflow-auto whitespace-pre-wrap border border-rose-900/50">
            {this.state.error?.message || "Unknown error occurred"}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
