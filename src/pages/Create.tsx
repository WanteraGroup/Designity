import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, RotateCcw, Pencil, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useCreateFlow } from '@/lib/use-create-flow';
import { parseSiteDocument, applySiteEdits, type SiteDocument } from '@/lib/site-schema';
import { getCreditsForType, DESIGN_STYLES } from '@/lib/constants';
import { SiteRenderer } from '@/components/site/SiteRenderer';

/**
 * The create flow: brief → plan → built page → refine → save.
 * This is the "write what you want and the AI makes it" surface.
 */
export default function Create() {
  const { session, refreshProfile } = useAuth();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const flow = useCreateFlow();

  const [brief, setBrief] = useState('');
  const [instruction, setInstruction] = useState('');
  const [site, setSite] = useState<SiteDocument | null>(null);
  const [refining, setRefining] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const refineRef = useRef<HTMLInputElement>(null);

  const busy = flow.stage === 'plan' || flow.stage === 'building';
  const cost = flow.plan?.project_type ? getCreditsForType(flow.plan.project_type) : 10;

  async function run() {
    if (!brief.trim() || busy) return;
    setSite(null);
    await flow.generate(brief.trim());
    setSite(parseSiteDocument(flow.document));
  }

  async function refine() {
    if (!instruction.trim() || !site || refining) return;
    setRefining(true);
    const before = site;
    await flow.refine(instruction.trim());

    // The edit agent returns a diff against the document it was given, so a
    // partial response is applied here rather than replacing the page wholesale.
    const edits = (flow.document as { edits?: { path: string; value: unknown }[] })?.edits;
    if (Array.isArray(edits)) setSite(applySiteEdits(before, edits));
    else setSite(parseSiteDocument(flow.document) ?? before);

    setInstruction('');
    setRefining(false);
  }

  async function save() {
    if (!site || !session) return;
    setSaving(true);
    setSaveError(null);

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: flow.plan?.title ?? site.site.title,
        type: (flow.plan?.project_type ?? 'website') as string,
        status: 'completed',
        brief,
        config: { site, plan: flow.plan },
      })
      .select('id')
      .single();

    setSaving(false);
    if (error) return setSaveError(error.message);
    await refreshProfile();
    navigate(`/app/projects/${data.id}`);
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-cream-100">What would you like to make?</h1>
        <p className="mt-2 text-sm text-cream-300/60">
          Describe it in a sentence. The AI team handles the structure, the copy and the visuals.
        </p>
      </header>

      {/* Stage 1 — the brief */}
      <section className="rounded-xl border border-gold-700/25 bg-ink-850/60 p-6">
        <label htmlFor="brief" className="mb-2 block text-xs text-cream-300/60">
          Your brief
        </label>
        <textarea
          id="brief"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={4}
          placeholder="Például: Egy sötét, prémium fodrászszalon weboldala árakkal és foglalási lehetőséggel."
          className="designly-input resize-none"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={run} disabled={busy || !brief.trim()} className="designly-btn">
            <Sparkles className="h-4 w-4" />
            {busy ? 'Working…' : 'Generate'}
          </button>
          {busy && (
            <button type="button" onClick={flow.cancel} className="designly-btn-ghost">
              Cancel
            </button>
          )}
          <span className="text-xs text-cream-300/45">{cost} credits</span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {DESIGN_STYLES.slice(0, 10).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setBrief((b) => (b.includes(style) ? b : `${b} ${style}`.trim()))}
              className="rounded-full border border-gold-700/25 px-3 py-1 text-xs text-cream-300/60 transition hover:border-gold-600/50 hover:text-cream-200"
            >
              {style}
            </button>
          ))}
        </div>
      </section>

      {/* Stage 2 — progress */}
      {busy && (
        <section className="mt-6 rounded-xl border border-gold-700/20 bg-ink-900/60 p-6">
          <ol className="space-y-3 text-sm">
            <Step done={flow.stage === 'building'} active={flow.stage === 'plan'}>
              Planning the structure and writing the copy
            </Step>
            <Step done={false} active={flow.stage === 'building'}>
              Building the page
            </Step>
          </ol>
        </section>
      )}

      {flow.error && (
        <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {flow.error}
        </p>
      )}

      {/* Stage 3 — the result */}
      {site && (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl text-cream-100">
              {flow.plan?.title ?? site.site.title}
            </h2>
            <div className="flex gap-3">
              <button type="button" onClick={run} className="designly-btn-ghost">
                <RotateCcw className="h-4 w-4" /> Regenerate
              </button>
              <button type="button" onClick={save} disabled={saving} className="designly-btn">
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save project'}
              </button>
            </div>
          </div>

          {saveError && (
            <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {saveError}
            </p>
          )}

          <SiteRenderer document={site} embedded />

          {/* Refine in plain language */}
          <div className="mt-5 flex gap-3">
            <label className="sr-only" htmlFor="refine">
              Refinement
            </label>
            <input
              id="refine"
              ref={refineRef}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void refine()}
              placeholder="Változtass egy dolgot — pl. „legyen világosabb a színvilág”"
              className="designly-input flex-1"
            />
            <button
              type="button"
              onClick={refine}
              disabled={refining || !instruction.trim()}
              className="designly-btn"
            >
              <Pencil className="h-4 w-4" />
              {refining ? '…' : 'Refine'}
            </button>
          </div>

          {flow.creditsCharged > 0 && (
            <p className="mt-3 text-xs text-cream-300/40">
              {flow.creditsCharged} credits used this session.
            </p>
          )}

          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="mt-6 inline-flex items-center gap-2 text-sm text-gold-300 hover:text-gold-200"
          >
            Continue in the editor <ArrowRight className="h-4 w-4" />
          </a>
          <p className="sr-only">{lang}</p>
        </section>
      )}
    </div>
  );
}

function Step({ done, active, children }: { done: boolean; active: boolean; children: React.ReactNode }) {
  return (
    <li
      className={`flex items-center gap-3 transition ${
        done ? 'text-cream-300/50' : active ? 'text-cream-100' : 'text-cream-300/30'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-cream-400/40' : active ? 'bg-gold-400 animate-pulse' : 'bg-cream-400/20'}`}
      />
      {children}
    </li>
  );
}
