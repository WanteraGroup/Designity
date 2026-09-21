import { useState } from 'react';
import {
  LayoutDashboard, Plus, Megaphone, Layers, FolderOpen, Palette, LayoutTemplate,
  ImageIcon, Coins, CreditCard, Settings, Shield, LogOut, Menu, X, Infinity as InfinityIcon, Music2, Network, Mic, Languages, Gamepad2, Radio, PenTool, Ruler, ShoppingBag, Hammer, Globe2,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { CommandDeck } from '@/components/layout/CommandDeck';

interface DashNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function DashNav({ currentPage, onNavigate }: DashNavProps) {
  const { t } = useI18n();
  const { profile, isOwner, isAdmin, isUnlimited, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'COMMAND', icon: LayoutDashboard },
    { id: 'forge', label: 'FORGE', icon: Hammer },
    { id: 'websites', label: 'WEBSITES', icon: Globe2 },
    { id: 'projects', label: 'PROJECTS', icon: FolderOpen },
    { id: 'agents', label: 'AGENTS', icon: Network },
    { id: 'campaign', label: 'CAMPAIGNS', icon: Layers },
    { id: 'music', label: 'MUSIC', icon: Music2 },
    { id: 'voice', label: 'VOICE', icon: Mic },
    { id: 'translator', label: 'TRANSLATOR', icon: Languages },
    ...(isAdmin ? [{ id: 'shopify', label: 'SHOPIFY', icon: ShoppingBag }] : []),
    { id: 'cnc', label: 'CNC', icon: Hammer },
    { id: 'tattoo', label: 'TATTOO', icon: PenTool },
    { id: 'planner', label: 'PLANNER', icon: Ruler },
    { id: 'brands', label: 'BRANDS', icon: Palette },
    { id: 'templates', label: 'TEMPLATES', icon: LayoutTemplate },
    { id: 'assets', label: 'ASSETS', icon: ImageIcon },
    { id: 'credits', label: 'CREDITS', icon: Coins },
    { id: 'billing', label: 'BILLING', icon: CreditCard },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
    ...(isAdmin ? [{ id: 'admin', label: 'ADMIN', icon: Shield }] : []),
  ];
  const privilegedIds = ['admin'];
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
      <CommandDeck
        active={currentPage}
        menuItems={primaryNavItems}
        controlItems={privilegedNavItems}
        onNavigate={handleNav}
      />

      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b border-gold-600/10 bg-ink-900/90 backdrop-blur-xl z-50 flex items-center justify-between px-4">
        <button onClick={() => onNavigate('landing')}>
          <Logo size={28} showText={false} />
        </button>
        <div className="flex items-center gap-3">
          <span className="chip border-gold-600/30 bg-gold-600/10 text-gold-200 capitalize text-[10px]">
            {isOwner ? 'OWNER INF' : isUnlimited ? 'FULL UNLOCK INF' : profile?.plan_id}
          </span>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-cream-200">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

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
