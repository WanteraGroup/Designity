import { useEffect, useState } from 'react';

const panelTextures = [
  '/patterns/celtic-knot-gold.png',
  '/patterns/celtic-spiral.png',
  '/patterns/viking-runes.png',
  '/kor keret.png',
];

const fallbackPatterns = [
  'radial-gradient(circle at 18% 22%, rgba(214,179,106,.22) 0 2px, transparent 3px), radial-gradient(circle at 82% 78%, rgba(214,179,106,.18) 0 2px, transparent 3px), repeating-linear-gradient(45deg, transparent 0 12px, rgba(214,179,106,.07) 12px 15px, transparent 15px 27px)',
  'conic-gradient(from 45deg at 30% 50%, transparent 0 15%, rgba(156,238,229,.08) 16% 18%, transparent 19% 33%, rgba(214,179,106,.07) 34% 36%, transparent 37% 100%), repeating-radial-gradient(circle at 70% 35%, transparent 0 10px, rgba(214,179,106,.06) 11px 13px, transparent 14px 23px)',
  'repeating-linear-gradient(90deg, transparent 0 20px, rgba(214,179,106,.06) 20px 22px, transparent 22px 40px), linear-gradient(135deg, transparent 35%, rgba(156,238,229,.07) 36% 38%, transparent 39% 64%, rgba(214,179,106,.06) 65% 67%, transparent 68%)',
];

interface PanelMorphingOverlayProps {
  intervalMs?: number;
  transitionMs?: number;
  className?: string;
}

export function PanelMorphingOverlay({
  intervalMs = 7000,
  transitionMs = 3000,
  className = '',
}: PanelMorphingOverlayProps) {
  const [index, setIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const preloaders = panelTextures.map((src) => {
      const image = new Image();
      image.src = src;
      image.onerror = () => setFailed((current) => ({ ...current, [src]: true }));
      return image;
    });

    const interval = window.setInterval(() => {
      setIndex((current) => {
        setPreviousIndex(current);
        return (current + 1) % panelTextures.length;
      });
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
      preloaders.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [intervalMs]);

  const textureStyle = (textureIndex: number): React.CSSProperties => {
    const src = panelTextures[textureIndex];
    return failed[src]
      ? { backgroundImage: fallbackPatterns[textureIndex % fallbackPatterns.length] }
      : { backgroundImage: `url("${src}")` };
  };

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[18px] ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-[0.12]"
        style={{
          ...textureStyle(previousIndex),
        }}
      />
      <div
        key={index}
        className="absolute inset-0 bg-center bg-cover bg-no-repeat animate-[panelTextureMorph_var(--panel-morph-duration)_ease-in-out_forwards]"
        style={{
          ...textureStyle(index),
          '--panel-morph-duration': `${transitionMs}ms`,
        } as React.CSSProperties}
      />

      {/* Kelta fonat / arany fény */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(214,179,106,.08),transparent_18%,transparent_82%,rgba(214,179,106,.08)),linear-gradient(0deg,rgba(214,179,106,.06),transparent_18%,transparent_82%,rgba(214,179,106,.06))]" />

      {/* Füst + köd */}
      <div
        className="absolute inset-[-8%] animate-[fogMove_20s_linear_infinite] opacity-[0.10]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 18% 35%, rgba(220,230,226,.16), transparent 27%), radial-gradient(ellipse at 74% 58%, rgba(188,205,198,.11), transparent 31%)',
        }}
      />

      {/* Parázs */}
      <div
        className="absolute inset-0 animate-[embersFloat_14s_linear_infinite] opacity-[0.09]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 11% 78%, rgba(214,179,106,.85) 0 1px, transparent 2px), radial-gradient(circle at 34% 62%, rgba(242,217,154,.68) 0 1px, transparent 2px), radial-gradient(circle at 68% 74%, rgba(214,179,106,.75) 0 1px, transparent 2px), radial-gradient(circle at 90% 50%, rgba(242,217,154,.60) 0 1px, transparent 2px)',
        }}
      />
    </div>
  );
}

export default PanelMorphingOverlay;
