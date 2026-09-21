interface RunePulseProps {
  rune?: string;
  className?: string;
  duration?: string;
}

export function RunePulse({
  rune = 'ᚱ',
  className = '',
  duration = '2s',
}: RunePulseProps) {
  return (
    <div
      className={`pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 font-serif text-lg text-[#9CEEE5] animate-[pulse_var(--rune-pulse-duration)_ease-in-out_infinite] ${className}`}
      style={{ '--rune-pulse-duration': duration } as React.CSSProperties}
      aria-hidden="true"
    >
      {rune}
    </div>
  );
}

export default RunePulse;
