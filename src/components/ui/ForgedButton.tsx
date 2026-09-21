import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ForgedButtonVariant = 'primary' | 'secondary' | 'icon';

export interface ForgedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ForgedButtonVariant;
  className?: string;
}

const variants: Record<ForgedButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-[#D6B36A] to-[#B9784F] text-[#020505] ' +
    'hover:translate-y-[-1px] hover:shadow-[0_12px_26px_rgba(0,0,0,0.8)] ' +
    'border border-[#F4E8C7]/30',
  secondary:
    'bg-[#263636] text-[#E3FFFB] border border-[#9CEEE5]/30 ' +
    'hover:bg-[#071311] hover:border-[#9CEEE5]/45',
  icon:
    'bg-[#020505] text-[#9CEEE5] border border-[#9CEEE5]/40 w-9 h-9 p-0 ' +
    'hover:bg-[#071311]',
};

export function ForgedButton({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ForgedButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[14px] text-sm tracking-wide ' +
    'transition-all duration-150 shadow-[0_8px_20px_rgba(0,0,0,0.6)] ' +
    'active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed ' +
    'relative overflow-hidden';

  return (
    <button
      type={type}
      className={[base, variants[variant], className].join(' ')}
      {...props}
    >
      <span className="pointer-events-none absolute inset-x-2 top-[1px] h-px bg-white/30" aria-hidden="true" />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}
