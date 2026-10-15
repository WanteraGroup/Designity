import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { I18nProvider } from '@/lib/i18n';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import App from '@/App';
import '@/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary>
      <I18nProvider>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<BootSplash />}>
              <App />
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </I18nProvider>
    </AppErrorBoundary>
  </StrictMode>,
);

function BootSplash() {
  return (
    <div className="min-h-screen grid place-items-center bg-ink-950">
      <div className="w-8 h-8 rounded-full border-2 border-gold-600/30 border-t-gold-400 animate-spin" />
    </div>
  );
}
