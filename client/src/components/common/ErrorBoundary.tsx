import React from "react";

interface State { error: Error | null }

/**
 * Catches render-time errors anywhere in the tree and shows a recoverable
 * screen instead of a blank white page. Without this, any thrown error in
 * a React 19 tree unmounts the whole app to nothing.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface to console for dev; in prod this is where you'd ship to logging.
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-4">
              The page hit an unexpected error. You can retry, or reload the app.
            </p>
            <pre className="text-left text-[11px] bg-rose-50 text-rose-600 rounded-xl p-3 mb-4 overflow-auto max-h-40 whitespace-pre-wrap break-words">
              {this.state.error.message}
            </pre>
            <div className="flex gap-2 justify-center">
              <button onClick={this.reset}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
                Try again
              </button>
              <button onClick={() => { window.location.href = "/"; }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                Go home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
