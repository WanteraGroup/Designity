import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen grid place-items-center bg-ink-950 p-6">
        <div className="max-w-lg w-full rounded-xl border border-gold-700/40 bg-ink-900 p-8 text-center">
          <h1 className="font-display text-2xl text-gold-200 mb-3">Something broke</h1>
          <p className="text-sm text-cream-300/70 mb-6">
            The interface hit an error it could not recover from.
          </p>
          <pre className="text-left text-xs text-cream-400/60 bg-ink-850 rounded-lg p-4 overflow-auto max-h-40 mb-6">
            {error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-gold-600 px-5 py-2.5 text-sm font-semibold text-ink-950 hover:bg-gold-500 transition"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
