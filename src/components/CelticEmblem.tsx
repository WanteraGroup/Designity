interface CelticEmblemProps {
  size?: number;
  className?: string;
  animate?: boolean;
  showD?: boolean;
}

/**
 * DESIGNLY brand emblem.
 * The supplied "kor keret.png" is the official circular frame.
 * The supplied "designly-logo.webp" remains the static center mark.
 */
export function CelticEmblem({ size = 200, className = '', animate = false, showD = true }: CelticEmblemProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-label="DESIGNLY STUDIO emblem"
    >
      <img
        src="/kor keret.png"
        alt=""
        aria-hidden="true"
        className={animate ? 'designly-frame-spin' : ''}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          filter: 'drop-shadow(0 0 18px rgba(211,170,76,.18))',
        }}
      />

      {showD && (
        <div
          className="absolute flex items-center justify-center overflow-hidden rounded-full"
          style={{
            width: size * 0.52,
            height: size * 0.52,
            background: 'rgba(5,6,7,.72)',
            boxShadow: 'inset 0 0 28px rgba(0,0,0,.85), 0 0 0 1px rgba(211,170,76,.28)',
            pointerEvents: 'none',
          }}
        >
          <img
            src="/designly-logo.webp"
            alt="DESIGNLY"
            className="w-full h-full object-contain"
            style={{ pointerEvents: 'none' }}
          />
        </div>
      )}
    </div>
  );
}
