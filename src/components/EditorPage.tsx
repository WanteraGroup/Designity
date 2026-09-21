import { ForgedButton, NordicHeader } from '@/components/ui';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Type,
  Palette,
  Layout,
  Download,
  Undo2,
  Redo2,
  Mic,
  Send,
  Check,
  FileText,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import { supabase } from '@/lib/supabase';
import {
  runDesignlyGroqEditor,
  type DesignEditorState,
  type DesignEditorChange,
} from '@/lib/designly-editor-ai';

interface EditorPageProps {
  onNavigate: (page: string) => void;
}

const QUICK_COMMANDS = [
  'Make it more luxurious',
  'Use silver instead of gold',
  'Make the typography stronger',
  'Make the mobile version cleaner',
  'Add a subtle Celtic border',
  'Add a soft mist atmosphere',
  'Align the hero to the left',
  'Use a four-column gallery',
];

function initialDesign(previewTitle: string, previewDescription: string): DesignEditorState {
  return {
    heroTitle: previewTitle || 'DESIGNLY STUDIO',
    heroDescription:
      previewDescription || 'Create premium websites, brands and campaigns with AI.',
    heroButton: 'GET STARTED',
    accent: '#D6AA4A',
    surface: '#111318',
    text: '#F5F0E6',
    heroAlign: 'center',
    galleryColumns: 3,
    celticBorder: false,
    atmosphere: 'glow',
  };
}

function clampHistory<T>(items: T[], limit = 30) {
  return items.length > limit ? items.slice(items.length - limit) : items;
}

