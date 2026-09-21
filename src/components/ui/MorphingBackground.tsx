import { useEffect, useMemo, useState } from 'react';

const images = [
  '/bg/nordic/mountains.jpg',
  '/bg/nordic/raven-hall.jpg',
  '/bg/nordic/celtic-temple.jpg',
  '/bg/nordic/viking-ship.jpg',
  '/bg/nordic/foggy-forest.jpg',
  '/bg/nordic/obsidian-hall.jpg',
  '/bg/nordic/aurora-night.jpg',
];

interface MorphingBackgroundProps {
  intervalMs?: number;
  transitionMs?: number;
  className?: string;
  global?: boolean;
}

export function MorphingBackground({
  intervalMs = 8000,
  transitionMs = 4000,
  className = '',
  global = false,
}: MorphingBackgroundProps) {
  const [index, setIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const preloaders = images.map((src) => {
      const img = new Image();
      img.src = src;
      img.onerror = () => setFailed((current) => ({ ...current, [src]: true }));
      return img;
    });

    const interval = window.setInterval(() => {
      setIndex((current) => {
        setPreviousIndex(current);
        return (current + 1) % images.length;
      });
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
      preloaders.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [intervalMs]);

  const resolveImage = (src: string) =>
    failed[src] ? '/designly-odin-hall-bg.svg' : src;

  const layers = useMemo(
    () => ({
      current: resolveImage(images[index]),
      previous: resolveImage(images[previousIndex]),
    }),
    [failed, index, previousIndex],
  );

  return (
    <div
      className={`pointer-events-none overflow-hidden bg-[#020505] ${global ? 'fixed inset-0 z-[5]' : 'absolute inset-0 z-0'} ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-100"
        style={{
          backgroundImage: `url("${layers.previous}")`,
          transition: `opacity ${transitionMs}ms ease-in-out`,
        }}
      />

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url("${layers.current}")`,
          opacity: index === previousIndex ? 0 : 1,
          transition: `opacity ${transitionMs}ms ease-in-out`,
        }}
      />

      {!global && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#020505]/30 via-[#020505]/45 to-[#020505]/94" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(156,238,229,.07),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(214,179,106,.05),transparent_42%)]" />
        </>
      )}
      {global && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(156,238,229,.07),transparent_38%)] opacity-60" />
      )}

      <div
        className={`absolute inset-[-6%] animate-[fogMove_18s_linear_infinite] ${global ? 'opacity-[0.08]' : 'opacity-[0.20]'}`}
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 15% 40%, rgba(220,230,226,.16), transparent 28%), radial-gradient(ellipse at 68% 58%, rgba(188,205,198,.12), transparent 30%)',
        }}
      />

      <div
        className={`absolute inset-0 animate-[embersFloat_12s_linear_infinite] ${global ? 'opacity-[0.08]' : 'opacity-[0.18]'}`}
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 82%, rgba(214,179,106,.85) 0 1px, transparent 2px), radial-gradient(circle at 28% 65%, rgba(242,217,154,.72) 0 1px, transparent 2px), radial-gradient(circle at 47% 78%, rgba(214,179,106,.78) 0 1px, transparent 2px), radial-gradient(circle at 71% 54%, rgba(242,217,154,.65) 0 1px, transparent 2px), radial-gradient(circle at 89% 75%, rgba(214,179,106,.82) 0 1px, transparent 2px)',
        }}
      />
    </div>
  );
}

export default MorphingBackground;
