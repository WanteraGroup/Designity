import type { ReactNode } from 'react';

interface CelticGoldFrameProps {
  children?: ReactNode;
  className?: string;
  intensity?: 'soft' | 'strong';
}

/**
 * Reusable premium Celtic gold frame.
 * Uses DESIGNLY's existing official Celtic ring asset as the
 * texture source and keeps the frame pointer-events transparent.
 */
export function CelticGoldFrame({
  children,
  className = '',
  intensity = 'soft',
}: CelticGoldFrameProps) {
  const strong = intensity === 'strong';

  return (
    <div className={`pointer-events-none absolute inset-0 z-20 rounded-[16px] ${className}`}>
      <div
        className={`absolute inset-0 rounded-[16px] border ${strong ? 'border-[#D6B36A]/80 shadow-[0_0_28px_rgba(214,179,106,0.48)]' : 'border-[#D6B36A]/60 shadow-[0_0_18px_rgba(214,179,106,0.35)]'}`}
      />

      <div
        className="absolute inset-[3px] rounded-[13px] border border-[#F2D99A]/15"
        aria-hidden="true"
      />

      <div
        className={`absolute inset-0 rounded-[16px] bg-[url('/kor keret.png')] bg-center bg-cover bg-no-repeat ${strong ? 'opacity-[0.16]' : 'opacity-[0.10]'}`}
        aria-hidden="true"
      />

      <div
        className="absolute inset-[7px] rounded-[12px] bg-[linear-gradient(90deg,rgba(214,179,106,.18),transparent_14%,transparent_86%,rgba(214,179,106,.18)),linear-gradient(0deg,rgba(214,179,106,.12),transparent_14%,transparent_86%,rgba(214,179,106,.12))]"
        aria-hidden="true"
      />

      <Corner className="left-0 top-0" />
      <Corner className="right-0 top-0 rotate-90" />
      <Corner className="bottom-0 left-0 -rotate-90" />
      <Corner className="bottom-0 right-0 rotate-180" />

      {children}
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <div
      className={`absolute h-9 w-9 ${className}`}
      aria-hidden="true"
    >
      <span className="absolute left-0 top-0 h-full w-full rounded-tl-[14px] border-l-2 border-t-2 border-[#D6B36A]/60" />
      <span className="absolute left-[5px] top-[5px] h-5 w-5 rounded-tl-[9px] border-l border-t border-[#F2D99A]/35" />
      <span className="absolute left-[11px] top-[11px] h-2.5 w-2.5 rotate-45 border border-[#D6B36A]/40" />
    </div>
  );
}

export default CelticGoldFrame;
