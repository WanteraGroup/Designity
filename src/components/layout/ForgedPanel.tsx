import type { ReactNode } from 'react';
import { CelticCorners } from './CommandDeck';

interface ForgedPanelProps {
  children: ReactNode;
  className?: string;
}

export function ForgedPanel({ children, className = '' }: ForgedPanelProps) {
  return (
    <div
      className={[
        'forged-panel relative overflow-hidden rounded-[18px]',
        'bg-[#020505]/80 border border-[#263636]',
        'shadow-[0_0_40px_rgba(0,0,0,0.7)]',
        'before:absolute before:inset-[1px] before:rounded-[16px]',
        'before:border before:border-[#9CEEE5]/10 before:pointer-events-none',
        'after:absolute after:inset-0 after:pointer-events-none',
        'after:bg-[radial-gradient(circle_at_top,_rgba(156,238,229,0.18),_transparent)]',
        className,
      ].join(' ')}
    >
      <div className="pointer-events-none absolute inset-0 text-[#9CEEE5]/28">
        <CelticCorners />
      </div>
      <div className="relative z-10 p-4">
        {children}
      </div>
    </div>
  );
}
