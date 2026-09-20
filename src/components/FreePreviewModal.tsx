import { Check, CreditCard, Eye, Loader2, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface FreePreviewModalProps {
  open: boolean;
  title: string;
  imageUrl?: string | null;
  previewText?: string | null;
  previewAudioUrl?: string | null;
  loading?: boolean;
  cost: number;
  balance?: number | null;
  onClose: () => void;
  onApprove: () => void;
  onModify: () => void;
  onBuyCredits: () => void;
  approvedLoading?: boolean;
}

export function FreePreviewModal({
  open,
  title,
  imageUrl,
  previewText,
  previewAudioUrl,
  loading = false,
  cost,
  balance,
  onClose,
  onApprove,
  onModify,
  onBuyCredits,
  approvedLoading = false,
}: FreePreviewModalProps) {
  const { isAdmin } = useAuth();
  if (!open) return null;

  const enough = balance == null || balance >= cost;

  return (
    <div className="fixed inset-0 z-[180] bg-black/85 backdrop-blur-lg p-3 sm:p-5 lg:p-8 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center">
        <div className="w-full max-w-6xl rounded-3xl border border-gold-500/30 bg-ink-950 shadow-[0_30px_120px_rgba(0,0,0,.7)] overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gold-600/15 bg-ink-900/90">
            <div>
              <div className="text-[9px] uppercase tracking-[.24em] text-gold-300/70">DESIGNLY · FREE PREVIEW</div>
              <h2 className="mt-1 text-xl sm:text-2xl font-display font-semibold text-cream-50">{title}</h2>
              <div className="mt-1 text-[10px] text-cream-300/40">Az előnézet 0 kredit. Díj csak jóváhagyás után.</div>
            </div>
            <button type="button" onClick={onClose} className="w-10 h-10 rounded-full border border-ink-600/60 bg-black/30 text-cream-300 hover:text-cream-50 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid lg:grid-cols-[1.3fr_.7fr] gap-0">
            <div className="bg-[#f2eee6] min-h-[58vh] flex items-center justify-center p-3 sm:p-6">
              {loading ? (
                <div className="min-h-[52vh] grid place-items-center text-black/50">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin" />
                    <div className="text-sm font-semibold uppercase tracking-[.18em]">AI ELŐNÉZET KÉSZÜL</div>
                    <div className="text-xs mt-2 text-black/40">Ez a lépés ingyenes.</div>
                  </div>
                </div>
              ) : imageUrl ? (
                <div
                  className="relative max-h-[72vh] w-full overflow-hidden"
                  onContextMenu={isAdmin ? undefined : (e) => e.preventDefault()}
                  onDragStart={isAdmin ? undefined : (e) => e.preventDefault()}
                >
                  <img
                    src={imageUrl}
                    alt={title + ' AI preview'}
                    className={`block max-h-[72vh] w-full object-contain select-none ${isAdmin ? 'pointer-events-auto' : 'pointer-events-none'}`}
                    draggable={isAdmin}
                  />
                  <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden">
                    <div className="rotate-[-18deg] whitespace-nowrap text-[clamp(18px,4vw,54px)] font-black tracking-[.35em] text-black/20">
                      DESIGNLY · ELŐNÉZET · NEM LETÖLTHETŐ
                    </div>
                  </div>
                  <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-lg border border-white/15 bg-black/45 px-3 py-2 text-center text-[9px] uppercase tracking-[.18em] text-white/60 backdrop-blur-sm">
                    VÍZJELZETT ELŐNÉZET · LETÖLTÉS A JÓVÁHAGYÁS UTÁN
                  </div>
                </div>
              ) : (
                <div className="min-h-[52vh] grid place-items-center text-center text-black/50 px-8">
                  <div className="max-w-2xl">
                    <Eye className="w-12 h-12 mx-auto mb-4 opacity-35" />
                    <div className="text-sm">AI előnézeti koncepció</div>
                    <div className="mt-2 text-[9px] uppercase tracking-[.18em]">0 KREDIT · PREVIEW</div>
                    {previewAudioUrl && (
                      <div className="mt-5 rounded-2xl border border-black/10 bg-white/70 p-4 text-left">
                        <div className="mb-2 text-[9px] font-bold uppercase tracking-[.18em] text-black/45">INGYENES ZENEI ELŐHALLGATÁS · NINCS KREDIT</div>
                        <audio controls controlsList="nodownload noplaybackrate" className="w-full" src={previewAudioUrl} />
                        <div className="mt-2 text-[9px] text-black/45">Lejátszás engedélyezett. Letöltés csak a véglegesítés és kreditlevonás után.</div>
                      </div>
                    )}
                    {previewText && <div className="mt-5 rounded-2xl border border-black/10 bg-white/60 p-5 text-left text-sm leading-7 text-black/65">{previewText}</div>}
                  </div>
                </div>
              )}
            </div>

            <aside className="p-5 lg:p-7 bg-ink-950">
              <div className="chip w-fit border-gold-500/25 bg-gold-500/10 text-gold-100 text-[9px]">
                <Sparkles className="w-3 h-3" /> ELŐNÉZET · 0 KREDIT
              </div>

              <div className="mt-6">
                <div className="text-[9px] uppercase tracking-[.18em] text-gold-300/65">VÉGLEGES GENERÁLÁS</div>
                <div className="mt-2 text-3xl font-display font-bold gold-text">{cost} kredit</div>
                <div className="mt-1 text-xs text-cream-300/45">
                  Jelenlegi egyenleg: {balance == null ? '—' : balance}
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-gold-600/20 bg-gold-500/5 p-4">
                <div className="text-sm font-semibold text-gold-100">0 KREDIT · ELŐNÉZET</div>
                <div className="mt-1 text-xs text-cream-300/60">
                  A jóváhagyás ingyenes. A(z) {cost} kredit csak akkor kerül levonásra, amikor kéred a végleges változatot.
                </div>
                {!enough && (
                  <button type="button" onClick={onBuyCredits} className="btn-ghost text-xs mt-3 w-full">
                    <CreditCard className="w-4 h-4" /> KREDIT VÁSÁRLÁS
                  </button>
                )}
              </div>

              <div className="mt-6 space-y-2">
                <button type="button" onClick={onApprove} disabled={loading || approvedLoading || (!imageUrl && !previewText && !previewAudioUrl)} className="btn-gold w-full text-sm disabled:opacity-40">
                  {approvedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {approvedLoading ? 'VÉGLEGES GENERÁLÁS…' : `KÉREM · ${cost} KREDIT`}
                </button>
                <button type="button" onClick={onModify} disabled={approvedLoading} className="btn-ghost w-full text-sm disabled:opacity-40">
                  MÓDOSÍTOM / ÚJ ELŐNÉZET
                </button>
              </div>

              <button type="button" onClick={onClose} disabled={approvedLoading} className="mt-5 w-full text-xs text-cream-400/35 hover:text-cream-200">
                Bezárás
              </button>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
