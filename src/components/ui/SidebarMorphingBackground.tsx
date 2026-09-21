import { useEffect, useState } from 'react';

const sidebarImages = [
  '/bg/nordic/mountains.jpg',
  '/bg/nordic/raven-hall.jpg',
  '/bg/nordic/celtic-temple.jpg',
  '/bg/nordic/viking-ship.jpg',
];

interface SidebarMorphingBackgroundProps {
  intervalMs?: number;
  transitionMs?: number;
}

export function SidebarMorphingBackground({
  intervalMs = 9000,
  transitionMs = 4000,
}: SidebarMorphingBackgroundProps) {
  const [index, setIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const preloaders = sidebarImages.map((src) => {
      const image = new Image();
      image.src = src;
      image.onerror = () => setFailed((current) => ({ ...current, [src]: true }));
      return image;
    });

    const interval = window.setInterval(() => {
      setIndex((current) => {
        setPreviousIndex(current);
        return (current + 1) % sidebarImages.length;
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

  const resolve = (src: string) =>
    failed[src] ? '/designly-odin-hall-bg.svg' : src;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url("${resolve(sidebarImages[previousIndex])}")`,
        }}
      />
      <div
        key={index}
        className="absolute inset-0 bg-cover bg-center animate-[sidebarMorphFade_var(--sidebar-morph-duration)_ease-in-out_forwards]"
        style={{
          backgroundImage: `url("${resolve(sidebarImages[index])}")`,
          '--sidebar-morph-duration': `${transitionMs}ms`,
        } as React.CSSProperties}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-[#020505]/72 via-[#020505]/78 to-[#020505]/96" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(156,238,229,.10),transparent_28%),radial-gradient(circle_at_50%_70%,rgba(214,179,106,.06),transparent_32%)]" />

      <div
        className="absolute inset-[-10%] opacity-[0.16] animate-[fogMove_18s_linear_infinite]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 18% 35%, rgba(220,230,226,.14), transparent 25%), radial-gradient(ellipse at 70% 62%, rgba(188,205,198,.10), transparent 30%)',
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.12] animate-[embersFloat_12s_linear_infinite]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 82%, rgba(214,179,106,.85) 0 1px, transparent 2px), radial-gradient(circle at 36% 68%, rgba(242,217,154,.65) 0 1px, transparent 2px), radial-gradient(circle at 67% 54%, rgba(214,179,106,.75) 0 1px, transparent 2px), radial-gradient(circle at 88% 76%, rgba(242,217,154,.65) 0 1px, transparent 2px)',
        }}
      />
    </div>
  );
}

export default SidebarMorphingBackground;
