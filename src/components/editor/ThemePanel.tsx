import type { SiteTheme } from '@/lib/site-schema';

/**
 * A small theme editor: mode, the palette slots, and the two fonts.
 *
 * It edits the theme object only. Copy changes go through the refine input,
 * because a theme control that can also rewrite text is a second, competing
 * way to change the page and the two fight each other.
 */
export interface ThemePanelProps {
  theme: SiteTheme;
  onChange: (theme: SiteTheme) => void;
}

const FONT_PAIRS: { heading: string; body: string; label: string }[] = [
  { heading: 'Marcellus', body: 'Manrope', label: 'Classic' },
  { heading: 'Cormorant Garamond', body: 'Inter', label: 'Editorial' },
  { heading: 'Inter', body: 'Inter', label: 'Modern' },
  { heading: 'JetBrains Mono', body: 'Manrope', label: 'Technical' },
];

const PRESETS: { label: string; mode: 'dark' | 'light'; palette: string[] }[] = [
  { label: 'Obsidian', mode: 'dark', palette: ['#c49a2e', '#050505', '#f9f5ec'] },
  { label: 'Bone', mode: 'light', palette: ['#a87f24', '#fdfbf7', '#141417'] },
  { label: 'Slate', mode: 'dark', palette: ['#7dd3fc', '#0f172a', '#e2e8f0'] },
  { label: 'Moss', mode: 'dark', palette: ['#4ade80', '#0a0f0a', '#ecfdf5'] },
  { label: 'Ember', mode: 'dark', palette: ['#f97316', '#141414', '#fff7ed'] },
  { label: 'Rose', mode: 'light', palette: ['#be185d', '#fff1f2', '#1f2937'] },
];

export function ThemePanel({ theme, onChange }: ThemePanelProps) {
  function setColor(index: number, value: string) {
    const next = [...theme.palette];
    next[index] = value;
    onChange({ ...theme, palette: next });
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-xs uppercase tracking-wider text-cream-300/50">Presets</h3>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => {
            const active = p.mode === theme.mode && p.palette[0] === theme.palette[0];
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => onChange({ ...theme, mode: p.mode, palette: p.palette })}
                className={`rounded-lg border p-2.5 text-left transition ${
                  active ? 'border-gold-600/60 bg-gold-600/10' : 'border-gold-700/25 hover:border-gold-600/45'
                }`}
              >
                <div className="mb-2 flex gap-1">
                  {p.palette.map((c) => (
                    <span
                      key={c}
                      className="h-3.5 w-3.5 rounded-full border border-white/10"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-cream-200">{p.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs uppercase tracking-wider text-cream-300/50">Mode</h3>
        <div className="flex gap-2">
          {(['dark', 'light'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange({ ...theme, mode: m })}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs capitalize transition ${
                theme.mode === m
                  ? 'border-gold-600/60 bg-gold-600/10 text-gold-200'
                  : 'border-gold-700/25 text-cream-300/60 hover:text-cream-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs uppercase tracking-wider text-cream-300/50">Colours</h3>
        <div className="space-y-2">
          {theme.palette.map((c, i) => (
            <label key={i} className="flex items-center gap-3">
              <input
                type="color"
                value={c}
                onChange={(e) => setColor(i, e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-gold-700/25 bg-transparent"
              />
              <span className="font-mono text-xs text-cream-300/55">{c}</span>
              <span className="ml-auto text-[11px] text-cream-300/35">
                {['Primary', 'Background', 'Text'][i] ?? 'Extra'}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs uppercase tracking-wider text-cream-300/50">Type</h3>
        <div className="grid grid-cols-2 gap-2">
          {FONT_PAIRS.map((f) => {
            const active = theme.heading_font === f.heading && theme.body_font === f.body;
            return (
              <button
                key={f.label}
                type="button"
                onClick={() => onChange({ ...theme, heading_font: f.heading, body_font: f.body })}
                className={`rounded-lg border px-3 py-2 text-left transition ${
                  active ? 'border-gold-600/60 bg-gold-600/10' : 'border-gold-700/25 hover:border-gold-600/45'
                }`}
              >
                <span className="block text-sm text-cream-100" style={{ fontFamily: f.heading }}>
                  {f.label}
                </span>
                <span className="text-[10px] text-cream-300/40">
                  {f.heading} / {f.body}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
