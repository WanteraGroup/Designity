import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Ismeretlen alkalmazási hiba.',
    };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('DESIGNLY runtime error:', error, info);
  }

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#030405] text-[#f3eee2] grid place-items-center p-6">
        <div className="w-full max-w-xl rounded-3xl border border-[#d8b45a33] bg-[#0a0c0e] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 h-16 w-16 rounded-full border border-[#d8b45a66] grid place-items-center text-2xl text-[#d8b45a]">
            ᛟ
          </div>
          <div className="text-[10px] uppercase tracking-[.28em] text-[#d8b45a]">DESIGNLY · RUNTIME GUARD</div>
          <h1 className="mt-3 text-2xl font-semibold">A modul hibába ütközött.</h1>
          <p className="mt-3 text-sm leading-6 text-[#f3eee2aa]">
            A munkamenetet nem töröltük. Töltsd újra az oldalt, és a DESIGNLY megpróbálja újra betölteni az alkalmazást.
          </p>
          {this.state.message && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-left text-xs text-red-200 break-words">
              {this.state.message}
            </div>
          )}
          <button
            type="button"
            onClick={this.reload}
            className="mt-6 inline-flex items-center justify-center rounded-xl border border-[#fff0b188] bg-gradient-to-r from-[#8e681e] via-[#f7e4aa] to-[#b88b31] px-5 py-3 text-sm font-extrabold text-[#171106]"
          >
            ALKALMAZÁS ÚJRATÖLTÉSE
          </button>
        </div>
      </div>
    );
  }
}
