interface LogoProps {
  size?: number;
  showText?: boolean;
  variant?: 'full' | 'icon';
  className?: string;
}

export function Logo({ size = 40, showText = true, variant = 'full', className = '' }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/designly-logo.webp"
        width={size}
        height={size}
        className="shrink-0 rounded-full"
        alt="DESIGNLY STUDIO logo"
        style={{ width: size, height: size, objectFit: 'contain' }}
      />

      {showText && variant === 'full' && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-lg font-bold tracking-wide text-cream-50">
            DESIGNLY
          </span>
          <span className="text-[10px] tracking-[0.35em] text-gold-400 font-medium">
            STUDIO
          </span>
        </div>
      )}
    </div>
  );
}
