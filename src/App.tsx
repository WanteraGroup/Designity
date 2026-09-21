import './designly-brand-overrides.css';
import './designly-dashboard-overrides.css';
import './designly-forged-system.css';
import './designly-forged-landing.css';
import './designly-viking-frost.css';
import './designly-odin-hall.css';
import './designly-odin-hall-v2.css';
import './designly-odin-hall-4.css';
import './designly-odin-hall-max.css';
import './designly-odin-hall-3.css';
import './designly-visual-final.css';
import { useState, useEffect, useRef, lazy, Suspense, type ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { I18nProvider } from '@/lib/i18n';
import { PublicNav } from '@/components/PublicNav';
import LandingPage from '@/pages/Landing';
import ForgeStudio from '@/pages/ForgeStudio';
import Music from '@/pages/Music';
import Voice from '@/pages/Voice';
import Translator from '@/pages/Translator';
import Shopify from '@/pages/Shopify';
import Brands from '@/pages/Brands';
import Templates from '@/pages/Templates';
import Tattoo from '@/pages/Tattoo';
import Planner from '@/pages/Planner';
import Credits from '@/pages/Credits';
import Projects from '@/pages/Projects';
import CNC from '@/pages/CNC';
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
import { AssetsPage } from '@/components/AssetsPage';
import { SettingsPage } from '@/components/SettingsPage';
import { AdvertisingStudio } from '@/components/AdvertisingStudio';
import Campaigns from '@/pages/Campaigns';
import { CampaignGenerator } from '@/components/CampaignGenerator';
import { CheckoutPage } from '@/components/CheckoutPage';
import { HuginnAgent } from '@/components/HuginnAgent';
import Agents from '@/pages/Agents';
import { VoiceAgentPage } from '@/components/VoiceAgentPage';
import { RealtimeTranslatorPage } from '@/components/RealtimeTranslatorPage';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { CreatorMerchPage } from '@/components/CreatorMerchPage';
import { StreamerStudioPage } from '@/components/StreamerStudioPage';
import { ShopifyStudioPage } from '@/components/ShopifyStudioPage';
import { DesignPlannerPage } from '@/components/DesignPlannerPage';
import { CncCamPage } from '@/components/CncCamPage';
import { DiagnosticsPage } from '@/components/DiagnosticsPage';
import { TattooLibraryPage } from '@/components/TattooLibraryPage';
import { NordicHeader } from '@/components/ui';
const MusicPage = lazy(() => import('@/components/MusicPage').then((m) => ({ default: m.MusicPage })));

type Page =
  | 'landing' | 'login' | 'signup' | 'reset' | 'checkout'
  | 'dashboard' | 'forge' | 'create' | 'advertising' | 'campaign' | 'campaign-workspace' | 'projects' | 'brands'
  | 'templates' | 'tattoo' | 'tattoo-library' | 'planner' | 'planner-workspace' | 'assets' | 'credits' | 'billing'
  | 'settings' | 'admin' | 'editor' | 'music' | 'music-workspace' | 'agents' | 'voice' | 'voice-workspace' | 'translator' | 'translator-workspace' | 'creator' | 'streamer' | 'shopify' | 'shopify-workspace' | 'cnc' | 'cnc-workspace' | 'diagnostics';

const LANDING_SECTIONS = ['features', 'workflow', 'templates', 'pricing', 'faq', 'credits'];
const PUBLIC_PAGES: Page[] = ['landing', 'login', 'signup', 'reset', 'checkout'];
const DASHBOARD_PAGES: Page[] = [
  'dashboard', 'forge', 'create', 'advertising', 'campaign', 'campaign-workspace', 'projects', 'brands',
  'templates', 'tattoo', 'tattoo-library', 'planner', 'planner-workspace', 'assets', 'credits', 'billing',
  'settings', 'admin', 'editor', 'music', 'music-workspace', 'agents', 'voice', 'voice-workspace', 'translator', 'translator-workspace', 'creator', 'streamer', 'shopify', 'shopify-workspace', 'cnc', 'cnc-workspace', 'diagnostics',
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

  // Global content protection: non-admin users cannot open the browser context menu.
  // Admin users keep normal right-click access across the entire application.
  useEffect(() => {
    if (isAdmin) return;
    const preventContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };
    document.addEventListener('contextmenu', preventContextMenu, true);
    return () => document.removeEventListener('contextmenu', preventContextMenu, true);
  }, [isAdmin]);

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
      case 'forge': return <ForgeStudio onNavigate={navigate} />;
      case 'create': return <CreatePage onNavigate={navigate} />;
      case 'advertising': return <AdvertisingStudio onNavigate={navigate} />;
      case 'campaign': return <Campaigns onNavigate={navigate} />;
      case 'campaign-workspace': return <CampaignGenerator onNavigate={navigate} />;
      case 'projects': return <Projects onNavigate={navigate} />;
      case 'brands': return <Brands onNavigate={navigate} />;
      case 'templates': return <Templates onNavigate={navigate} />;
      case 'tattoo': return <Tattoo onNavigate={navigate} />;
      case 'tattoo-library': return <TattooLibraryPage onNavigate={navigate} />;
      case 'planner': return <Planner onNavigate={navigate} />;
      case 'planner-workspace': return <DesignPlannerPage onNavigate={navigate} />;
      case 'assets': return <AssetsPage onNavigate={navigate} />;
      case 'credits': return <Credits onNavigate={navigate} />;
      case 'billing': return <BillingPage onNavigate={navigate} />;
      case 'settings': return <SettingsPage onNavigate={navigate} />;
      case 'admin': return <AdminPage onNavigate={navigate} />;
      case 'editor': return <EditorPage onNavigate={navigate} />;
      case 'music': return <Music onNavigate={navigate} />;
      case 'music-workspace': return <MusicPage onNavigate={navigate} />;
      case 'agents': return <Agents onNavigate={navigate} />;
      case 'voice': return <Voice onNavigate={navigate} />;
      case 'voice-workspace': return <VoiceAgentPage onNavigate={navigate} />;
      case 'translator': return <Translator onNavigate={navigate} />;
      case 'translator-workspace': return <RealtimeTranslatorPage onNavigate={navigate} />;
      case 'shopify': return <Shopify onNavigate={navigate} />;
      case 'shopify-workspace': return <ShopifyStudioPage onNavigate={navigate} />;
      case 'creator': return <CreatorMerchPage onNavigate={navigate} />;
      case 'streamer': return <StreamerStudioPage onNavigate={navigate} />;
      case 'cnc': return <CNC onNavigate={navigate} />;
      case 'cnc-workspace': return <CncCamPage />;
      case 'diagnostics': return <DiagnosticsPage />;
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
    ? 'lg:pl-72 pt-14 lg:pt-0'
    : '';

  const pageTitles: Partial<Record<Page, string>> = {
    dashboard: 'DESIGNLY CORE',
    forge: 'FORGE STUDIO',
    create: 'FORGE WORKSPACE',
    advertising: 'ADVERTISING STUDIO',
    campaign: 'STRATEGIC WAR ROOM',
    'campaign-workspace': 'CAMPAIGN GENERATOR',
    projects: 'PROJECTS',
    brands: 'BRAND VAULT',
    templates: 'TEMPLATE HALL',
    tattoo: 'RUNE & SKIN STUDIO',
    'tattoo-library': 'TATTOO LIBRARY',
    planner: 'STRATEGIC PLANNER',
    'planner-workspace': 'DESIGN PLANNER & VISUALIZER',
    assets: 'ASSET LIBRARY',
    credits: 'CREDIT FORGE',
    billing: 'BILLING',
    settings: 'SYSTEM SETTINGS',
    admin: 'ADMIN COMMAND',
    music: 'SOUND HALL',
    'music-workspace': 'MUSIC FORGE WORKSPACE',
    agents: 'AGENT HUB',
    voice: 'COMMUNICATION CHAMBER',
    'voice-workspace': 'VOICE AGENT WORKSPACE',
    translator: 'GLOBAL RUNE NETWORK',
    'translator-workspace': 'REALTIME TRANSLATOR WORKSPACE',
    shopify: 'MERCHANT HALL',
    'shopify-workspace': 'SHOPIFY STUDIO',
    cnc: 'ENGINEERING FORGE',
    'cnc-workspace': 'CNC CAM WORKSPACE',
    creator: 'CREATOR MERCH',
    streamer: 'STREAMER STUDIO',
    cnc: 'CNC CAM',
    diagnostics: 'QA CENTER',
  };
  const dashboardTitle = pageTitles[page] ?? 'DESIGNLY';

  return (
    <div className="min-h-screen bg-transparent">
      {isPublic && page !== 'landing' && <PublicNav onNavigate={navigate} currentPage={page} />}
      {isDashboard && <DashNav currentPage={page} onNavigate={navigate} />}

      <HuginnAgent onNavigate={navigate} />

      <div className={contentWrapperClass}>
        {isDashboard && !isEditor && (
          <NordicHeader
            title={dashboardTitle}
            userLabel="DESIGNLY OPERATOR"
          />
        )}
        {isPublic && (
          <main className={`designly-public-page designly-page-${page} ${page === 'landing' ? '' : 'pt-16 lg:pt-20'}`}>
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
          <main className="section-pad designly-app-page designly-page-editor min-h-screen">
            <Suspense fallback={<div className="min-h-[60vh] grid place-items-center"><div className="w-8 h-8 border-2 border-gold-600/30 border-t-gold-400 rounded-full animate-spin" /></div>}>
              {renderDashboardPage()}
            </Suspense>
          </main>
        )}

        {isDashboard && !isEditor && (
          <main className={`section-pad designly-app-page designly-page-${page} py-8 lg:py-10 max-w-7xl mx-auto`}>
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
    <AppErrorBoundary>
      <I18nProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </I18nProvider>
    </AppErrorBoundary>
  );
}
