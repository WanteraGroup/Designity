import type { ComponentType } from 'react';
import { Infinity as InfinityIcon, LogOut } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { SidebarMorphingBackground } from '@/components/ui';

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

function RuneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
      <path d="M8 3v18M8 5l8 4-8 4M8 13l8 4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4v16" strokeWidth="1.1" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}

export function CelticCorners() {
  return (
    <svg viewBox="0 0 400 64" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full">
      <g fill="none" stroke="currentColor" strokeWidth="1.15" opacity=".52">
        <path d="M8 2h34c8 0 12 4 15 10l2 5c3 7 7 10 15 10h36" />
        <path d="M392 2h-34c-8 0-12 4-15 10l-2 5c-3 7-7 10-15 10h-36" />
        <path d="M8 62h34c8 0 12-4 15-10l2-5c3-7 7-10 15-10h36" />
        <path d="M392 62h-34c-8 0-12-4-15-10l-2-5c-3-7-7-10-15-10h-36" />
        <path d="M10 5c6 4 9 9 9 15M390 5c-6 4-9 9-9 15M10 59c6-4 9-9 9-15M390 59c-6-4-9-9-9-15" opacity=".42" />
      </g>
      <g fill="currentColor" opacity=".55">
        <circle cx="8" cy="2" r="2.2" />
        <circle cx="392" cy="2" r="2.2" />
        <circle cx="8" cy="62" r="2.2" />
        <circle cx="392" cy="62" r="2.2" />
      </g>
    </svg>
  );
}

function MenuRow({
  item,
  onNavigate,
  isOwner,
  isActive,
}: {
  item: CommandDeckMenuItem;
  onNavigate: (page: string) => void;
  isOwner: boolean;
  isActive: boolean;
}) {
  return (
    <button
      key={item.id}
      onClick={() => onNavigate(item.id)}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'relative w-full flex items-center gap-3 px-4 py-3 rounded-[14px]',
        'bg-[#071311]/80 border border-[#9CEEE5]/40',
        'shadow-[0_0_12px_rgba(156,238,229,0.25)]',
        'transition-all duration-200 overflow-hidden',
        'hover:bg-[#0A1A18]/90 hover:border-[#9CEEE5]/55 hover:shadow-[0_0_18px_rgba(156,238,229,0.32)]',
        isActive ? 'ring-1 ring-[#D6B36A]/12' : '',
      ].join(' ')}
    >
      <div className="absolute inset-0 pointer-events-none text-[#9CEEE5]/28">
        <CelticCorners />
      </div>

      {isActive && (
        <div className="absolute left-0 top-0 h-full w-[3px] bg-[#9CEEE5] rounded-r-md shadow-[0_0_10px_rgba(156,238,229,0.55)]" />
      )}

      <item.icon className="relative z-10 w-5 h-5 shrink-0 text-[#9CEEE5]" />
      <span className="relative z-10 text-sm tracking-wide text-left truncate text-[#E3FFFB]">
        {item.label}
      </span>

      {item.id === 'admin' && isOwner ? (
        <InfinityIcon className="relative z-10 w-3.5 h-3.5 text-[#D6B36A] ml-auto" />
      ) : (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D6B36A]/70 pointer-events-none">
          <RuneIcon />
        </div>
      )}
    </button>
  );
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
    <aside className="designly-command-deck relative w-72 h-full hidden lg:flex">
      <SidebarMorphingBackground />
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
        {menuItems.map((item) => (
          <MenuRow
            key={item.id}
            item={item}
            onNavigate={onNavigate}
            isOwner={isOwner}
            isActive={true}
          />
        ))}
      </nav>

      {controlItems.length > 0 && (
        <div className="px-4 pt-3 pb-2 border-t border-[#263636]/80 relative z-10">
          <div className="px-2 pb-2 text-[7px] uppercase tracking-[.28em] text-[#D6B36A]/45">
            CONTROL
          </div>
          <div className="space-y-1">
            {controlItems.map((item) => (
              <MenuRow
                key={item.id}
                item={item}
                onNavigate={onNavigate}
                isOwner={isOwner}
                isActive={true}
              />
            ))}
          </div>
        </div>
      )}

      <div className="p-5 border-t border-[#263636] bg-[#020505]/60 relative z-10">
        <div className="text-[#9CEEE5] font-serif text-lg">HUGINN</div>
        <div className="text-xs text-[#EEE8DC]/60">AI SYSTEM ONLINE</div>
        <div className="mt-3 text-xs text-[#D6B36A]/80">
          {isUnlimited ? '14 AGENTS CONNECTED' : 'AI AGENTS READY'}
        </div>
        <div className="text-xs text-[#EEE8DC]/50">
          SYSTEM OPERATIONAL
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
