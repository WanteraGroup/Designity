import { useState } from 'react';
import {
  LayoutDashboard, Plus, Megaphone, Layers, FolderOpen, Palette, LayoutTemplate,
  ImageIcon, Coins, CreditCard, Settings, Shield, LogOut, Menu, X, Infinity as InfinityIcon,
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
    { id: 'create', label: t('nav.create'), icon: Plus },
    { id: 'advertising', label: t('nav.advertising'), icon: Megaphone },
    { id: 'campaign', label: t('nav.campaign'), icon: Layers },
    { id: 'projects', label: t('nav.projects'), icon: FolderOpen },
    { id: 'brands', label: t('nav.brands'), icon: Palette },
    { id: 'templates', label: t('nav.templatesDash'), icon: LayoutTemplate },
    { id: 'assets', label: t('nav.assets'), icon: ImageIcon },
    { id: 'credits', label: t('nav.credits'), icon: Coins },
    { id: 'billing', label: t('nav.billing'), icon: CreditCard },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: t('nav.admin'), icon: Shield });
  }

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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 fixed left-0 top-0 bottom-0 border-r border-gold-600/10 bg-ink-900/90 backdrop-blur-xl z-40">
        <div className="h-16 flex items-center px-5 border-b border-gold-600/10">
          <button onClick={() => onNavigate('landing')}>
            <Logo size={32} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 ${
                currentPage === item.id
                  ? 'bg-gold-600/15 text-gold-200 border border-gold-600/20'
                  : 'text-cream-300/70 hover:text-gold-200 hover:bg-ink-700/40 border border-transparent'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.id === 'admin' && isOwner && (
                <InfinityIcon className="w-3.5 h-3.5 text-gold-400 ml-auto" />
              )}
            </button>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-gold-600/10">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-cream-400/50 truncate">{profile?.email}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="chip border-gold-600/30 bg-gold-600/10 text-gold-200 capitalize">
                {isOwner ? 'OWNER' : isUnlimited ? 'FULL UNLOCK ∞' : profile?.plan_id}
              </span>
              {isOwner && (
                <span className="chip border-gold-600/40 bg-gold-600/15 text-gold-300">
                  <InfinityIcon className="w-3 h-3" /> ∞
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-cream-300/60 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            {t('nav.logout')}
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
              {navItems.map((item) => (
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
