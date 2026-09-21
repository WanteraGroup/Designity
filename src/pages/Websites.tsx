import { useState } from 'react';
import { Sparkles, Download, Save, Plus, Trash2, Wand2, Eye, RefreshCw, FileText } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { generateSiteWithAI } from '@/lib/designly-site-ai';
import {
  BLOCK_TYPES,
  newSection,
  newPage,
  defaultSite,
  renderSite,
  zipStore,
  type SiteSection,
  type SiteSpec,
} from '@/lib/site-builder';

interface WebsitesProps {
  onNavigate: (page: string) => void;
}

export default function Websites({ onNavigate }: WebsitesProps) {
  const { profile, refreshProfile } = useAuth();

  const [brief, setBrief] = useState('');
  const [projectName, setProjectName] = useState('Uj weboldal');
  const [site, setSite] = useState<SiteSpec>(() => defaultSite('Uj weboldal'));
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const currentPage = site.pages[activePage] || site.pages[0];

  const generate = async () => {
    setError(null);
    setStatus(null);
    setGenerating(true);

    const result = await generateSiteWithAI({
      brief,
      projectName,
      language: 'hu',
      onStatus: setStatus,
    });

    setGenerating(false);

    if (!result.ok || !result.site) {
      setError(result.message || 'Az AI nem tudta felépíteni a weboldalt.');
      return;
    }

    setSite(result.site);
    setProjectName(result.site.name);
    setActivePage(0);
    setStatus('Az oldal elkeszult - nezd at, majd mentsd vagy toltsd le.');
  };

  const updatePage = (index: number, updater: (page: typeof currentPage) => typeof currentPage) => {
    setSite((prev) => ({
      ...prev,
      pages: prev.pages.map((p, i) => (i === index ? updater({ ...p, sections: [...p.sections] }) : p)),
    }));
  };

  const addPage = () => {
    setSite((prev) => ({ ...prev, pages: [...prev.pages, newPage(prev.pages.length + 1)] }));
    setActivePage(site.pages.length);
  };

  const removePage = (index: number) => {
    if (site.pages.length <= 1) return;
    setSite((prev) => ({ ...prev, pages: prev.pages.filter((_, i) => i !== index) }));
    setActivePage(0);
  };

  const addSection = (type: string) => {
    updatePage(activePage, (page) => ({ ...page, sections: [...page.sections, newSection(type)] }));
  };

  const removeSection = (index: number) => {
    updatePage(activePage, (page) => ({ ...page, sections: page.sections.filter((_, i) => i !== index) }));
  };

  const moveSection = (index: number, dir: number) => {
    updatePage(activePage, (page) => {
      const target = index + dir;
      if (target < 0 || target >= page.sections.length) return page;
      const sections = [...page.sections];
      const item = sections.splice(index, 1)[0];
      sections.splice(target, 0, item);
      return { ...page, sections };
    });
  };

  const updateSection = (index: number, patch: Partial<SiteSection>) => {
    updatePage(activePage, (page) => ({
      ...page,
      sections: page.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };

  const saveSite = async () => {
    if (!profile) return;
    setSaving(true);
    const payload = { version: 1, kind: 'website', name: site.name, pages: site.pages, savedAt: new Date().toISOString() };

    if (savedId) {
      await supabase.from('projects').update({
        name: site.name,
        config: { type: 'website', site: payload },
        updated_at: new Date().toISOString(),
      }).eq('id', savedId);
    } else {
      const { data } = await supabase.from('projects').insert({
        user_id: profile.id,
        name: site.name,
        type: 'website',
        status: 'completed',
        brief: brief.slice(0, 500),
        config: { type: 'website', site: payload },
      }).select().single();
      if (data) {
        setSavedId(data.id);
        localStorage.setItem('designly_selected_project', data.id);
      }
    }

    setSaving(false);
    await refreshProfile();
    setStatus('A weboldal elmentve a projektjeid koze.');
  };

  const exportZip = () => {
    const files = renderSite(site);
    const zip = zipStore(files);
    const blob = new Blob([zip as BlobPart], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (site.name || 'designly-site').replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase() + '.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewHtml = renderSite(site)['index.html'] || '';

  return (
    <div className="relative min-h-screen bg-[#020505] text-[#E3FFFB] overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center opacity-[0.20]" style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }} aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020505]/40 to-[#020505]/95" aria-hidden="true" />

      <NordicHeader title="WEBOLDAL GENERALO" />

      <main className="relative z-10 px-6 lg:px-8 pt-10 lg:pt-14 pb-24 space-y-8 max-w-[1700px] mx-auto">
        <section>
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">
            <Wand2 className="w-4 h-4" /> AI WEBSITE FORGE
          </div>
          <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Ird le - az AI megepiti.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
            Adj egy briefet, es az AI osszeallit egy teljes, tobboldalas, premium weboldalt.
            Utana finomhangolhatod, mentheted, es letoltheted mukodo HTML-kent.
          </p>
        </section>

        <ForgedPanel className="max-w-5xl">
          <div className="grid md:grid-cols-[1fr_240px] gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-[.2em] text-[#EEE8DC]/45">Weboldal brief</span>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={5}
                className="input-lux mt-2 resize-none text-sm"
                placeholder="Pl. Premium etterem weboldala: bemutatkozas, etlap, galeria, asztalfoglalas es kapcsolat. Elegans, sotet, arany arnyalatos."
              />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[.2em] text-[#EEE8DC]/45">Weboldal neve</span>
              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="input-lux mt-2 text-sm" />
              <ForgedButton variant="primary" className="w-full mt-4" onClick={() => void generate()} disabled={generating || brief.trim().length < 5}>
                <Sparkles className="w-4 h-4" /> {generating ? 'AZ AI EPIT...' : 'WEBOLDAL GENERALASA'}
              </ForgedButton>
              {status && <div className="mt-3 text-[11px] text-[#9CEEE5]/70">{status}</div>}
              {error && <div className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">{error}</div>}
            </div>
          </div>
        </ForgedPanel>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          <div className="space-y-4">
            <ForgedPanel>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[.2em] text-[#EEE8DC]/45">Oldalak</span>
                <span className="text-[10px] text-[#D6B36A]/70">{site.pages.length}</span>
              </div>
              <div className="space-y-1">
                {site.pages.map((p, i) => (
                  <div key={p.path + i} className="flex items-center gap-1">
                    <button
                      onClick={() => setActivePage(i)}
                      className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${activePage === i ? 'bg-[#D6B36A]/15 text-[#F5DFA3] border border-[#D6B36A]/25' : 'text-[#EEE8DC]/55 hover:bg-white/5'}`}
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{p.title}</span>
                    </button>
                    <button onClick={() => removePage(i)} disabled={site.pages.length <= 1} className="p-1.5 rounded-md border border-red-500/20 text-red-300/60 disabled:opacity-20" aria-label="Oldal torlese">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addPage} className="btn-ghost w-full text-[11px] mt-3">
                <Plus className="w-3.5 h-3.5" /> Oldal hozzaadasa
              </button>
            </ForgedPanel>

            <ForgedPanel>
              <span className="text-[10px] uppercase tracking-[.2em] text-[#EEE8DC]/45">Szekcio hozzaadasa</span>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {BLOCK_TYPES.map((b) => (
                  <button key={b.id} onClick={() => addSection(b.id)} className="flex items-center gap-1.5 px-2 py-2 rounded-md border border-[#263636] text-[10px] text-[#EEE8DC]/60 hover:border-[#D6B36A]/40 hover:text-[#F5DFA3] transition-all">
                    <span className="text-[#D6B36A]/70">{b.icon}</span>
                    <span className="truncate">{b.label}</span>
                  </button>
                ))}
              </div>
            </ForgedPanel>

            <ForgedPanel>
              <span className="text-[10px] uppercase tracking-[.2em] text-[#EEE8DC]/45">Aktualis oldal szekcioi</span>
              <div className="mt-3 space-y-1.5">
                {currentPage.sections.map((s, i) => (
                  <div key={s.id || i} className="flex items-center gap-1">
                    <span className="flex-1 truncate text-[11px] text-[#EEE8DC]/60">{s.title || s.type}</span>
                    <button onClick={() => moveSection(i, -1)} className="p-1 text-[#EEE8DC]/40 hover:text-[#F5DFA3]" aria-label="Fel">&#8593;</button>
                    <button onClick={() => moveSection(i, 1)} className="p-1 text-[#EEE8DC]/40 hover:text-[#F5DFA3]" aria-label="Le">&#8595;</button>
                    <button onClick={() => removeSection(i)} className="p-1 text-red-300/50 hover:text-red-300" aria-label="Torles">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </ForgedPanel>
          </div>

          <div className="space-y-4">
            <ForgedPanel>
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-[10px] uppercase tracking-[.2em] text-[#EEE8DC]/45">Szekcio szerkesztese</span>
                <ForgedButton variant="secondary" onClick={() => void generate()} disabled={generating || brief.trim().length < 5}>
                  <RefreshCw className="w-3.5 h-3.5" /> Ujrageneralas
                </ForgedButton>
              </div>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {currentPage.sections.map((s, i) => (
                  <div key={s.id || i} className="rounded-lg border border-[#263636] p-3 space-y-2">
                    <div className="text-[9px] uppercase tracking-[.18em] text-[#D6B36A]/60">{s.type}</div>
                    <input
                      value={s.title || ''}
                      onChange={(e) => updateSection(i, { title: e.target.value })}
                      className="input-lux text-xs"
                      placeholder="Cim"
                    />
                    <textarea
                      value={s.body || ''}
                      onChange={(e) => updateSection(i, { body: e.target.value })}
                      rows={2}
                      className="input-lux text-xs resize-none"
                      placeholder="Szoveg"
                    />
                    {(s.type === 'hero' || s.type === 'cta') && (
                      <input
                        value={s.cta || ''}
                        onChange={(e) => updateSection(i, { cta: e.target.value })}
                        className="input-lux text-xs"
                        placeholder="Gomb / CTA"
                      />
                    )}
                  </div>
                ))}
              </div>
            </ForgedPanel>

            <ForgedPanel>
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="flex items-center gap-2 text-[10px] uppercase tracking-[.2em] text-[#EEE8DC]/45">
                  <Eye className="w-3.5 h-3.5" /> Elo elonezet
                </span>
                <div className="flex gap-2">
                  <ForgedButton variant="secondary" onClick={() => void saveSite()} disabled={saving || !profile}>
                    <Save className="w-3.5 h-3.5" /> {saving ? 'MENTES...' : 'MENTES'}
                  </ForgedButton>
                  <ForgedButton variant="primary" onClick={exportZip}>
                    <Download className="w-3.5 h-3.5" /> ZIP LETOLTES
                  </ForgedButton>
                </div>
              </div>
              <div className="rounded-xl border border-[#263636] overflow-hidden bg-black">
                <iframe title="site-preview" srcDoc={previewHtml} className="w-full h-[620px]" sandbox="allow-same-origin" />
              </div>
            </ForgedPanel>
          </div>
        </div>
      </main>
    </div>
  );
}
