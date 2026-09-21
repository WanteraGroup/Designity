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

/**
 * Nordic atmosphere layer.
 *
 * The seven /bg/nordic/*.jpg files above are optional: they are large and are
 * not committed to the repo, so on a deployment that lacks them every preload
 * 404s. The failed map records that per image, and anyLoaded gates the
 * photographic layers entirely - if nothing resolved, the layer paints the
 * CSS-drawn /designly-odin-hall-bg.svg instead of two empty divs on a black
 * plate. That keeps the console clean and the atmosphere intact.
 */
export function MorphingBackground({
  intervalMs = 8000,
  transitionMs = 4000,
  className = '',
  global = false,
}: MorphingBackgroundProps) {
  const [index, setIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [anyLoaded, setAnyLoaded] = useState(false);

  useEffect(() => {
    const preloaders = images.map((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => setAnyLoaded(true);
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
      className={`pointer-events-none overflow-hidden bg-[#07070a] ${global ? 'fixed inset-0 z-[5]' : 'absolute inset-0 z-0'} ${className}`}
      aria-hidden="true"
    >
      {anyLoaded && (
        <>
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
        </>
      )}

      {!anyLoaded && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("/designly-odin-hall-bg.svg")' }}
        />
      )}

      {!global && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#07070a]/30 via-[#07070a]/45 to-[#07070a]/94" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(217,180,95,.07),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(217,180,95,.05),transparent_42%)]" />
        </>
      )}
      {global && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(217,180,95,.07),transparent_38%)] opacity-60" />
      )}

      <div
        className={`absolute inset-[-6%] animate-[fogMove_18s_linear_infinite] ${global ? 'opacity-[0.08]' : 'opacity-[0.20]'}`}
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 15% 40%, rgba(217,180,95,.16), transparent 28%), radial-gradient(ellipse at 68% 58%, rgba(217,180,95,.12), transparent 30%)',
        }}
      />

      <div
        className={`absolute inset-0 animate-[embersFloat_12s_linear_infinite] ${global ? 'opacity-[0.08]' : 'opacity-[0.18]'}`}
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 82%, rgba(217,180,95,.85) 0 1px, transparent 2px), radial-gradient(circle at 28% 65%, rgba(246,226,168,.72) 0 1px, transparent 2px), radial-gradient(circle at 47% 78%, rgba(217,180,95,.78) 0 1px, transparent 2px), radial-gradient(circle at 71% 54%, rgba(246,226,168,.65) 0 1px, transparent 2px), radial-gradient(circle at 89% 75%, rgba(217,180,95,.82) 0 1px, transparent 2px)',
        }}
      />
    </div>
  );
}

export default MorphingBackground;
