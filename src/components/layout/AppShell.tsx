import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Sparkles, FolderOpen, LayoutTemplate, Palette,
  Image, Coins, CreditCard, Settings as SettingsIcon, Shield, LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

const NAV = [
  { to: '/app', end: true, key: 'nav.dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/app/create', key: 'nav.create', label: 'Create', Icon: Sparkles },
  { to: '/app/projects', key: 'nav.projects', label: 'Projects', Icon: FolderOpen },
  { to: '/app/templates', key: 'nav.templates', label: 'Templates', Icon: LayoutTemplate },
  { to: '/app/brands', key: 'nav.brands', label: 'Brand Kits', Icon: Palette },
  { to: '/app/assets', key: 'nav.assets', label: 'Assets', Icon: Image },
  { to: '/app/credits', key: 'nav.credits', label: 'Credits', Icon: Coins },
  { to: '/app/billing', key: 'nav.billing', label: 'Billing', Icon: CreditCard },
  { to: '/app/settings', key: 'nav.settings', label: 'Settings', Icon: SettingsIcon },
];

export function AppShell() {
  const { profile, isAdmin, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-ink-950 text-cream-100">
      <div className="designly-backdrop" aria-hidden />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-gold-700/25 bg-ink-900/80 backdrop-blur lg:flex">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-gold-700/20">
          <img src="/designly-knot.svg" alt="" className="h-8 w-8" />
          <span className="font-display text-lg tracking-[0.2em] text-gold-200">DESIGNLY</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map(({ to, end, key, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive
                    ? 'bg-gold-600/15 text-gold-200'
                    : 'text-cream-300/65 hover:bg-ink-800 hover:text-cream-100'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(key) === key ? label : t(key)}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/app/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive
                    ? 'bg-gold-600/15 text-gold-200'
                    : 'text-cream-300/65 hover:bg-ink-800 hover:text-cream-100'
                }`
              }
            >
              <Shield className="h-4 w-4 shrink-0" />
              {t('nav.admin') === 'nav.admin' ? 'Admin' : t('nav.admin')}
            </NavLink>
          )}
        </nav>

        <div className="border-t border-gold-700/20 px-4 py-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="text-cream-300/60">
              {profile?.unlimited_access ? '∞' : (profile?.credits ?? 0)} credits
            </span>
            <span className="rounded bg-gold-600/15 px-2 py-0.5 text-gold-200">
              {profile?.plan_id ?? 'free'}
            </span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-cream-300/65 transition hover:bg-ink-800 hover:text-cream-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
