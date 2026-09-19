import { useState, useEffect, useRef, lazy, Suspense, type ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { I18nProvider } from '@/lib/i18n';
import { PublicNav } from '@/components/PublicNav';
import { LandingPage } from '@/components/LandingPage';
import { AuthPage } from '@/components/AuthPage';
import { DashNav } from '@/components/DashNav';
import { DashboardHome } from '@/components/DashboardHome';
import { CreatePage } from '@/components/CreatePage';
import { ProjectsPage } from '@/components/ProjectsPage';
import { BrandsPage } from '@/components/BrandsPage';
import { CreditsPage } from '@/components/CreditsPage';
import { BillingPage } from '@/components/BillingPage';
import { AdminPage } from '@/components/AdminPage';
import { EditorPage } from '@/components/EditorPage';
const TemplatesPage = lazy(() => import('@/components/TemplatesPage').then((m) => ({ default: m.TemplatesPage })));
import { AssetsPage } from '@/components/AssetsPage';
import { SettingsPage } from '@/components/SettingsPage';
import { AdvertisingStudio } from '@/components/AdvertisingStudio';
import { CampaignGenerator } from '@/components/CampaignGenerator';
import { CheckoutPage } from '@/components/CheckoutPage';
import { HuginnAgent } from '@/components/HuginnAgent';
const MusicPage = lazy(() => import('@/components/MusicPage').then((m) => ({ default: m.MusicPage })));

type Page =
  | 'landing' | 'login' | 'signup' | 'reset' | 'checkout'
  | 'dashboard' | 'create' | 'advertising' | 'campaign' | 'projects' | 'brands'
  | 'templates' | 'assets' | 'credits' | 'billing'
  | 'settings' | 'admin' | 'editor' | 'music';

const LANDING_SECTIONS = ['features', 'workflow', 'templates', 'pricing', 'faq', 'credits'];
const PUBLIC_PAGES: Page[] = ['landing', 'login', 'signup', 'reset', 'checkout'];
const DASHBOARD_PAGES: Page[] = [
  'dashboard', 'create', 'advertising', 'campaign', 'projects', 'brands',
  'templates', 'assets', 'credits', 'billing',
  'settings', 'admin', 'editor', 'music',
];

function pageFromHash(): Page {
  if (typeof window === 'undefined') return 'landing';
  const hash = window.location.hash.slice(1);
  // Supabase password-recovery links arrive with auth tokens in the hash.
  // Keep the recovery screen active so the user can set a new password.
  if (hash.includes('type=recovery')) return 'reset';
  const value = hash as Page;
  return [...PUBLIC_PAGES, ...DASHBOARD_PAGES].includes(value) ? value : 'landing';
}

type CheckoutItem = { type: 'subscription' | 'credit_package'; itemId: string };

function AppInner() {
  const { user, loading, authKnown, isAdmin } = useAuth();
  const [page, setPage] = useState<Page>(pageFromHash);
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
  const pendingScrollRef = useRef<string | null>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      return true;
    }
    return false;
  };

  const navigate = (p: string, item?: CheckoutItem) => {
    if (item) setCheckoutItem(item);
    if (LANDING_SECTIONS.includes(p) && page === 'landing') {
      scrollToSection(p);
      return;
    }
    if (LANDING_SECTIONS.includes(p)) {
      pendingScrollRef.current = p;
      setPage('landing');
      return;
    }

    const next = p as Page;
    if (DASHBOARD_PAGES.includes(next) && !user && authKnown) {
      window.history.pushState({}, '', '#login');
      setPage('login');
      return;
    }
    if (next === 'admin' && !isAdmin) {
      window.history.replaceState({}, '', '#dashboard');
      setPage('dashboard');
      return;
    }
    window.history.pushState({}, '', `#${next}`);
    setPage(next);
    if (PUBLIC_PAGES.includes(next) || DASHBOARD_PAGES.includes(next)) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  useEffect(() => {
    if (page === 'landing' && pendingScrollRef.current) {
      const sectionId = pendingScrollRef.current;
      pendingScrollRef.current = null;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToSection(sectionId);
        });
      });
    }
  }, [page]);

  useEffect(() => {
    const handlePopState = () => setPage(pageFromHash());
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!authKnown) return;
    if (user && PUBLIC_PAGES.includes(page) && page !== 'landing' && page !== 'reset') {
      window.history.replaceState({}, '', '#dashboard');
      setPage('dashboard');
    } else if (!user && DASHBOARD_PAGES.includes(page)) {
      window.history.replaceState({}, '', '#login');
      setPage('login');
    }
  }, [authKnown, user, page]);

  const renderPublicPage = (): ReactNode => {
    switch (page) {
      case 'login': return <AuthPage mode="login" onNavigate={navigate} />;
      case 'signup': return <AuthPage mode="signup" onNavigate={navigate} />;
      case 'reset': return <AuthPage mode="reset" onNavigate={navigate} />;
      case 'checkout': return <CheckoutPage onNavigate={navigate} checkoutItem={checkoutItem} />;
      default: return <LandingPage onNavigate={navigate} />;
    }
  };

  const renderDashboardPage = (): ReactNode => {
    switch (page) {
      case 'dashboard': return <DashboardHome onNavigate={navigate} />;
      case 'create': return <CreatePage onNavigate={navigate} />;
      case 'advertising': return <AdvertisingStudio onNavigate={navigate} />;
      case 'campaign': return <CampaignGenerator onNavigate={navigate} />;
      case 'projects': return <ProjectsPage onNavigate={navigate} />;
      case 'brands': return <BrandsPage onNavigate={navigate} />;
      case 'templates': return <TemplatesPage onNavigate={navigate} />;
      case 'assets': return <AssetsPage onNavigate={navigate} />;
      case 'credits': return <CreditsPage onNavigate={navigate} />;
      case 'billing': return <BillingPage onNavigate={navigate} />;
      case 'settings': return <SettingsPage onNavigate={navigate} />;
      case 'admin': return <AdminPage onNavigate={navigate} />;
      case 'editor': return <EditorPage onNavigate={navigate} />;
      case 'music': return <MusicPage onNavigate={navigate} />;
      default: return <DashboardHome onNavigate={navigate} />;
    }
  };

  // Determine which shell to show. During initial auth resolution we
  // default to the public shell so the landing page is visible immediately
  // — no full-tree swap when auth completes.
  const authPending = loading && !authKnown;
  const isPublic = authPending || PUBLIC_PAGES.includes(page);
  const isDashboard = !isPublic;
  const isEditor = page === 'editor';

  const contentWrapperClass = isDashboard
    ? 'lg:pl-60 pt-14 lg:pt-0'
    : '';

  return (
    <div className="min-h-screen bg-ink-950">
      {isPublic && <PublicNav onNavigate={navigate} currentPage={page} />}
      {isDashboard && <DashNav currentPage={page} onNavigate={navigate} />}

      <HuginnAgent onNavigate={navigate} />

      <div className={contentWrapperClass}>
        {isPublic && (
          <main className={page === 'landing' ? '' : 'pt-16 lg:pt-20'}>
            {authPending ? (
              <div className="relative">
                <LandingPage onNavigate={navigate} />
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                  <div className="w-8 h-8 border-2 border-gold-600/30 border-t-gold-400 rounded-full animate-spin" />
                </div>
              </div>
            ) : (
              renderPublicPage()
            )}
          </main>
        )}

        {isDashboard && isEditor && (
          <div className="min-h-screen">
            {renderDashboardPage()}
          </div>
        )}

        {isDashboard && !isEditor && (
          <main className="section-pad py-8 lg:py-10 max-w-7xl mx-auto">
            <Suspense fallback={<div className="min-h-[60vh] grid place-items-center"><div className="w-8 h-8 border-2 border-gold-600/30 border-t-gold-400 rounded-full animate-spin" /></div>}>
              {renderDashboardPage()}
            </Suspense>
          </main>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </I18nProvider>
  );
}
