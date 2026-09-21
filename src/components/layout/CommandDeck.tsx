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
          const isActive = true;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={active === item.id ? 'page' : undefined}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[14px] bg-[#071311]/80 border border-[#9CEEE5]/40 shadow-[0_0_12px_rgba(156,238,229,0.25)] relative"
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
              const isActive = true;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  aria-current={active === item.id ? 'page' : undefined}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-[14px] bg-[#071311]/80 border border-[#9CEEE5]/40 shadow-[0_0_12px_rgba(156,238,229,0.25)] relative"

