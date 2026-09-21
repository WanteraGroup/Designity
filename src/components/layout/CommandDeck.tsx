import type { ComponentType } from 'react';
import { Infinity as InfinityIcon, LogOut } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

export interface CommandDeckMenuItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface CommandDeckProps {
  active: string;
  menuItems: CommandDeckMenuItem[];
  onNavigate: (page: string) => void;
  controlItems?: CommandDeckMenuItem[];
}

export function CommandDeck({
  active,
  menuItems,
  onNavigate,
  controlItems = [],
}: CommandDeckProps) {
  const { t } = useI18n();
  const { profile, isOwner, isUnlimited, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    onNavigate('landing');
  };

  return (
    <aside className="designly-command-deck hidden lg:flex">
      <div className="p-6 pb-4 relative z-10">
        <button
          onClick={() => onNavigate('landing')}
          className="w-full flex items-center gap-3 text-left group"
          aria-label="DESIGNLY home"
        >
          <div className="w-12 h-12 shrink-0 rounded-[16px] border border-[#D6B36A]/30 bg-[#071311]/80 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_10px_28px_rgba(0,0,0,.35)]">
            <Logo size={42} />
          </div>
          <div className="min-w-0">
            <div className="text-[22px] font-serif tracking-[0.16em] text-[#E3FFFB] group-hover:text-white transition-colors">
              DESIGNLY
            </div>
            <div className="text-[7px] uppercase tracking-[0.22em] text-[#9CEEE5]/70 mt-1">
              CREATIVE OPERATING SYSTEM
            </div>
          </div>
        </button>

        <div className="mt-5 flex items-center justify-center gap-2 text-[9px] text-[#D6B36A]/50">
          <span>ᛉ</span><i className="h-px w-7 bg-gradient-to-r from-transparent via-[#9CEEE5]/50 to-transparent" />
          <span>ᛟ</span><i className="h-px w-7 bg-gradient-to-r from-transparent via-[#9CEEE5]/50 to-transparent" />
          <span>ᚱ</span><i className="h-px w-7 bg-gradient-to-r from-transparent via-[#9CEEE5]/50 to-transparent" />
          <span>ᚦ</span><i className="h-px w-7 bg-gradient-to-r from-transparent via-[#9CEEE5]/50 to-transparent" />
          <span>ᚷ</span>
        </div>
      </div>

      <div className="px-6 pb-2 text-[7px] uppercase tracking-[.28em] text-[#9CEEE5]/35">
        COMMAND DECK
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto relative z-10">
        {menuItems.map((item) => {
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'relative w-full flex items-center gap-3 px-4 py-3 rounded-[14px]',
                'transition-all duration-200',
                isActive
                  ? 'bg-[#071311]/80 border border-[#9CEEE5]/40 shadow-[0_0_12px_rgba(156,238,229,0.25)]'
                  : 'border border-transparent hover:bg-[#071311]/40',
              ].join(' ')}
            >
              <item.icon
                className={[
                  'w-5 h-5 shrink-0',
                  isActive ? 'text-[#9CEEE5]' : 'text-[#EEE8DC]/60',
                ].join(' ')}
              />
              <span
                className={[
                  'text-sm tracking-wide text-left truncate',
                  isActive ? 'text-[#E3FFFB]' : 'text-[#EEE8DC]/70',
                ].join(' ')}
              >
                {item.label}
              </span>

              {isActive && (
                <div className="absolute left-0 top-0 h-full w-[3px] bg-[#9CEEE5] rounded-r-md shadow-[0_0_10px_rgba(156,238,229,0.55)]" />
              )}
            </button>
          );
        })}
      </nav>

      {controlItems.length > 0 && (
        <div className="px-4 pt-3 pb-2 border-t border-[#263636]/80 relative z-10">
          <div className="px-2 pb-2 text-[7px] uppercase tracking-[.28em] text-[#D6B36A]/45">
            CONTROL
          </div>
          <div className="space-y-1">
            {controlItems.map((item) => {
              const isActive = active === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'relative w-full flex items-center gap-3 px-4 py-3 rounded-[14px]',
                    'transition-all duration-200',
                    isActive
                      ? 'bg-[#071311]/80 border border-[#9CEEE5]/40 shadow-[0_0_12px_rgba(156,238,229,0.25)]'
                      : 'border border-transparent hover:bg-[#071311]/40',
                  ].join(' ')}
                >
                  <item.icon className={isActive ? 'w-5 h-5 text-[#9CEEE5]' : 'w-5 h-5 text-[#EEE8DC]/60'} />
                  <span className={isActive ? 'text-sm tracking-wide text-[#E3FFFB] truncate' : 'text-sm tracking-wide text-[#EEE8DC]/70 truncate'}>
                    {item.label}
                  </span>
                  {item.id === 'admin' && isOwner && (
                    <InfinityIcon className="w-3.5 h-3.5 text-[#D6B36A] ml-auto" />
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-0 h-full w-[3px] bg-[#9CEEE5] rounded-r-md shadow-[0_0_10px_rgba(156,238,229,0.55)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-3 pt-2 pb-2 relative z-10">
        <div className="rounded-[16px] border border-[#9CEEE5]/16 bg-[#071311]/65 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_18px_40px_rgba(0,0,0,.32)]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(127,245,199,.75)]" />
            <div>
              <div className="text-[9px] font-bold tracking-[.18em] text-[#E3FFFB]">HUGINN</div>
              <div className="text-[7px] uppercase tracking-[.14em] text-[#9CEEE5]/45 mt-1">AI SYSTEM ONLINE</div>
            </div>
            <span className="ml-auto text-[#D6B36A]/70">◈</span>
          </div>
          <div className="grid grid-cols-3 gap-1 mt-3">
            <div className="rounded-lg border border-[#9CEEE5]/8 bg-black/20 py-2 text-center">
              <strong className="block text-[10px] text-[#E3FFFB]">{isUnlimited ? '14' : '—'}</strong>
              <span className="block mt-1 text-[5px] uppercase tracking-[.08em] text-[#9CEEE5]/35">agents</span>
            </div>
            <div className="rounded-lg border border-[#9CEEE5]/8 bg-black/20 py-2 text-center">
              <strong className="block text-[10px] text-[#E3FFFB]">∞</strong>
              <span className="block mt-1 text-[5px] uppercase tracking-[.08em] text-[#9CEEE5]/35">routes</span>
            </div>
            <div className="rounded-lg border border-[#9CEEE5]/8 bg-black/20 py-2 text-center">
              <strong className="block text-[10px] text-[#7FF5C7]">LIVE</strong>
              <span className="block mt-1 text-[5px] uppercase tracking-[.08em] text-[#9CEEE5]/35">core</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 pt-2 border-t border-[#263636]/80 relative z-10">
        <div className="px-2 text-[9px] text-[#EEE8DC]/40 truncate">
          {profile?.email}
        </div>
        <div className="flex gap-1.5 flex-wrap mt-2 px-2">
          <span className="chip text-[7px]">{isOwner ? 'OWNER' : isUnlimited ? 'FULL UNLOCK ∞' : profile?.plan_id}</span>
          <span className="chip text-[7px]">{isUnlimited ? '∞ KORLÁTLAN' : `${(profile?.credits ?? 0).toLocaleString('hu-HU')} KREDIT`}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-2 w-full flex items-center justify-center gap-2 min-h-[34px] rounded-[10px] border border-[#9CEEE5]/10 bg-black/25 text-[8px] font-bold tracking-[.08em] text-[#EEE8DC]/45 hover:text-white hover:border-[#9CEEE5]/25 transition-all"
        >
          <LogOut className="w-4 h-4" />
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}
