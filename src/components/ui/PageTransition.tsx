import { useEffect, useState, type ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  durationMs?: number;
}

export function PageTransition({
  children,
  className = '',
  durationMs = 650,
}: PageTransitionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    setVisible(false);
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [children]);

  return (
    <div
      className={[
        'relative min-h-full will-change-[opacity,transform,filter]',
        visible ? 'page-transition-entered' : 'page-transition-preparing',
        className,
      ].join(' ')}
      style={{ '--page-transition-duration': `${durationMs}ms` } as React.CSSProperties}
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(156,238,229,.07),transparent_34%)]" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default PageTransition;
