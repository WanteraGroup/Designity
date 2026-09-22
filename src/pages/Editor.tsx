import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { ai } from '@/lib/ai';
import { useAsync } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import {
  parseSiteDocument,
  applySiteEdits,
  type SiteDocument,
  type SiteEdit,
} from '@/lib/site-schema';
import { SiteRenderer } from '@/components/site/SiteRenderer';

/**
 * Opens a saved project and refines it. The document is stored in
 * `projects.config.site`, so the editor needs no separate fetch of its own.
 */
export default function Editor() {
  const { projectId } = useParams<{ projectId: string }>();
  const { session } = useAuth();
  const { lang } = useI18n();

  const [site, setSite] = useState<SiteDocument | null>(null);
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const { loading } = useAsync(async () => {
    const { data, error: e } = await supabase
      .from('projects')
      .select('config')
      .eq('id', projectId!)
      .maybeSingle();

    if (e) throw e;
    const parsed = parseSiteDocument((data?.config as { site?: unknown })?.site);
    setSite(parsed);
    return parsed;
  }, [projectId]);

  async function refine() {
    if (!site || !instruction.trim() || busy) return;
    setBusy(true);
    setError(null);

    try {
      const result = await ai.edit(site, instruction.trim(), lang, session?.access_token);
      const edits = (result.document as { edits?: SiteEdit[] })?.edits;

      // The agent returns a diff against the document it received. Applying it
      // locally keeps the view canonical and means a dropped field in the
      // response cannot blank out a section that was not asked about.
      const next = Array.isArray(edits) ? applySiteEdits(site, edits) : site;
      setSite(next);
      setDirty(true);
      setInstruction('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!site || !projectId) return;
    setBusy(true);
    const { error: e } = await supabase
      .from('projects')
      .update({ config: { site }, updated_at: new Date().toISOString() })
      .eq('id', projectId);
    setBusy(false);
    if (e) return setError(e.message);
    setDirty(false);
  }

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-600/30 border-t-gold-400" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="rounded-xl border border-gold-700/20 bg-ink-850/60 p-8 text-center">
        <p className="text-sm text-cream-300/60">This project has no page document to open.</p>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-cream-100">{site.site.title}</h1>
        {dirty && (
          <button type="button" onClick={save} disabled={busy} className="designly-btn">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        )}
      </header>

      <SiteRenderer document={site} embedded />

      <div className="mt-5 flex gap-3">
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void refine()}
          placeholder="Mit változtassak?"
          className="designly-input flex-1"
        />
        <button
          type="button"
          onClick={refine}
          disabled={busy || !instruction.trim()}
          className="designly-btn"
        >
          <Pencil className="h-4 w-4" />
          {busy ? '…' : 'Apply'}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
