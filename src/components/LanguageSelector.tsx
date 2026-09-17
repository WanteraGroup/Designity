import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, languages } = useI18n();
  const [open, setOpen] = useState(false);

  const current = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 rounded-lg text-sm text-cream-300 hover:text-gold-200 hover:bg-gold-600/10 transition-all duration-300 border border-transparent hover:border-gold-600/20 ${
          compact ? 'px-2 py-2' : 'px-3 py-2'
        }`}
        aria-label="Select language"
        aria-expanded={open}
      >
        <span className="font-semibold tracking-widest">{current.code.toUpperCase()}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gold-600/20 bg-ink-850/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
            <div className="max-h-72 overflow-y-auto">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-200 ${
                    l.code === lang
                      ? 'text-gold-200 bg-gold-600/10'
                      : 'text-cream-300 hover:text-gold-200 hover:bg-ink-700/50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xs font-mono tracking-wider text-gold-400 w-6">{l.flag}</span>
                    <span>{l.name}</span>
                  </span>
                  {l.code === lang && <Check className="w-4 h-4 text-gold-400" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
