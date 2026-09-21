import { useEffect, useState } from 'react';

const panelTextures = [
  '/patterns/celtic-knot-gold.png',
  '/patterns/celtic-spiral.png',
  '/patterns/viking-runes.png',
  '/kor keret.png',
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

  const resolveTexture = (src: string) =>
    failed[src] ? '/kor keret.png' : src;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[18px] ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-[0.12]"
        style={{
          backgroundImage: `url("${resolveTexture(panelTextures[previousIndex])}")`,
        }}
      />
      <div
        key={index}
        className="absolute inset-0 bg-center bg-cover bg-no-repeat animate-[panelTextureMorph_var(--panel-morph-duration)_ease-in-out_forwards]"
        style={{
          backgroundImage: `url("${resolveTexture(panelTextures[index])}")`,
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