export function EditorPage({ onNavigate }: EditorPageProps) {
  const { t } = useI18n();
  const { profile, isUnlimited, isAdmin, refreshProfile } = useAuth();
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedElement, setSelectedElement] = useState<string | null>('hero');
  const [aiCommand, setAiCommand] = useState('');
  const [aiHistory, setAiHistory] = useState<string[]>([]);
  const [aiReply, setAiReply] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [history, setHistory] = useState<DesignEditorState[]>([]);
  const [future, setFuture] = useState<DesignEditorState[]>([]);
  const [projectName, setProjectName] = useState('DESIGNLY STUDIO');
  const [buildSpec, setBuildSpec] = useState<any>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [pendingAiDesign, setPendingAiDesign] = useState<DesignEditorState | null>(null);
  const [pendingAiChanges, setPendingAiChanges] = useState<DesignEditorChange[]>([]);
  const [sitePath, setSitePath] = useState('/');
  const [siteMessage, setSiteMessage] = useState('');
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [siteSaving, setSiteSaving] = useState(false);

  const defaultDesign = useMemo(
    () => initialDesign(t('editor.previewTitle'), t('editor.previewDesc')),
    [t],
  );
  const [design, setDesign] = useState<DesignEditorState>(defaultDesign);

  useEffect(() => {
    let cancelled = false;
    async function loadProject() {
      const projectId = localStorage.getItem('designly_selected_project');
      if (!projectId) { setProjectLoading(false); return; }
      const { data } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();
      if (cancelled) return;
      if (data) {
        setProjectName(data.name || 'DESIGNLY STUDIO');
        const config = (data.config || {}) as Record<string, any>;
        const spec = config.buildSpec || config.orchestration?.buildSpec || null;
        const savedDesign = config.designState as DesignEditorState | undefined;
        setBuildSpec(spec);
        const content = spec?.content || {};
        setDesign((current) => savedDesign || ({ ...current, heroTitle: String(content.heroTitle || content.title || data.name || current.heroTitle), heroDescription: String(content.heroDescription || content.description || data.brief || current.heroDescription), heroButton: String(content.cta || content.heroButton || current.heroButton), celticBorder: true, atmosphere: 'mist' }));
      }
      setProjectLoading(false);
    }
    void loadProject();
    return () => { cancelled = true; };
  }, []);

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  const pushHistory = (current: DesignEditorState) => {
    setHistory((items) => clampHistory([...items, current]));
    setFuture([]);
  };

  const undo = () => {
    setHistory((items) => {
      if (!items.length) return items;
      const previous = items[items.length - 1];
      setFuture((redoItems) => [design, ...redoItems]);
      setDesign(previous);
      return items.slice(0, -1);
    });
    setAiReply('');
  };

  const redo = () => {
    setFuture((items) => {
      if (!items.length) return items;
      const next = items[0];
      setHistory((historyItems) => clampHistory([...historyItems, design]));
      setDesign(next);
      return items.slice(1);
    });
    setAiReply('');
  };

  const applyAiCommand = async (command: string) => {
    const normalized = command.trim();
    if (!normalized || aiLoading) return;

    setAiCommand('');
    setAiError(null);
    setAiReply('');
    setPendingAiDesign(null);
    setPendingAiChanges([]);
    setAiHistory((items) => [normalized, ...items].slice(0, 20));
    setAiLoading(true);

    const result = await runDesignlyGroqEditor({
      command: normalized,
      mode: 'preview',
      selectedElement,
      device,
      design,
    });

    setAiLoading(false);

    if (!result.ok || !result.design) {
      setAiError(result.message || 'Az AI szerkesztesi elonezet nem keszult el.');
      return;
    }

    const changed = JSON.stringify(result.design) !== JSON.stringify(design);
    if (!changed) {
      setAiReply(result.reply || 'Nem volt szukseges modositas.');
      return;
    }

    setPendingAiDesign(result.design);
    setPendingAiChanges(result.changes || []);
    setAiReply(result.reply || 'Az AI elonezete elkeszult. Jovahagyas utan alkalmazzuk.');
  };

  const approveAiCommand = async () => {
    if (!pendingAiDesign || aiLoading) return;

    if ((isAdmin || !isUnlimited) && (profile?.credits ?? 0) < 1) {
      setAiError('Ehhez az AI szerkeszteshez 1 kredit szukseges.');
      setShowCreditModal(true);
      return;
    }

    setAiLoading(true);
    setAiError(null);

    const result = await runDesignlyGroqEditor({
      command: 'Approved AI editor change',
      mode: 'final',
      approvedChanges: pendingAiChanges,
      selectedElement,
      device,
      design,
    });

    setAiLoading(false);

    if (!result.ok || !result.design) {
      setAiError(result.message || 'Az AI modositas veglegesitese nem sikerult.');
      return;
    }

    pushHistory(design);
    setDesign(result.design);
    setPendingAiDesign(null);
    setPendingAiChanges([]);
    setAiReply(result.reply || 'A modositasokat alkalmaztam.');

    const projectId = localStorage.getItem('designly_selected_project');
    if (projectId) {
      const { data: currentProject } = await supabase.from('projects').select('config').eq('id', projectId).maybeSingle();
      const currentConfig = (currentProject?.config || {}) as Record<string, unknown>;
      await supabase.from('projects').update({
        config: {
          ...currentConfig,
          designState: result.design,
          updatedBy: 'DESIGNLY_AI_EDITOR',
          updatedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }).eq('id', projectId);
    }

    await refreshProfile();
  };

  const startVoiceCommand = () => {
    type SpeechRecognitionLike = {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      onstart: (() => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
      onresult: ((event: unknown) => void) | null;
      start: () => void;
    };

    type SpeechRecognitionWindow = {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };

    const speechWindow = window as unknown as SpeechRecognitionWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAiError('A bongeszoben nincs elerheto beszedfelismeres. Ird be a parancsot.');
      return;
    }

    if (listening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'hu-HU';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setAiError('A hangfelismeres nem sikerult. Probald ujra.');
    };
    recognition.onresult = (event) => {
      const resultEvent = event as {
        results?: ArrayLike<ArrayLike<{ transcript?: string }>>;
      };
      const text = resultEvent.results?.[0]?.[0]?.transcript || '';
      setAiCommand(text);
      if (text.trim()) void applyAiCommand(text);
    };

    recognition.start();
  };

  const saveWebsite = async () => {
    const projectId = localStorage.getItem('designly_selected_project');
    if (!projectId) {
      setAiError('Nincs kivalasztott projekt.');
      return;
    }
    setSiteSaving(true);
    const { data: currentProject } = await supabase.from('projects').select('config').eq('id', projectId).maybeSingle();
    const currentConfig = (currentProject?.config || {}) as Record<string, unknown>;
    const site = {
      version: 1,
      name: projectName,
      pages: Array.isArray(buildSpec?.pages) ? buildSpec.pages : [{ path: '/', title: projectName, sections: [] }],
      sections: Array.isArray(buildSpec?.sections) ? buildSpec.sections : [],
      components: Array.isArray(buildSpec?.components) ? buildSpec.components : [],
      content: buildSpec?.content || {},
      interactions: Array.isArray(buildSpec?.interactions) ? buildSpec.interactions : [],
      responsiveRules: Array.isArray(buildSpec?.responsiveRules) ? buildSpec.responsiveRules : [],
      acceptanceCriteria: Array.isArray(buildSpec?.acceptanceCriteria) ? buildSpec.acceptanceCriteria : [],
      designState: design,
      savedAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('projects').update({
      config: { ...currentConfig, site },
      updated_at: new Date().toISOString(),
    }).eq('id', projectId);
    setSiteSaving(false);
    if (error) {
      setAiError(error.message || 'A weboldal mentese nem sikerult.');
      return;
    }
    setSiteMessage('A teljes weboldal konfiguracioja elmentve.');
  };

  const exportWebsite = () => {
    const spec = buildSpec || {
      pages: [{ path: '/', title: projectName, sections: ['Hero', 'Content', 'CTA'] }],
      sections: [],
      content: {},
    };
    const rawPages = Array.isArray(spec.pages) ? spec.pages : [];
    const pages = rawPages.length
      ? rawPages.map((page: any, index: number) => ({
          path: String(page.path || (index === 0 ? '/' : `/page-${index + 1}`)),
          title: String(page.title || page.path || `Oldal ${index + 1}`),
          sections: Array.isArray(page.sections) ? page.sections : [],
        }))
      : [{ path: '/', title: projectName, sections: [] }];

    const normalizedPath = (path: string) => path === '/' ? '/' : `/${path.replace(/^\/+/, '')}`;
    const pageLinks = pages
      .map((page: any) => {
        const path = normalizedPath(page.path);
        return `<a href="#${escapeHtml(path)}" data-page="${escapeHtml(path)}">${escapeHtml(page.title)}</a>`;
      })
      .join('');

    const pageSections = pages
      .map((page: any) => {
        const path = normalizedPath(page.path);
        const sectionNames = page.sections.length
          ? page.sections
          : ['Hero', 'Content', 'CTA'];
        const cards = sectionNames
          .map((section: any, si: number) => {
            const s = typeof section === 'string' ? { title: section } : (section || {});
            const title = String(s.title || s.heading || s.type || 'Szekcio ' + (si + 1));
            const body = String(s.body || s.description || s.text || 'Szerkesztheto tartalom a DESIGNLY build specifikaciobol.');
            const cta = s.cta ? `<button type="button" class="card-cta">${escapeHtml(String(s.cta))}</button>` : '';
            return `<article class="card"><span class="mark">&#10022;</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p>${cta}</article>`;
          })
          .join('');
        return `<div class="page" data-path="${escapeHtml(path)}">
          <section class="hero">
            <div class="eyebrow">DESIGNLY WEBSITE</div>
            <h1>${escapeHtml(page.title)}</h1>
            <p>${escapeHtml(design.heroDescription || String(spec.content?.description || 'Premium AI-generated website experience.'))}</p>
            <button onclick="document.getElementById('contact').scrollIntoView({behavior:'smooth'})">${escapeHtml(design.heroButton || 'KAPCSOLAT')}</button>
          </section>
          <section class="grid">${cards}</section>
        </div>`;
      })
      .join('');

    const html = `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(projectName)}</title>
<style>
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#020505;color:#e3fffb;font-family:Inter,system-ui,sans-serif}
nav{position:sticky;top:0;z-index:10;display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:16px 5%;background:#020505ee;border-bottom:1px solid #d6b36a55;backdrop-filter:blur(16px)}
nav strong{margin-right:auto;color:#f5f0e6}nav a{color:#d9e6e2;text-decoration:none;padding:8px 12px;border:1px solid transparent;border-radius:8px}nav a.active{border-color:#d6b36a88;background:#d6b36a18;color:#f2d99a}
main{max-width:1280px;margin:auto}.page{display:none}.page.active{display:block}
.hero{min-height:68vh;padding:12vh 7%;display:flex;flex-direction:column;justify-content:center;background:radial-gradient(circle at 75% 20%,#d6b36a30,transparent 30%),linear-gradient(135deg,#071311,#020505)}
h1{font-family:Georgia,serif;font-size:clamp(44px,7vw,92px);line-height:.95;max-width:900px;margin:12px 0}h2{font-family:Georgia,serif}p{max-width:720px;line-height:1.8;color:#eee8dca8}
.eyebrow{letter-spacing:.3em;color:#d6b36a;font-size:11px}.hero button,form button{width:max-content;padding:14px 22px;border:1px solid #d6b36a88;border-radius:10px;background:#d6b36a;color:#020505;font-weight:800;cursor:pointer}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;padding:8vh 7%;border-top:1px solid #ffffff12}.card{min-height:150px;padding:22px;border:1px solid #d6b36a33;border-radius:14px;background:#0b1210}.mark{color:#d6b36a;font-size:22px}.card-cta{margin-top:14px;padding:10px 16px;border:1px solid #d6b36a88;border-radius:9px;background:#d6b36a;color:#020505;font-weight:700;font-size:12px;cursor:pointer}
#contact{padding:10vh 7%;min-height:45vh;border-top:1px solid #ffffff12}input,textarea{display:block;padding:14px;margin:12px 0;width:min(560px,100%);border:1px solid #ffffff22;border-radius:10px;background:#07100e;color:#fff}
footer{padding:30px 7%;border-top:1px solid #ffffff12;color:#ffffff55;font-size:12px}
@media(max-width:640px){nav{padding:12px 4%}.hero{padding:10vh 6%;min-height:72vh}.grid{padding:7vh 6%}h1{font-size:48px}}
</style>
</head>
<body>
<nav><strong>${escapeHtml(projectName)}</strong>${pageLinks}</nav>
<main>${pageSections}</main>
<section id="contact">
<div class="eyebrow">CONTACT</div><h2>Kapcsolat</h2>
<form onsubmit="event.preventDefault();document.getElementById('form-status').textContent='Uzenet elkuldve.';">
<input required placeholder="Neved" aria-label="Neved">
<input required type="email" placeholder="Email" aria-label="Email">
<textarea required placeholder="Uzenet" aria-label="Uzenet"></textarea>
<button>UZENET KULDESE</button>
<div id="form-status" style="margin-top:12px;color:#d6b36a"></div>
</form>
</section>
<footer>Built with DESIGNLY - ${escapeHtml(projectName)}</footer>
<script>
(function(){
  var pages=[].slice.call(document.querySelectorAll('.page'));
  var links=[].slice.call(document.querySelectorAll('nav a'));
  function show(path){
    var target=path||'/';
    var found=false;
    pages.forEach(function(p){var active=p.dataset.path===target;p.classList.toggle('active',active);if(active)found=true});
    links.forEach(function(a){a.classList.toggle('active',a.dataset.page===(found?target:'/'))});
    if(!found){pages.forEach(function(p){p.classList.toggle('active',p.dataset.path==='/')});links.forEach(function(a){a.classList.toggle('active',a.dataset.page==='/')})}
  }
  function readHash(){return decodeURIComponent((location.hash||'').replace(/^#/,''))}
  window.addEventListener('hashchange',function(){show(readHash())});
  show(readHash());
})();
</script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = (projectName || 'designly-site').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() + '.html';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportSettings = () => {
    const payload = JSON.stringify(
      {
        product: 'DESIGNLY STUDIO',
        version: 1,
        device,
        design,
      },
      null,
      2,
    );

    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'designly-editor-settings.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const galleryItems = Array.from({ length: design.galleryColumns * 2 }, (_, i) => i + 1);

  const atmosphereClass =
    design.atmosphere === 'mist'
      ? 'bg-[radial-gradient(circle_at_50%_10%,rgba(176,186,194,.18),transparent_35%),linear-gradient(180deg,#171b20,#080a0d)]'
      : design.atmosphere === 'clean'
        ? 'bg-[linear-gradient(180deg,#111318,#080a0d)]'
        : 'bg-[radial-gradient(circle_at_50%_18%,rgba(0,153,255,.12),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(214,170,74,.10),transparent_24%),linear-gradient(180deg,#12151b,#080a0d)]';

  const heroAlignClass =
    design.heroAlign === 'left'
      ? 'text-left items-start'
      : design.heroAlign === 'right'
        ? 'text-right items-end'
        : 'text-center items-center';

  const sitePages: any[] = Array.isArray(buildSpec?.pages) && buildSpec.pages.length
    ? buildSpec.pages
    : [{ path: '/', title: projectName, sections: [] }];
  const currentPage: any = sitePages.find((p: any) => String(p.path || '/') === sitePath) || sitePages[0];
  const currentSections: any[] = Array.isArray(currentPage?.sections) ? currentPage.sections : [];

  const sectionLabel = (section: any, index: number) =>
    typeof section === 'string'
      ? section
      : String(section?.title || section?.heading || section?.type || 'Szekcio ' + (index + 1));

  const commitSpec = (next: any) => setBuildSpec(next);

  const updatePage = (path: string, updater: (page: any) => any) => {
    const nextPages = sitePages.map((p: any) =>
      String(p.path || '/') === path ? updater({ ...p }) : p,
    );
    commitSpec({ ...(buildSpec || {}), pages: nextPages });
  };

  const addPage = () => {
    const n = sitePages.length + 1;
    const nextPages = [
      ...sitePages,
      { path: '/oldal-' + n, title: 'Uj oldal ' + n, sections: [{ type: 'hero', title: 'Uj oldal', body: '' }] },
    ];
    commitSpec({ ...(buildSpec || {}), pages: nextPages });
    setSitePath('/oldal-' + n);
    setSelectedSection(0);
  };

  const removePage = (path: string) => {
    if (sitePages.length <= 1) return;
    const nextPages = sitePages.filter((p: any) => String(p.path || '/') !== path);
    commitSpec({ ...(buildSpec || {}), pages: nextPages });
    setSitePath(String(nextPages[0].path || '/'));
    setSelectedSection(null);
  };

  const addSection = () => {
    const nextSections = [...currentSections, { type: 'section', title: 'Uj szekcio', body: '' }];
    updatePage(sitePath, (page) => ({ ...page, sections: nextSections }));
    setSelectedSection(nextSections.length - 1);
  };

  const removeSection = (index: number) => {
    const nextSections = currentSections.filter((_: any, i: number) => i !== index);
    updatePage(sitePath, (page) => ({ ...page, sections: nextSections }));
    setSelectedSection(null);
  };

  const moveSection = (index: number, dir: number) => {
    const target = index + dir;
    if (target < 0 || target >= currentSections.length) return;
    const nextSections = [...currentSections];
    const item = nextSections.splice(index, 1)[0];
    nextSections.splice(target, 0, item);
    updatePage(sitePath, (page) => ({ ...page, sections: nextSections }));
    setSelectedSection(target);
  };

  const updateSection = (index: number, patch: Record<string, unknown>) => {
    const nextSections = currentSections.map((s: any, i: number) =>
      i === index ? { ...(typeof s === 'object' && s ? s : { title: String(s) }), ...patch } : s,
    );
    updatePage(sitePath, (page) => ({ ...page, sections: nextSections }));
  };

  const renamePage = (path: string, title: string) => {
    updatePage(path, (page) => ({ ...page, title }));
  };

  const businessPreview = buildSpec?.pages?.length || buildSpec?.sections?.length
    ? buildBusinessPreviewSpec(buildSpec, projectName, design)
    : null;

  return (
    <>
    <div className="flex flex-col h-[calc(100vh-0px)] -mt-6 -mx-5 lg:-mx-8 bg-ink-950">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gold-600/10 bg-ink-900/90 backdrop-blur-xl gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => onNavigate('projects')}
            className="text-sm text-cream-300/60 hover:text-gold-200 transition-colors flex items-center gap-1"
          >
            &larr; {t('editor.projects')}
          </button>
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-400/20 bg-emerald-400/5 text-[10px] text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            GROQ AI
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-ink-800/50 border border-ink-600/40">
          {([
            { id: 'desktop', icon: Monitor },
            { id: 'tablet', icon: Tablet },
            { id: 'mobile', icon: Smartphone },
          ] as const).map((d) => (
            <button
              key={d.id}
              onClick={() => setDevice(d.id)}
              className={`p-2 rounded-md transition-all ${device === d.id ? 'bg-gold-600/20 text-gold-200' : 'text-cream-300/40 hover:text-cream-200'}`}
              aria-label={d.id}
            >
              <d.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!history.length}
            className="p-2 text-cream-300/60 hover:text-gold-200 disabled:opacity-20 transition-colors"
            aria-label="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!future.length}
            className="p-2 text-cream-300/60 hover:text-gold-200 disabled:opacity-20 transition-colors"
            aria-label="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          {buildSpec?.pages?.length ? (
            <button
              onClick={() => void saveWebsite()}
              disabled={siteSaving}
              className="btn-ghost text-xs px-4 py-2"
            >
              {siteSaving ? 'MENTES...' : 'MENTES'}
            </button>
          ) : null}
          <button
            onClick={buildSpec?.pages?.length ? exportWebsite : exportSettings}
            className="btn-gold text-xs px-4 py-2"
          >
            <Download className="w-3.5 h-3.5" />
            {buildSpec?.pages?.length ? 'WEBOLDAL EXPORT' : t('editor.export')}
          </button>
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-3 z-10 hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-full border border-gold-600/20 bg-ink-950/90 backdrop-blur-xl shadow-xl">
  <span className="text-[10px] uppercase tracking-[.18em] text-gold-300">{projectLoading ? 'BETOLTES...' : projectName}</span>
  {buildSpec?.pages?.length ? <span className="text-[9px] text-cream-300/45">{buildSpec.pages.length} oldal &middot; {buildSpec.sections?.length || 0} szekcio &middot; {buildSpec.components?.length || 0} komponens</span> : null}
</div>

<div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex w-56 flex-col border-r border-gold-600/10 bg-ink-900/50 overflow-y-auto">
          <div className="p-3">
            <div className="text-xs text-cream-300/40 uppercase tracking-wider mb-3 px-2">
              {t('editor.sections')}
            </div>
            {sitePages.map((p: any) => {
              const path = String(p.path || '/');
              const active = path === String(sitePath || '/');
              const pageSections = Array.isArray(p.sections) ? p.sections : [];
              return (
                <div key={path} className="mb-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSitePath(path); setSelectedSection(null); setSiteMessage(''); }}
                      className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${active ? 'bg-gold-600/15 text-gold-200 border border-gold-600/20' : 'text-cream-300/60 hover:bg-ink-700/40'}`}
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{String(p.title || path)}</span>
                    </button>
                  </div>
                  {active && (
                    <div className="mt-1 ml-3 space-y-1 border-l border-gold-600/15 pl-2">
                      {pageSections.map((s: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setSelectedSection(i)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all ${selectedSection === i ? 'bg-gold-600/10 text-gold-200' : 'text-cream-300/50 hover:text-gold-200'}`}
                        >
                          <Layout className="w-3 h-3 shrink-0" />
                          <span className="truncate">{sectionLabel(s, i)}</span>
                        </button>
                      ))}
                      <button
                        onClick={addSection}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] text-gold-300/70 hover:text-gold-200 hover:bg-gold-600/10"
                      >
                        <Plus className="w-3 h-3" /> Szekcio hozzaadasa
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2 px-3">
            <button onClick={addPage} className="btn-ghost flex-1 text-[10px] px-2 py-2">
              <Plus className="w-3 h-3" /> Oldal
            </button>
            <button
              onClick={() => removePage(sitePath)}
              disabled={sitePages.length <= 1}
              className="btn-ghost flex-1 text-[10px] px-2 py-2 disabled:opacity-30"
            >
              <Trash2 className="w-3 h-3" /> Torles
            </button>
          </div>

          <div className="p-3 border-t border-gold-600/10">
            <div className="text-xs text-cream-300/40 uppercase tracking-wider mb-3 px-2">
              {t('editor.tools')}
            </div>
            <div className="space-y-1">
              <ToolButton icon={Type} label={t('editor.editText')} command="Make the typography and text hierarchy stronger" onRun={applyAiCommand} />
              <ToolButton icon={Palette} label={t('editor.changeColors')} command="Refine the color palette while preserving the premium DESIGNLY identity" onRun={applyAiCommand} />
              <ToolButton icon={Layout} label={t('editor.changeLayout')} command="Improve the selected section layout and spacing for a polished responsive composition" onRun={applyAiCommand} />
            </div>
          </div>

          <div className="mt-auto p-3 border-t border-gold-600/10">
            <div className="text-[10px] text-cream-300/40">AI ENGINE</div>
            <div className="text-xs text-gold-200 mt-1">Groq &middot; GPT-OSS 120B</div>
            <div className="text-[10px] text-cream-300/30 mt-1">Structured safe edits</div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-ink-950 flex justify-center p-4 lg:p-8">
          <div className="rounded-xl border border-ink-600/40 shadow-2xl overflow-hidden bg-black" style={{ width: deviceWidths[device], maxWidth: '100%' }}>
            {businessPreview ? (
              <WebsiteBuilderPreview
                spec={buildSpec}
                projectName={projectName}
                design={design}
                sitePath={sitePath}
                onPathChange={setSitePath}
                onMessage={setSiteMessage}
              />
            ) : (
              <div className={`min-h-[800px] p-8 ${atmosphereClass}`}>
                <section className={`py-16 min-h-[420px] flex flex-col justify-center ${heroAlignClass} px-4`}>
                  <div className="w-16 h-16 rounded-full mb-6 flex items-center justify-center" style={{ background: `linear-gradient(135deg,${design.accent},#fff1b8,${design.accent})` }}><span className="font-display font-bold text-ink-950 text-2xl">D</span></div>
                  <h2 className="text-3xl lg:text-5xl font-display font-bold mb-4">{design.heroTitle}</h2>
                  <p className="text-sm max-w-2xl mb-7 opacity-70">{design.heroDescription}</p>
                  <button className="px-5 py-3 rounded-xl font-semibold text-sm" style={{ background: design.accent, color: '#08090b' }}>{design.heroButton}</button>
                </section>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex w-80 flex-col border-l border-gold-600/10 bg-ink-900/60">
          <div className="p-4 border-b border-gold-600/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-gold-400" />
                <span className="text-sm font-medium text-cream-100">Oldal es szekciok</span>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full border border-gold-600/20 bg-gold-600/5 text-gold-300">
                {currentSections.length} szekcio
              </span>
            </div>

            <label className="block mb-3">
              <span className="text-[10px] uppercase tracking-[.18em] text-cream-300/45">Oldal cime</span>
              <input
                value={String(currentPage?.title || '')}
                onChange={(e) => renamePage(sitePath, e.target.value)}
                className="input-lux text-sm mt-1"
              />
            </label>

            {selectedSection === null || !currentSections[selectedSection] ? (
              <div className="rounded-lg border border-ink-600/40 bg-ink-800/40 px-3 py-4 text-xs text-cream-300/45">
                Valassz egy szekciot a bal oldali listabol a tartalom szerkesztesehez.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[.18em] text-cream-300/45">
                    {selectedSection + 1}. szekcio
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveSection(selectedSection, -1)}
                      disabled={selectedSection === 0}
                      className="p-1.5 rounded-md border border-ink-600/40 text-cream-300/60 hover:text-gold-200 disabled:opacity-20"
                      aria-label="Fel"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveSection(selectedSection, 1)}
                      disabled={selectedSection >= currentSections.length - 1}
                      className="p-1.5 rounded-md border border-ink-600/40 text-cream-300/60 hover:text-gold-200 disabled:opacity-20"
                      aria-label="Le"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeSection(selectedSection)}
                      className="p-1.5 rounded-md border border-red-500/20 text-red-300/70 hover:text-red-200"
                      aria-label="Torles"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <label className="block">
                  <span className="text-[10px] uppercase tracking-[.18em] text-cream-300/45">Szekcio cime</span>
                  <input
                    value={String((currentSections[selectedSection] as any)?.title || (typeof currentSections[selectedSection] === 'string' ? currentSections[selectedSection] : ''))}
                    onChange={(e) => updateSection(selectedSection, { title: e.target.value })}
                    className="input-lux text-sm mt-1"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] uppercase tracking-[.18em] text-cream-300/45">Szoveg</span>
                  <textarea
                    value={String((currentSections[selectedSection] as any)?.body || (currentSections[selectedSection] as any)?.description || '')}
                    onChange={(e) => updateSection(selectedSection, { body: e.target.value })}
                    rows={3}
                    className="input-lux text-sm mt-1 resize-none"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] uppercase tracking-[.18em] text-cream-300/45">Gomb / CTA</span>
                  <input
                    value={String((currentSections[selectedSection] as any)?.cta || '')}
                    onChange={(e) => updateSection(selectedSection, { cta: e.target.value })}
                    className="input-lux text-sm mt-1"
                    placeholder="Pl. Kapcsolatfelvetel"
                  />
                </label>
              </div>
            )}

            <button onClick={() => void saveWebsite()} disabled={siteSaving} className="btn-gold w-full text-xs mt-3 disabled:opacity-40">
              <Save className="w-3.5 h-3.5" />
              {siteSaving ? 'Mentes...' : 'Weboldal mentese'}
            </button>
            {siteMessage && (
              <div className="mt-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-[11px] text-emerald-200">
                {siteMessage}
              </div>
            )}
          </div>

          <div className="p-4 border-b border-gold-600/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-400" />
                <span className="text-sm font-medium text-cream-100">{t('editor.aiEditor')}</span>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full border border-emerald-400/20 bg-emerald-400/5 text-emerald-300">
                {aiLoading ? 'THINKING...' : 'ONLINE'}
              </span>
            </div>

            <textarea
              value={aiCommand}
              onChange={(e) => setAiCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void applyAiCommand(aiCommand);
                }
              }}
              rows={4}
              className="input-lux text-sm resize-none"
              placeholder={t('editor.aiPlaceholder')}
              disabled={aiLoading}
            />

            <div className="flex gap-2 mt-2">
              <button
                onClick={startVoiceCommand}
                disabled={aiLoading}
                className={`flex-1 px-3 py-2 rounded-lg border text-xs transition-all ${listening ? 'border-red-400/40 bg-red-400/10 text-red-200' : 'border-ink-600/50 text-cream-300/60 hover:text-gold-200 hover:border-gold-600/30'}`}
              >
                <Mic className="w-3.5 h-3.5" />
                {listening ? 'HALLGATLAK...' : 'HANG'}
              </button>
              <button
                onClick={() => void applyAiCommand(aiCommand)}
                disabled={!aiCommand.trim() || aiLoading}
                className="btn-gold flex-1 text-sm disabled:opacity-40"
              >
                {aiLoading ? <Sparkles className="w-3.5 h-3.5 animate-pulse" /> : <Send className="w-3.5 h-3.5" />}
                {aiLoading ? 'AI...' : t('editor.applyEdit')}
              </button>
            </div>

            <div className="text-[10px] text-cream-300/30 mt-2">
              Ctrl/Cmd + Enter = alkalmazas
            </div>

            {aiError && (
              <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-200">
                {aiError}
              </div>
            )}

            {aiReply && (
              <div className="mt-3 rounded-lg border border-gold-600/15 bg-gold-600/5 px-3 py-2 text-xs text-cream-200">
                <div className="flex items-center gap-1.5 text-gold-300 mb-1">
                  <Check className="w-3 h-3" />
                  AI elonezet
                </div>
                {aiReply}
                {pendingAiDesign && (
                  <div className="mt-3 rounded-lg border border-gold-500/20 bg-black/25 overflow-hidden">
                    <div className="px-3 py-2 border-b border-gold-500/15 text-[10px] uppercase tracking-[.17em] text-gold-300/65">AI VIZUALIS ELONEZET &middot; 0 KREDIT</div>
                    <div className="p-3">
                      <div className="rounded-lg p-4 min-h-32 flex flex-col justify-center" style={{ background: pendingAiDesign.surface, color: pendingAiDesign.text }}>
                        <div className="w-10 h-10 rounded-full grid place-items-center font-bold mb-3" style={{ background: pendingAiDesign.accent, color: '#08090b' }}>D</div>
                        <div className="font-display text-base font-semibold">{pendingAiDesign.heroTitle}</div>
                        <div className="mt-1 text-[10px] opacity-70 line-clamp-2">{pendingAiDesign.heroDescription}</div>
                        <div className="mt-3 inline-flex w-fit rounded-md px-3 py-1.5 text-[9px] font-semibold" style={{ background: pendingAiDesign.accent, color: '#08090b' }}>{pendingAiDesign.heroButton}</div>
                      </div>
                      <div className="mt-2 text-[10px] text-cream-300/50">A vizualis modositast csak jovahagyas utan alkalmazzuk, es csak akkor vonunk le 1 kreditet.</div>
                      <div className="mt-3 flex gap-2 flex-wrap">
                        <button type="button" onClick={approveAiCommand} disabled={aiLoading} className="btn-gold text-xs">
                          {aiLoading ? <Sparkles className="w-3.5 h-3.5 animate-pulse" /> : <Check className="w-3.5 h-3.5" />}
                          TETSZIK &middot; ALKALMAZAS &middot; 1 KREDIT
                        </button>
                        <button type="button" onClick={() => { setPendingAiDesign(null); setPendingAiChanges([]); }} disabled={aiLoading} className="btn-ghost text-xs">MODOSITOM</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-b border-gold-600/10">
            <div className="text-xs text-cream-300/40 uppercase tracking-wider mb-3">
              {t('editor.quickCommands')}
            </div>
            <div className="space-y-1.5">
              {QUICK_COMMANDS.map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => void applyAiCommand(cmd)}
                  disabled={aiLoading}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-cream-300/60 hover:text-gold-200 hover:bg-gold-600/10 transition-all border border-transparent hover:border-gold-600/20 disabled:opacity-30"
                >
                  &quot;{cmd}&quot;
                </button>
              ))}
            </div>
          </div>

          {aiHistory.length > 0 && (
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="text-xs text-cream-300/40 uppercase tracking-wider mb-3">
                {t('editor.recentEdits')}
              </div>
              <div className="space-y-1.5">
                {aiHistory.slice(0, 12).map((cmd, i) => (
                  <div
                    key={`${cmd}-${i}`}
                    className="text-xs text-cream-300/40 px-3 py-2 rounded-lg bg-ink-800/50 border border-ink-700/20"
                  >
                    {cmd}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-gold-600/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-cream-300/40 mb-2">{t('editor.costPerEdit')}</div>
                <div className="text-sm font-medium text-gold-200">
                  {isUnlimited ? '&infin;' : `1 ${t('misc.creditsShort')}`}
                </div>
              </div>
              {!isUnlimited && (
                <button type="button" onClick={() => setShowCreditModal(true)} className="btn-ghost text-[10px] px-3 py-2">
                  KREDIT VASARLAS
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    <CreditPurchaseModal open={showCreditModal} onCreditsUpdated={refreshProfile} onClose={() => setShowCreditModal(false)} onNavigate={onNavigate} currentCredits={profile?.credits} reason="Vasarolj kreditet kozvetlenul az AI Editorbol, visszalepes nelkul." />
    </>
  );
}

function buildBusinessPreviewSpec(spec: any, projectName: string, design: DesignEditorState) {
  const sections = Array.isArray(spec?.sections) ? spec.sections : [];
  const content = Array.isArray(spec?.content) ? spec.content : [];
  const text = [...sections, ...content].filter((v) => typeof v === 'string') as string[];
  const joined = text.join(' - ');
  const pick = (pattern: RegExp, fallback: string) => text.find((v) => pattern.test(v)) || fallback;
  const cards = [
    pick(/service|szolgalt|solution|megold/i, 'Business Foundation'),
    pick(/lead|marketing|sales|ertekes/i, 'Lead Generation Systems'),
    pick(/crm|automat|automation/i, 'Sales & CRM Automation'),
    pick(/scale|novek|growth/i, 'Scale & Optimize'),
  ];
  return (
    <div className="min-h-[1100px] bg-transparent text-[#f5f0e6]">
      <NordicHeader title={projectName.toUpperCase()} userLabel="EDITOR" />
      <section className="relative px-8 py-20 min-h-[430px] flex items-center overflow-hidden" style={{ background:'radial-gradient(circle at 72% 35%,rgba(214,170,74,.25),transparent 28%),linear-gradient(120deg,#050505,#17130b,#050505)' }}>
        <div className="absolute right-[8%] top-10 w-64 h-64 rounded-full border-[18px] border-[#d6aa4a55] flex items-center justify-center"><div className="w-40 h-40 rounded-full border border-[#d6aa4a99] flex items-center justify-center text-7xl text-[#d6aa4a]">&#5791;</div></div>
        <div className="relative z-[1] max-w-xl"><div className="text-[10px] uppercase tracking-[.3em] text-[#d6aa4a] mb-4">AUTOMATE. BUILD. SCALE.</div><h1 className="text-4xl lg:text-6xl font-display font-bold leading-[.95] mb-5">{design.heroTitle || projectName}</h1><p className="text-sm leading-6 text-[#f5f0e699] max-w-lg mb-7">{design.heroDescription || 'Premium, AI-alapu uzleti rendszer automatikus felépítéssel.'}</p><button className="px-6 py-3 rounded-md font-semibold text-xs bg-[#d6aa4a] text-black">{design.heroButton || 'EXPLORE SOLUTIONS'}</button></div>
      </section>
      <section className="grid grid-cols-4 border-y border-[#d6aa4a33] bg-[#0b0b0b]">{['500+','98%','24/7','AI'].map((s)=><div key={s} className="py-5 text-center border-r border-[#d6aa4a22]"><div className="text-xl font-display text-[#d6aa4a]">{s}</div><div className="text-[9px] text-[#aaa38f88] mt-1">BUSINESS METRIC</div></div>)}</section>
      <section className="px-7 py-12 border-b border-[#d6aa4a22]"><div className="text-center mb-7"><div className="text-[9px] uppercase tracking-[.25em] text-[#d6aa4a]">OUR SOLUTIONS</div><h2 className="text-2xl font-display font-bold mt-2">Everything You Need to Build, Automate &amp; Scale</h2></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{cards.map((card,i)=><div key={i} className="rounded-xl border border-[#d6aa4a33] bg-[#0d0d0d] p-4 min-h-[135px]"><div className="text-[#d6aa4a] text-xl mb-3">&#10022;</div><div className="text-sm font-semibold mb-2">{card}</div><div className="text-[10px] leading-4 text-[#aaa38f88]">AI-powered business system with editable content.</div></div>)}</div></section>
      <section className="grid lg:grid-cols-2 border-b border-[#d6aa4a22]"><div className="p-7"><div className="text-[9px] text-[#d6aa4a]">DASHBOARD</div><h2 className="text-2xl font-display font-bold mt-2 mb-5">Business Growth Overview</h2><div className="grid grid-cols-2 gap-3">{['Revenue','Active Leads','Deals Closed','Conversion'].map((x,i)=><div key={x} className="rounded-lg border border-white/10 bg-[#0d0d0d] p-4"><div className="text-[9px] text-[#aaa38f88]">{x}</div><div className="text-lg text-[#d6aa4a] mt-2">{['$245,750','1,250','320','25.6%'][i]}</div></div>)}</div><div className="mt-3 h-32 rounded-lg border border-white/10 bg-[#0d0d0d] p-4"><div className="text-[9px] text-[#aaa38f88]">REVENUE GROWTH</div><div className="mt-5 h-px bg-[#d6aa4a] rotate-[-4deg]" /></div></div><div className="p-7 bg-[#0a0a0a]"><div className="text-[9px] text-[#d6aa4a]">AI ASSISTANT</div><h2 className="text-2xl font-display font-bold mt-2 mb-4">Your 24/7 Growth Partner</h2><div className="rounded-xl border border-[#d6aa4a33] p-5 bg-black/40"><div className="text-xs text-[#d6aa4a] mb-3">DESIGNLY AI</div><p className="text-xs text-[#f5f0e688] leading-5">AI asszisztens a latogatok es az uzlet tamogatasara.</p><div className="mt-4 space-y-2"><div className="rounded-md border border-white/10 px-3 py-2 text-[10px]">Hogyan szerezhetek tobb ugyfelet?</div><div className="rounded-md border border-white/10 px-3 py-2 text-[10px]">Mutasd az uzleti teljesitmenyt</div></div></div></div></section>
      <section className="px-7 py-12"><div className="text-[9px] text-[#d6aa4a]">PRICING PLANS</div><h2 className="text-2xl font-display font-bold mt-2 mb-6">Simple, Transparent Pricing</h2><div className="grid md:grid-cols-3 gap-3">{['Starter','Professional','Enterprise'].map((p,i)=><div key={p} className={`rounded-xl border ${i===1?'border-[#d6aa4a]':'border-[#d6aa4a33]'} bg-[#0d0d0d] p-5`}><div className="text-xs text-[#aaa38f99]">{p}</div><div className="text-2xl text-[#d6aa4a] font-display mt-2">{['$497','$997','$2,497'][i]}</div><div className="text-[10px] text-[#aaa38f88] mt-3">Szerkesztheto arhelyorzok</div><button className="mt-5 w-full py-2 rounded-md text-[10px] bg-[#d6aa4a] text-black">GET STARTED</button></div>)}</div></section>
      <section className="px-7 py-10 border-t border-[#d6aa4a22] flex items-center justify-between gap-5"><div><div className="text-xl font-display font-bold">Ready to Build Your Automatic Business?</div><div className="text-[10px] text-[#aaa38f88] mt-1">{joined.slice(0,160)}</div></div><button className="px-5 py-3 rounded-md text-xs font-semibold bg-[#d6aa4a] text-black">START BUILDING</button></section>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  command,
  onRun,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  command: string;
  onRun: (command: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onRun(command)}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-cream-300/60 hover:text-gold-200 hover:bg-ink-700/40 transition-all border border-transparent hover:border-gold-600/15"
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
}

function WebsiteBuilderPreview({
  spec,
  projectName,
  design,
  sitePath,
  onPathChange,
  onMessage,
}: {
  spec: any;
  projectName: string;
  design: DesignEditorState;
  sitePath: string;
  onPathChange: (path: string) => void;
  onMessage: (message: string) => void;
}) {
  const pages = Array.isArray(spec?.pages) && spec.pages.length
    ? spec.pages
    : [{ path: '/', title: projectName, sections: [] }];
  const page = pages.find((item: any) => String(item.path || '/') === sitePath) || pages[0];
  const sections = Array.isArray(page.sections) ? page.sections : [];
  const content = spec?.content && typeof spec.content === 'object' && !Array.isArray(spec.content) ? spec.content : {};
  const heroTitle = String(content.heroTitle || content.title || page.title || design.heroTitle || projectName);
  const heroDescription = String(content.heroDescription || content.description || design.heroDescription || '');
  const cta = String(content.cta || design.heroButton || 'KAPCSOLAT');
  const color = design.accent || '#D6B36A';

  return (
    <div className="min-h-[1100px] bg-[#020505] text-[#E3FFFB]">
      <nav className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-[#D6B36A]/20 bg-[#020505]/90 px-5 py-3 backdrop-blur-xl">
        <div className="mr-auto font-serif text-sm">{projectName}</div>
        {pages.map((item: any) => {
          const path = String(item.path || '/');
          return (
            <button
              key={path}
              type="button"
              onClick={() => { onPathChange(path); onMessage(''); }}
              className={`rounded-lg border px-3 py-1.5 text-[10px] uppercase tracking-wider ${path === String(page.path || '/') ? 'border-[#D6B36A]/60 bg-[#D6B36A]/15 text-[#F2D99A]' : 'border-white/10 text-white/55'}`}
            >
              {String(item.title || path)}
            </button>
          );
        })}
      </nav>

      <section className="relative min-h-[520px] overflow-hidden px-8 py-20 lg:px-14" style={{ background: 'radial-gradient(circle at 75% 20%, rgba(214,179,106,.24), transparent 28%), linear-gradient(135deg,#071311,#020505)' }}>
        <div className="absolute right-[8%] top-16 hidden h-64 w-64 rounded-full border-[18px] border-[#D6B36A]/20 lg:block">
          <div className="m-7 flex h-44 w-44 items-center justify-center rounded-full border border-[#D6B36A]/45 text-7xl text-[#D6B36A]">&#5791;</div>
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="text-[9px] uppercase tracking-[.3em] text-[#D6B36A]">LIVE WEBSITE PREVIEW</div>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-[.95] lg:text-7xl">{heroTitle}</h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#EEE8DC]/65">{heroDescription}</p>
          <button type="button" onClick={() => document.getElementById('site-contact')?.scrollIntoView({ behavior: 'smooth' })} className="mt-8 rounded-xl px-6 py-3 text-sm font-semibold" style={{ background: color, color: '#020505' }}>
            {cta}
          </button>
        </div>
      </section>

      <section className="grid gap-3 border-y border-white/10 bg-black/25 p-6 md:grid-cols-2 lg:grid-cols-3">
        {(sections.length ? sections : [{ title: 'Szolgaltatasok' }, { title: 'Elonyok' }, { title: 'Kapcsolat' }]).map((section: any, index: number) => {
          const s = typeof section === 'string' ? { title: section } : (section || {});
          const heading = String(s.title || s.heading || s.type || 'Szekcio ' + (index + 1));
          const body = String(s.body || s.description || s.text || 'Szerkesztheto weboldal-szekcio a DESIGNLY build specifikaciobol.');
          return (
            <article key={index} className="min-h-36 rounded-xl border border-[#D6B36A]/20 bg-[#071311]/75 p-5">
              <div className="text-lg text-[#D6B36A]">&#10022;</div>
              <h2 className="mt-2 font-serif text-lg">{heading}</h2>
              <p className="mt-2 text-xs leading-5 text-[#EEE8DC]/50">{body}</p>
              {s.cta ? (
                <button type="button" className="mt-3 rounded-lg px-3 py-1.5 text-[10px] font-semibold" style={{ background: color, color: '#020505' }}>
                  {String(s.cta)}
                </button>
              ) : null}
            </article>
          );
        })}
      </section>

      <section id="site-contact" className="border-t border-white/10 px-8 py-16 lg:px-14">
        <div className="max-w-xl">
          <div className="text-[9px] uppercase tracking-[.3em] text-[#D6B36A]">CONTACT</div>
          <h2 className="mt-3 font-serif text-3xl">Kapcsolatfelvetel</h2>
          <form className="mt-6 space-y-3" onSubmit={(event) => { event.preventDefault(); onMessage('Uzenet elkuldve - demo workflow.'); }}>
            <input required className="input-lux" placeholder="Nev" />
            <input required type="email" className="input-lux" placeholder="Email" />
            <textarea required className="input-lux min-h-28" placeholder="Uzenet" />
            <button type="submit" className="btn-gold text-xs">UZENET KULDESE</button>
          </form>
          {siteMessage && <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-200">{siteMessage}</div>}
        </div>
      </section>

      <footer className="border-t border-white/10 px-8 py-8 text-[10px] text-white/35">Built with DESIGNLY &middot; {projectName}</footer>
    </div>
  );
}

export default EditorPage;
