import { useState, type ReactNode } from 'react';
import { Settings2, X } from 'lucide-react';

/**
 * A right-hand drawer for the theme controls. Kept out of the page flow so the
 * preview keeps its full width while the theme is being adjusted.
 */
export function EditorDrawer({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="designly-btn-ghost">
        <Settings2 className="h-4 w-4" /> {title}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="flex-1 bg-ink-950/60 backdrop-blur-sm"
          />

          <aside className="designly-scroll w-full max-w-sm overflow-y-auto border-l border-gold-700/25 bg-ink-900 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-lg text-cream-100">{title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-cream-300/50 transition hover:text-cream-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </aside>
        </div>
      )}
    </>
  );
}
