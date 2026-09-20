import { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Logo } from './Logo';
import { LanguageSelector } from './LanguageSelector';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';

interface PublicNavProps {
  onNavigate: (page: string) => void;
  currentPage?: string;
}

type NavItem = { id: string; label: string; page: string };

export function PublicNav({ onNavigate, currentPage = 'landing' }: PublicNavProps) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const resourcesRef = useRef<HTMLDivElement>(null);

  const primary: NavItem[] = [
    { id: 'home', label: t('nav.home'), page: 'landing' },
    { id: 'create', label: t('nav.create'), page: 'create' },
    { id: 'templates', label: t('nav.templates'), page: 'templates' },
    { id: 'streamer', label: lang === 'hu' ? 'Streamer Studio' : 'Streamer Studio', page: 'streamer' },
    { id: 'merch', label: lang === 'hu' ? 'Merch Studio' : 'Merch Studio', page: 'creator' },
    { id: 'pricing', label: t('nav.pricing'), page: 'pricing' },
  ];

  const resources: NavItem[] = [
    { id: 'features', label: t('nav.features'), page: 'features' },
    { id: 'advertising', label: lang === 'hu' ? 'AI Reklám Studio' : 'AI Ad Studio', page: 'advertising' },
    { id: 'tattoo', label: lang === 'hu' ? 'Tattoo Library' : 'Tattoo Library', page: 'tattoo' },
    { id: 'planner', label: lang === 'hu' ? 'Tervező & Vizualizáló' : 'Planner & Visualizer', page: 'planner' },
    { id: 'music', label: t('nav.music'), page: 'music' },
    { id: 'workflow', label: t('nav.workflow'), page: 'workflow' },
    { id: 'projects', label: t('nav.projectsPublic'), page: 'projects' },
    { id: 'credits', label: t('nav.credits'), page: 'credits' },
    { id: 'faq', label: t('nav.faq'), page: 'faq' },
  ];

  const activePages: Record<string, string> = {
    landing: 'home',
    create: 'create',
    advertising: 'studio',
    templates: 'templates',
    projects: 'projects',
    music: 'music',
    pricing: 'pricing',
    streamer: 'streamer',
    creator: 'merch',
    tattoo: 'tattoo',
    planner: 'planner',
  };
  const activeId = activePages[currentPage] ?? '';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!resourcesOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
        setResourcesOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [resourcesOpen]);

  const go = (page: string) => {
    setMobileOpen(false);
    setResourcesOpen(false);
    setMobileResourcesOpen(false);
    onNavigate(page);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl celtic-header ${
        scrolled ? 'celtic-header--scrolled' : 'celtic-header--top'
      }`}
    >
      <div className="celtic-header-accent" aria-hidden="true" />
      <nav className="section-pad max-w-7xl mx-auto flex items-center justify-between h-16 lg:h-20">
        <button
          onClick={() => go('landing')}
          className="flex items-center shrink-0 transition-opacity hover:opacity-90"
          aria-label="DESIGNLY STUDIO home"
        >
          <div className="flex items-center gap-2.5">
            <Logo size={42} showText={false} />
            <div className="hidden sm:flex flex-col leading-none text-left">
              <span className="font-display text-[15px] tracking-[0.22em] text-cream-50">DESIGNLY</span>
              <span className="text-[9px] tracking-[0.34em] text-gold-300/80 mt-1">CREATIVE OS</span>
            </div>
          </div>
        </button>

        <div className="hidden lg:flex items-center gap-7">
          {primary.map((item) => (
            <button
              key={item.id}
              onClick={() => go(item.page)}
              className={`nav-link tracking-wide ${activeId === item.id ? 'nav-link--active' : ''}`}
              aria-current={activeId === item.id ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}

          <div ref={resourcesRef} className="relative">
            <button
              onClick={() => setResourcesOpen((v) => !v)}
              className="nav-link tracking-wide inline-flex items-center gap-1"
              aria-expanded={resourcesOpen}
              aria-haspopup="true"
            >
              {t('nav.resources')}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 ${resourcesOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {resourcesOpen && (
              <div className="absolute right-0 mt-3 w-52 rounded-xl border border-gold-600/20 bg-ink-950/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-fade-in">
                <div className="celtic-header-accent" aria-hidden="true" />
                {resources.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => go(item.page)}
                    className="w-full text-left px-4 py-2.5 text-sm text-cream-300 hover:text-gold-200 hover:bg-gold-600/10 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <a
            href={import.meta.env.VITE_VYRON_URL || '#'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gold-600/25 bg-ink-950/70 text-[10px] font-semibold tracking-[0.12em] text-gold-200 hover:border-gold-500/60 hover:bg-gold-600/10 transition-all"
          >
            ◆ VYRON ENGINE
          </a>
          <LanguageSelector />
          {user ? (
            <button onClick={() => go('dashboard')} className="btn-gold text-sm px-5 py-2.5">
              {t('nav.dashboard')}
            </button>
          ) : (
            <>
              <button
                onClick={() => go('login')}
                className="text-sm font-medium text-cream-200 hover:text-gold-200 px-4 py-2 rounded-lg border border-gold-600/25 hover:border-gold-500/50 transition-all duration-300"
              >
                {t('nav.login')}
              </button>
              <button onClick={() => go('signup')} className="btn-gold text-sm px-5 py-2.5">
                {t('nav.startCreating')}
              </button>
            </>
          )}
        </div>

        <div className="lg:hidden flex items-center gap-1">
          <LanguageSelector compact />
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 text-cream-200 hover:text-gold-200 transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 top-16 z-40 bg-ink-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden relative border-t border-gold-600/15 bg-ink-950/97 backdrop-blur-xl animate-fade-in z-50">
            <div className="section-pad py-6 flex flex-col gap-1">
              {primary.map((item) => (
                <button
                  key={item.id}
                  onClick={() => go(item.page)}
                  className={`text-left py-2.5 text-base transition-colors ${
                    activeId === item.id ? 'text-gold-200' : 'text-cream-200 hover:text-gold-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <button
                onClick={() => setMobileResourcesOpen((v) => !v)}
                className="flex items-center justify-between py-2.5 text-base text-cream-200 hover:text-gold-200 transition-colors"
                aria-expanded={mobileResourcesOpen}
              >
                {lang === 'hu' ? 'Erőforrások' : 'Resources'}
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${mobileResourcesOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {mobileResourcesOpen && (
                <div className="flex flex-col pl-4 border-l border-gold-600/20 ml-1">
                  {resources.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => go(item.page)}
                      className="text-left py-2 text-sm text-cream-300/80 hover:text-gold-200 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="h-px bg-gold-600/15 my-3" />

              {user ? (
                <button onClick={() => go('dashboard')} className="btn-gold w-full">
                  {t('nav.dashboard')}
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <button onClick={() => go('login')} className="btn-ghost w-full">
                    {t('nav.login')}
                  </button>
                  <button onClick={() => go('signup')} className="btn-gold w-full">
                    {t('nav.startCreating')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
