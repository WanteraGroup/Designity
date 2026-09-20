import type { CSSProperties } from 'react';

interface PreviewWatermarkProps {
  label?: string;
  projectName?: string;
  hidden?: boolean;
}

export function PreviewWatermark({ label = 'DESIGNLY · PREVIEW', projectName, hidden = false }: PreviewWatermarkProps) {
  if (hidden) return null;
  const text = projectName ? `${label} · ${projectName}` : label;
  return (
    <div className="designly-preview-watermark" aria-hidden="true">
      {Array.from({ length: 20 }, (_, index) => (
        <span key={index} style={{ '--wm-i': index } as CSSProperties}>{text}</span>
      ))}
    </div>
  );
}