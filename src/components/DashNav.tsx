import { useState } from 'react';
import {
  LayoutDashboard, Plus, Megaphone, Layers, FolderOpen, Palette, LayoutTemplate,
  ImageIcon, Coins, CreditCard, Settings, Shield, LogOut, Menu, X, Infinity as InfinityIcon, Music2, Network, Mic, Languages, Gamepad2, Radio, PenTool, Ruler, ShoppingBag, Hammer, FlaskConical,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

interface DashNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function DashNav({ currentPage, onNavigate }: DashNavProps) {
  const { t } = useI18n();
  const { profile, isOwner, isAdmin, isUnlimited, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'create', label: 'AI Website Builder', icon: Plus },
    { id: 'advertising', label: 'Ad Studio', icon: Megaphone },
    { id: 'campaign', label: 'Campaign Engine', icon: Layers },
    { id: 'music', label: 'AI Music Studio', icon: Music2 },
    { id: 'agents', label: 'Agent Hub', icon: Network },
    { id: 'voice', label: 'Voice Agent', icon: Mic },
    { id: 'translator', label: 'Realtime Translator', icon: Languages },
    { id: 'creator', label: 'Creator / Gamer Merch', icon: Gamepad2 },
    { id: 'streamer', label: 'Streamer Studio', icon: Radio },
    { id: 'tattoo', label: 'Tattoo Library', icon: PenTool },
    { id: 'planner', label: 'Planner & Visualizer', icon: Ruler },
    { id: 'cnc', label: 'CNC CAM', icon: Hammer },
    { id: 'projects', label: t('nav.projects'), icon: FolderOpen },
    { id: 'brands', label: t('nav.brands'), icon: Palette },
    { id: 'templates', label: '100K+ Templates', icon: LayoutTemplate },
    { id: 'assets', label: 'Asset Vault', icon: ImageIcon },
    { id: 'credits', label: 'Credit Center', icon: Coins },
    { id: 'billing', label: 'Plans & Billing', icon: CreditCard },
    { id: 'settings', label: 'Workspace Settings', icon: Settings },
    ...(isAdmin ? [{ id: 'shopify', label: 'Shopify Studio', icon: ShoppingBag }] : [])
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: t('nav.admin'), icon: Shield });
    navItems.push({ id: 'diagnostics', label: 'QA Center', icon: FlaskConical });
  }
  const privilegedIds = ['shopify', 'admin', 'diagnostics'];
  const primaryNavItems = navItems.filter((item) => !privilegedIds.includes(item.id));
  const privilegedNavItems = navItems.filter((item) => privilegedIds.includes(item.id));

  const handleNav = (page: string) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('landing');
  };

  return (
    <>
      {/* Desktop Command Deck */}
      <aside className="designly-command-deck hidden lg:flex">
        <div className="designly-command-brand">
          <button onClick={() => onNavigate('landing')} className="designly-command-brand-button">
            <div className="designly-command-mark">
              <Logo size={46} />
            </div>
            <div className="designly-command-brand-copy">
              <div className="designly-command-title">DESIGNLY</div>
              <div className="designly-command-subtitle">CREATIVE OPERATING SYSTEM</div>
            </div>
          </button>
          <div className="designly-command-rune-separator">
            <span>ᛉ</span><i /><span>ᛟ</span><i /><span>ᚱ</span><i /><span>ᚦ</span><i /><span>ᚷ</span>
          </div>
        </div>

        <div className="designly-command-section-label">COMMAND DECK</div>

        <nav className="designly-command-nav">
          {primaryNavItems.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`designly-command-item ${active ? 'is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="designly-command-item-icon"><item.icon className="w-4 h-4" /></span>
                <span className="designly-command-item-label">{item.label}</span>
                {active && <span className="designly-command-active-rune">◈</span>}
              </button>
            );
          })}
        </nav>

        {privilegedNavItems.length > 0 && (
          <div className="designly-command-privileged">
            <div className="designly-command-section-label">CONTROL</div>
            {privilegedNavItems.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`designly-command-item designly-command-item--control ${active ? 'is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="designly-command-item-icon"><item.icon className="w-4 h-4" /></span>
                  <span className="designly-command-item-label">{item.label}</span>
                  {item.id === 'admin' && isOwner && <InfinityIcon className="w-3.5 h-3.5 text-amber-200 ml-auto" />}
                  {active && <span className="designly-command-active-rune">◈</span>}
                </button>
              );
            })}
          </div>
        )}

        <div className="designly-command-spacer" />

        <div className="designly-command-huginn">
          <div className="designly-command-huginn-head">
            <span className="designly-online-dot" />
            <div>
              <div className="designly-command-huginn-name">HUGINN</div>
              <div className="designly-command-huginn-status">AI SYSTEM ONLINE</div>
            </div>
            <span className="designly-command-huginn-glyph">◈</span>
          </div>
          <div className="designly-command-huginn-stats">
            <div><strong>{isUnlimited ? '14' : '—'}</strong><span>AGENTS CONNECTED</span></div>
            <div><strong>∞</strong><span>AUTOMATION ROUTES</span></div>
            <div><strong>LIVE</strong><span>CORE STATUS</span></div>
          </div>
        </div>

        <div className="designly-command-user">
          <div className="designly-command-user-email">{profile?.email}</div>
          <div className="designly-command-user-meta">
            <span className="chip">{isOwner ? 'OWNER' : isUnlimited ? 'FULL UNLOCK ∞' : profile?.plan_id}</span>
            <span className="chip">{isUnlimited ? '∞ KORLÁTLAN' : `${(profile?.credits ?? 0).toLocaleString('hu-HU')} KREDIT`}</span>
          </div>
          <button onClick={handleSignOut} className="designly-command-logout">
            <LogOut className="w-4 h-4" /> {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b border-gold-600/10 bg-ink-900/90 backdrop-blur-xl z-50 flex items-center justify-between px-4">
        <button onClick={() => onNavigate('landing')}>
          <Logo size={28} showText={false} />
        </button>
        <div className="flex items-center gap-3">
          <span className="chip border-gold-600/30 bg-gold-600/10 text-gold-200 capitalize text-[10px]">
            {isOwner ? 'OWNER ∞' : isUnlimited ? 'FULL UNLOCK ∞' : profile?.plan_id}
          </span>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-cream-200">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 pt-14" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-14 bottom-0 w-64 bg-ink-900 border-r border-gold-600/10 overflow-y-auto animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="py-4 px-3 space-y-1">
              {primaryNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    currentPage === item.id
                      ? 'bg-gold-600/15 text-gold-200 border border-gold-600/20'
                      : 'text-cream-300/70 hover:bg-ink-700/40'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              ))}
              {privilegedNavItems.length > 0 && (
                <div className="mt-3 border-t border-gold-600/10 pt-3 space-y-1">
                  {privilegedNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                        currentPage === item.id
                          ? 'bg-gold-600/15 text-gold-200 border border-gold-600/20'
                          : 'text-gold-200/75 hover:bg-gold-600/10'
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-cream-300/60 hover:text-red-300 hover:bg-red-500/10 transition-all mt-4 border-t border-gold-600/10 pt-4"
              >
                <LogOut className="w-4 h-4" />
                {t('nav.logout')}
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
