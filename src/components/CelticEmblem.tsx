interface CelticEmblemProps {
  size?: number;
  className?: string;
  animate?: boolean;
  showD?: boolean;
}

/**
 * DESIGNLY STUDIO signature Celtic ornamental frame.
 * A circular silver-edged, gold-highlighted Celtic knotwork frame with concentric rings,
 * interwoven knot patterns, and a stylized D at the center.
 *
 * Only the outer ornamental ring rotates — the center D stays static
 * so the brand mark remains readable at all times.
 * Respects prefers-reduced-motion.
 */
export function CelticEmblem({ size = 200, className = '', animate = true, showD = true }: CelticEmblemProps) {
  const gid = `celtic-${size}-${animate ? 'a' : 's'}`;
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-label="DESIGNLY STUDIO emblem"
    >
      {/* Outer rotating ornamental ring */}
      <svg
        viewBox="0 0 400 400"
        width={size}
        height={size}
        className={animate ? 'animate-spin-slow' : ''}
        style={{ transformOrigin: 'center', position: 'absolute', top: 0, left: 0, willChange: 'transform' }}
      >
        <defs>
          <linearGradient id={`${gid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8a6820" />
            <stop offset="22%" stopColor="#d8d8d2" />
            <stop offset="42%" stopColor="#f4f1e8" />
            <stop offset="58%" stopColor="#b8b8b3" />
            <stop offset="78%" stopColor="#eee9dc" />
            <stop offset="100%" stopColor="#8a6820" />
          </linearGradient>
          <linearGradient id={`${gid}-goldEdge`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8a6820" />
            <stop offset="35%" stopColor="#d4ab3d" />
            <stop offset="55%" stopColor="#f5ebcc" />
            <stop offset="75%" stopColor="#c49a2e" />
            <stop offset="100%" stopColor="#6b5019" />
          </linearGradient>
          <radialGradient id={`${gid}-sheen`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#f5ebcc" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#d4ab3d" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#a87f24" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${gid}-goldDim`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8a6820" />
            <stop offset="50%" stopColor="#c49a2e" />
            <stop offset="100%" stopColor="#6b5019" />
          </linearGradient>
        </defs>

        {/* Outermost ring */}
        <circle cx="200" cy="200" r="195" fill="none" stroke={`url(#${gid}-gold)`} strokeWidth="2" opacity="0.9" />
        <circle cx="200" cy="200" r="188" fill="none" stroke={`url(#${gid}-goldDim)`} strokeWidth="1" opacity="0.55" />

        {/* Celtic knot pattern — 8 symmetrical segments */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 45 * Math.PI) / 180;
          const cx = 200 + Math.cos(angle) * 170;
          const cy = 200 + Math.sin(angle) * 170;
          return (
            <g key={i} transform={`translate(${cx} ${cy}) rotate(${i * 45})`}>
              <path d="M0,-18 L12,0 L0,18 L-12,0 Z" fill={`url(#${gid}-gold)`} stroke={`url(#${gid}-goldEdge)`} strokeWidth="2.4" opacity="0.95" />
              <path d="M0,-10 L6,0 L0,10 L-6,0 Z" fill="#0a0a0b" opacity="0.6" />
              <circle cx="0" cy="-22" r="2.5" fill={`url(#${gid}-gold)`} />
              <circle cx="0" cy="22" r="2.5" fill={`url(#${gid}-gold)`} />
            </g>
          );
        })}

        {/* Interwoven knot arcs between segments */}
        {Array.from({ length: 8 }).map((_, i) => {
          const a1 = (i * 45 - 22.5) * Math.PI / 180;
          const a2 = (i * 45 + 22.5) * Math.PI / 180;
          const r = 170;
          const x1 = 200 + Math.cos(a1) * r;
          const y1 = 200 + Math.sin(a1) * r;
          const x2 = 200 + Math.cos(a2) * r;
          const y2 = 200 + Math.sin(a2) * r;
          return (
            <g key={`arc-${i}`}>
              <path
                d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke={`url(#${gid}-goldEdge)`}
                strokeWidth="3.8"
                opacity="0.9"
              />
              <path
                d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke={`url(#${gid}-gold)`}
                strokeWidth="1.7"
                opacity="0.95"
              />
            </g>
          );
        })}

        {/* Inner ring */}
        <circle cx="200" cy="200" r="155" fill="none" stroke={`url(#${gid}-gold)`} strokeWidth="1" opacity="0.5" />
        <circle cx="200" cy="200" r="148" fill="none" stroke={`url(#${gid}-goldDim)`} strokeWidth="0.5" opacity="0.3" />

        {/* Secondary knot pattern — 4 larger ornamental elements */}
        {Array.from({ length: 4 }).map((_, i) => {
          const angle = (i * 90 * Math.PI) / 180;
          const cx = 200 + Math.cos(angle) * 140;
          const cy = 200 + Math.sin(angle) * 140;
          return (
            <g key={`knot-${i}`} transform={`translate(${cx} ${cy}) rotate(${i * 90})`}>
              <path
                d="M-10,-10 Q0,-20 10,-10 Q20,0 10,10 Q0,20 -10,10 Q-20,0 -10,-10 Z"
                fill="none"
                stroke={`url(#${gid}-goldEdge)`}
                strokeWidth="3"
                opacity="0.85"
              />
              <path
                d="M-10,-10 Q0,-20 10,-10 Q20,0 10,10 Q0,20 -10,10 Q-20,0 -10,-10 Z"
                fill="none"
                stroke={`url(#${gid}-gold)`}
                strokeWidth="1.5"
                opacity="0.95"
              />
              <circle cx="0" cy="0" r="3" fill={`url(#${gid}-gold)`} />
            </g>
          );
        })}

        {/* Decorative tick marks — Norse runic-inspired */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 15 * Math.PI) / 180;
          const x1 = 200 + Math.cos(angle) * 155;
          const y1 = 200 + Math.sin(angle) * 155;
          const x2 = 200 + Math.cos(angle) * 162;
          const y2 = 200 + Math.sin(angle) * 162;
          return (
            <line
              key={`tick-${i}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={`url(#${gid}-gold)`}
              strokeWidth={i % 3 === 0 ? 1.2 : 0.6}
              opacity={i % 3 === 0 ? 0.6 : 0.3}
            />
          );
        })}

        {/* Norse-inspired geometric triangle marks at 4 cardinal points */}
        {Array.from({ length: 4 }).map((_, i) => {
          const angle = (i * 90 * Math.PI) / 180;
          const cx = 200 + Math.cos(angle) * 178;
          const cy = 200 + Math.sin(angle) * 178;
          return (
            <g key={`rune-${i}`} transform={`translate(${cx} ${cy}) rotate(${i * 90})`}>
              <path d="M0,-4 L3,3 L-3,3 Z" fill={`url(#${gid}-gold)`} opacity="0.5" />
            </g>
          );
        })}

        {/* Light sheen overlay */}
        <circle cx="200" cy="200" r="195" fill={`url(#${gid}-sheen)`} />
      </svg>

      {/* Static center with official logo — does NOT rotate */}
      {showD && (
        <div
          className="absolute flex items-center justify-center rounded-full overflow-hidden"
          style={{
            width: size * 0.5,
            height: size * 0.5,
            background: 'radial-gradient(circle at 35% 30%, #141417 0%, #0a0a0b 60%, #050505 100%)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 0 0 1px rgba(196,154,46,0.3)',
            pointerEvents: 'none',
          }}
        >
          <img
            src="/logo.png"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/designly-logo.webp'; }}
            alt="DESIGNLY"
            className="w-full h-full object-contain rounded-full"
            style={{ pointerEvents: 'none' }}
          />
        </div>
      )}
    </div>
  );
}
