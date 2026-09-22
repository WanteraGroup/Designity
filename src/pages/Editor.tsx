import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileCode, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { ai } from '@/lib/ai';
import { useAsync } from '@/lib/hooks';
import { downloadHtml } from '@/lib/export-site';
import { exportPdf } from '@/lib/export-pdf';
import { parseSiteDocument, applySiteEdits, type SiteDocument, type SiteEdit } from '@/lib/site-schema';
import { SiteRenderer } from '@/components/site/SiteRenderer';
import { ThemePanel } from '@/components/editor/ThemePanel';
import { EditorDrawer } from '@/components/editor/EditorDrawer';

/**
 * Opens a saved project, refines it, retheme it and exports it.
 *
 * Three ways in, and they do not overlap:
 *   - the refine input changes copy (through the editor agent, as a diff)
 *   - the theme drawer changes the theme object only, locally
 *   - export writes a file and does not touch the document
 * Keeping copy and theme separate means the two controls cannot fight.
 */
export default function Editor() {
  const { projectId } = useParams<{ projectId: string }>();
  const { session } = useAuth();
  const { lang } = useI18n();

  const [site, setSite] = useState<SiteDocument | null>(null);
  const [name, setName] = useState('project');
  const [instruction, setInstruction] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const { loading } = useAsync(async () => {
    const { data, error: e } = await supabase
      .from('projects')
      .select('name, config')
      .eq('id', projectId!)
      .maybeSingle();

    if (e) throw e;
    setName(data?.name ?? 'project');
    const parsed = parseSiteDocument((data?.config as { site?: unknown })?.site);
    setSite(parsed);
    return parsed;
  }, [projectId]);

  async function refine() {
    if (!site || !instruction.trim() || busy) return;
    setBusy(true);
    setError(null);
    setReply(null);

    try {
      const result = await ai.edit(site, instruction.trim(), lang, session?.access_token);
      const body = result.document as { reply?: string; edits?: SiteEdit[] };

      // The agent returns a diff against the document it received. Applying it
      // locally keeps the view canonical and means a dropped field in the
      // response cannot blank out a section that was not asked about.
      const next = Array.isArray(body.edits) ? applySiteEdits(site, body.edits) : site;
      setSite(next);
      setReply(body.reply ?? null);
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
    setNotice('Saved.');
  }

  /**
   * Theme edits are local until saved. That is deliberate: a palette change is
   * cheap to make and cheap to undo, and round-tripping every swatch to the
   * database would make the control feel broken on a slow connection.
   */
  function applyTheme(next: SiteDocument['site']['theme']) {
    if (!site) return;
    setSite({ ...site, site: { ...site.site, theme: next } });
    setDirty(true);
  }

  function exportHtml() {
    if (!site) return;
    downloadHtml(site, name);
    setNotice('Downloaded as a standalone HTML file.');
  }

  async function exportAsPdf() {
    if (!site) return;
    setExporting(true);
    setError(null);
    setNotice(null);

    try {
      const { url } = await exportPdf(site, session?.access_token);
      window.open(url, '_blank', 'noreferrer');
      setNotice('PDF ready — opened in a new tab.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
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
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-cream-100">{name}</h1>

        <div className="flex flex-wrap gap-2">
          <EditorDrawer title="Theme">
            <ThemePanel theme={site.site.theme} onChange={applyTheme} />
          </EditorDrawer>
          <button type="button" onClick={exportHtml} className="designly-btn-ghost">
            <FileCode className="h-4 w-4" /> HTML
          </button>
          <button
            type="button"
            onClick={exportAsPdf}
            disabled={exporting}
            className="designly-btn-ghost"
          >
            <FileText className="h-4 w-4" /> {exporting ? 'Rendering…' : 'PDF'}
          </button>
          {dirty && (
            <button type="button" onClick={save} disabled={busy} className="designly-btn">
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          )}
        </div>
      </header>

      {notice && (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-gold-700/25 bg-gold-600/[0.07] px-4 py-3 text-sm text-cream-200">
          <Download className="h-4 w-4 text-gold-300" />
          {notice}
        </p>
      )}

      {reply && (
        <p className="mb-4 rounded-lg border border-gold-700/20 bg-ink-900/60 px-4 py-3 text-sm text-cream-300/70">
          {reply}
        </p>
      )}

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
