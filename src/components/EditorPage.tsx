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
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  runDesignlyGroqEditor,
  type DesignEditorState,
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
  const { isOwner } = useAuth();
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
  const [saveStatus, setSaveStatus] = useState<string>('MENTVE');

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
    setAiHistory((items) => [normalized, ...items].slice(0, 20));
    setAiLoading(true);

    const result = await runDesignlyGroqEditor({
      command: normalized,
      selectedElement,
      device,
      design,
    });

    setAiLoading(false);

    if (!result.ok || !result.design) {
      setAiError(result.message || 'Az AI szerkesztő nem tudta alkalmazni a módosítást.');
      return;
    }

    const changed =
      JSON.stringify(result.design) !== JSON.stringify(design);

    if (changed) {
      pushHistory(design);
      setDesign(result.design);
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
    }

    setAiReply(result.reply || 'A módosítást alkalmaztam.');
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
      setAiError('A böngészőben nincs elérhető beszédfelismerés. Írd be a parancsot.');
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
      setAiError('A hangfelismerés nem sikerült. Próbáld újra.');
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

  const escapeHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const exportBaseName = (projectName || 'designly-site')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'designly-site';

  const buildExportStyles = () => `/* DESIGNLY STUDIO export — ${escapeHtml(projectName)} */
*{box-sizing:border-box}
:root{color-scheme:dark}
html{scroll-behavior:smooth}
body{margin:0;background:${design.surface};color:${design.text};font-family:Inter,Arial,sans-serif}
main{min-height:100vh;background:radial-gradient(circle at 50% 15%,rgba(214,170,74,.16),transparent 35%),linear-gradient(180deg,#15171c,#08090b)}
.hero{min-height:70vh;display:flex;flex-direction:column;align-items:${design.heroAlign==='left'?'flex-start':design.heroAlign==='right'?'flex-end':'center'};justify-content:center;text-align:${design.heroAlign};padding:64px 8%;gap:18px}
.badge{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:${design.accent};color:#08090b;font-weight:800;font-size:24px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
h1{font-size:clamp(42px,7vw,88px);margin:0;font-family:Georgia,serif}
p{max-width:720px;line-height:1.7;opacity:.72}
button,.cta{border:0;border-radius:10px;padding:14px 24px;background:${design.accent};color:#08090b;font-weight:800;text-decoration:none;cursor:pointer}
footer{padding:28px 8%;border-top:1px solid rgba(214,170,74,.2);opacity:.55}
`;

  const buildExportScript = () => `document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('[data-action="cta"]').forEach((el)=>el.addEventListener('click',()=>document.querySelector('#contact')?.scrollIntoView({behavior:'smooth'})));});`;

  const buildExportHtml = (externalFiles = false) => {
    const title = projectName || 'DESIGNLY STUDIO';
    const description = design.heroDescription || 'Premium website created with DESIGNLY STUDIO AI.';
    const css = externalFiles ? '<link rel="stylesheet" href="styles.css">' : `<style>\n${buildExportStyles()}\n</style>`;
    const script = externalFiles ? '<script src="script.js" defer><\\/script>' : `<script>\n${buildExportScript()}\n<\\/script>`;
    return `<!doctype html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
${css}
</head>
<body>
<main>
<section class="hero">
<div class="badge">D</div>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(description)}</p>
<a class="cta" data-action="cta" href="#contact">${escapeHtml(design.heroButton || 'GET STARTED')}</a>
</section>
<section id="contact" style="padding:48px 8%;min-height:220px"><h2>Kapcsolat</h2><p>A projekt szerkeszthető, és a DESIGNLY STUDIO export rendszerével továbbépíthető.</p></section>
<footer>Created with DESIGNLY STUDIO</footer>
</main>
${script}
</body>
</html>`;
  };

  const encodeUtf8 = (value: string) => new TextEncoder().encode(value);

  const crc32 = (bytes: Uint8Array) => {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i += 1) {
      crc ^= bytes[i];
      for (let j = 0; j < 8; j += 1) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  };

  const u16 = (n: number) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff]);
  const u32 = (n: number) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]);
  const concatBytes = (parts: Uint8Array[]) => {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(total);
    let offset = 0;
    parts.forEach((part) => { output.set(part, offset); offset += part.length; });
    return output;
  };

  const makeZip = (files: Record<string, string>) => {
    const localParts: Uint8Array[] = [];
    const centralParts: Uint8Array[] = [];
    let offset = 0;

    Object.entries(files).forEach(([filename, content]) => {
      const nameBytes = encodeUtf8(filename);
      const dataBytes = encodeUtf8(content);
      const crc = crc32(dataBytes);
      const localHeader = concatBytes([
        u32(0x04034b50),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(dataBytes.length),
        u32(dataBytes.length),
        u16(nameBytes.length),
        u16(0),
        nameBytes,
      ]);
      localParts.push(localHeader, dataBytes);

      const centralHeader = concatBytes([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(dataBytes.length),
        u32(dataBytes.length),
        u16(nameBytes.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        nameBytes,
      ]);
      centralParts.push(centralHeader);
      offset += localHeader.length + dataBytes.length;
    });

    const centralDirectory = concatBytes(centralParts);
    const localDirectory = concatBytes(localParts);
    const endRecord = concatBytes([
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(Object.keys(files).length),
      u16(Object.keys(files).length),
      u32(centralDirectory.length),
      u32(localDirectory.length),
      u16(0),
    ]);

    return concatBytes([localDirectory, centralDirectory, endRecord]);
  };

  const buildExportFiles = () => {
    const payload = JSON.stringify({
      product: 'DESIGNLY STUDIO',
      version: 3,
      exportedAt: new Date().toISOString(),
      projectName,
      device,
      design,
      buildSpec,
    }, null, 2);

    const readme = `DESIGNLY STUDIO PROJECT\\n\\n${projectName}\\n\\nFájlok:\\n- index.html — weboldal\\n- styles.css — stílusok\\n- script.js — alap interakciók\\n- project.json — DESIGNLY projektállapot\\n`;

    return {
      'index.html': buildExportHtml(true),
      'styles.css': buildExportStyles(),
      'script.js': buildExportScript(),
      'project.json': payload,
      'README.txt': readme,
    };
  };

  const saveProjectNow = async () => {
    const projectId = localStorage.getItem('designly_selected_project');
    if (!projectId) {
      setSaveStatus('NINCS KIVÁLASZTOTT PROJEKT');
      return;
    }
    setSaveStatus('MENTÉS…');
    const { data: currentProject } = await supabase.from('projects').select('config').eq('id', projectId).maybeSingle();
    const currentConfig = (currentProject?.config || {}) as Record<string, unknown>;
    const { error } = await supabase.from('projects').update({
      config: {
        ...currentConfig,
        designState: design,
        buildSpec,
        exportVersion: 3,
        updatedBy: 'DESIGNLY_EDITOR',
        updatedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    }).eq('id', projectId);
    setSaveStatus(error ? 'MENTÉSI HIBA' : 'MENTVE');
  };

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const exportWebsite = () => {
    downloadFile(`${exportBaseName}.html`, buildExportHtml(), 'text/html;charset=utf-8');
  };

  const exportCss = () => {
    downloadFile('styles.css', buildExportStyles(), 'text/css;charset=utf-8');
  };

  const exportJs = () => {
    downloadFile('script.js', buildExportScript(), 'text/javascript;charset=utf-8');
  };

  const exportWebsiteZip = () => {
    const files = buildExportFiles();
    const zip = makeZip(files);
    const blob = new Blob([zip], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${exportBaseName}-designly.zip`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const exportSvg = () => {
    const title = projectName || 'DESIGNLY STUDIO';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${design.surface}"/><circle cx="600" cy="220" r="58" fill="${design.accent}"/><text x="600" y="235" text-anchor="middle" font-size="42" font-family="Arial" font-weight="700" fill="#08090b">D</text><text x="600" y="390" text-anchor="middle" font-size="64" font-family="Georgia" fill="${design.text}">${escapeHtml(title)}</text></svg>`;
    downloadFile('designly-logo-preview.svg', svg, 'image/svg+xml;charset=utf-8');
  };

  const exportSettings = () => {
    const payload = JSON.stringify(
      {
        product: 'DESIGNLY STUDIO',
        version: 3,
        device,
        design,
        buildSpec,
      },
      null,
      2,
    );

    downloadFile('designly-project.json', payload, 'application/json;charset=utf-8');
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

  const businessPreview = buildSpec?.pages?.length || buildSpec?.sections?.length
    ? buildBusinessPreviewSpec(buildSpec, projectName, design)
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] -mt-6 -mx-5 lg:-mx-8 bg-ink-950">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gold-600/10 bg-ink-900/90 backdrop-blur-xl gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => onNavigate('projects')}
            className="text-sm text-cream-300/60 hover:text-gold-200 transition-colors flex items-center gap-1"
          >
            ← {t('editor.projects')}
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
          <div className="relative group">
            <button className="btn-gold text-xs px-4 py-2">
              <Download className="w-3.5 h-3.5" />
              EXPORT / MENTÉS · {saveStatus}
            </button>
            <div className="absolute right-0 top-full mt-2 z-50 hidden group-hover:block w-52 rounded-xl border border-gold-600/20 bg-ink-900/95 p-2 shadow-2xl backdrop-blur-xl">
              <button onClick={exportWebsiteZip} className="w-full text-left px-3 py-2 rounded-lg text-xs text-gold-200 hover:bg-gold-600/10 font-semibold">WEBOLDAL · ZIP CSOMAG</button>
              <button onClick={exportWebsite} className="w-full text-left px-3 py-2 rounded-lg text-xs text-cream-200 hover:bg-gold-600/10">WEBOLDAL · HTML</button>
              <button onClick={exportCss} className="w-full text-left px-3 py-2 rounded-lg text-xs text-cream-200 hover:bg-gold-600/10">STÍLUS · CSS</button>
              <button onClick={exportJs} className="w-full text-left px-3 py-2 rounded-lg text-xs text-cream-200 hover:bg-gold-600/10">KÓD · JS</button>
              <button onClick={exportSettings} className="w-full text-left px-3 py-2 rounded-lg text-xs text-cream-200 hover:bg-gold-600/10">PROJEKT · JSON</button>
              <button onClick={exportSvg} className="w-full text-left px-3 py-2 rounded-lg text-xs text-cream-200 hover:bg-gold-600/10">LOGÓ / GRAFIKA · SVG</button>
              <button onClick={() => window.location.href = `mailto:?subject=${encodeURIComponent(projectName + ' · DESIGNLY projekt')}&body=${encodeURIComponent('A DESIGNLY projekt ZIP csomagját a jobb felső Export menüből tudod csatolni és elküldeni.')}`} className="w-full text-left px-3 py-2 rounded-lg text-xs text-emerald-200 hover:bg-emerald-600/10">EMAIL · MEGNYITÁS</button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-3 z-10 hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-full border border-gold-600/20 bg-ink-950/90 backdrop-blur-xl shadow-xl">
  <span className="text-[10px] uppercase tracking-[.18em] text-gold-300">{projectLoading ? 'BETÖLTÉS…' : projectName}</span>
  {buildSpec?.pages?.length ? <span className="text-[9px] text-cream-300/45">{buildSpec.pages.length} oldal · {buildSpec.sections?.length || 0} szekció · {buildSpec.components?.length || 0} komponens</span> : null}
</div>

<div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex w-56 flex-col border-r border-gold-600/10 bg-ink-900/50 overflow-y-auto">
          <div className="p-3">
            <div className="text-xs text-cream-300/40 uppercase tracking-wider mb-3 px-2">
              {t('editor.sections')}
            </div>
            {[
              { id: 'hero', name: t('editor.heroSection') },
              { id: 'gallery', name: t('editor.gallery') },
              { id: 'pricing', name: t('editor.pricing') },
              { id: 'contact', name: t('editor.contactForm') },
              { id: 'footer', name: t('editor.footer') },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedElement(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${selectedElement === s.id ? 'bg-gold-600/15 text-gold-200 border border-gold-600/20' : 'text-cream-300/60 hover:bg-ink-700/40'}`}
              >
                <Layout className="w-3.5 h-3.5" />
                {s.name}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-gold-600/10">
            <div className="text-xs text-cream-300/40 uppercase tracking-wider mb-3 px-2">
              {t('editor.tools')}
            </div>
            <div className="space-y-1">
              <ToolButton icon={Type} label={t('editor.editText')} />
              <ToolButton icon={Palette} label={t('editor.changeColors')} />
              <ToolButton icon={Layout} label={t('editor.changeLayout')} />
            </div>
          </div>

          <div className="mt-auto p-3 border-t border-gold-600/10">
            <div className="text-[10px] text-cream-300/40">AI ENGINE</div>
            <div className="text-xs text-gold-200 mt-1">Groq · GPT-OSS 120B</div>
            <div className="text-[10px] text-cream-300/30 mt-1">Structured safe edits</div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-ink-950 flex justify-center p-4 lg:p-8">
          <div className="rounded-xl border border-ink-600/40 shadow-2xl overflow-hidden bg-black" style={{ width: deviceWidths[device], maxWidth: '100%' }}>
            {businessPreview || (
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
                <Sparkles className="w-4 h-4 text-gold-400" />
                <span className="text-sm font-medium text-cream-100">{t('editor.aiEditor')}</span>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full border border-emerald-400/20 bg-emerald-400/5 text-emerald-300">
                {aiLoading ? 'THINKING…' : 'ONLINE'}
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
                {listening ? 'HALLGATLAK…' : 'HANG'}
              </button>
              <button
                onClick={() => void applyAiCommand(aiCommand)}
                disabled={!aiCommand.trim() || aiLoading}
                className="btn-gold flex-1 text-sm disabled:opacity-40"
              >
                {aiLoading ? <Sparkles className="w-3.5 h-3.5 animate-pulse" /> : <Send className="w-3.5 h-3.5" />}
                {aiLoading ? 'AI…' : t('editor.applyEdit')}
              </button>
            </div>

            <div className="text-[10px] text-cream-300/30 mt-2">
              Ctrl/Cmd + Enter = alkalmazás
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
                  AI válasz
                </div>
                {aiReply}
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
                  "{cmd}"
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
            <div className="text-xs text-cream-300/40 mb-2">{t('editor.costPerEdit')}</div>
            <div className="text-sm font-medium text-gold-200">
              {isOwner ? '∞' : `1 ${t('misc.creditsShort')}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function buildBusinessPreviewSpec(spec: any, projectName: string, design: DesignEditorState) {
  const sections = Array.isArray(spec?.sections) ? spec.sections : [];
  const content = Array.isArray(spec?.content) ? spec.content : [];
  const text = [...sections, ...content].filter((v) => typeof v === 'string') as string[];
  const joined = text.join(' · ');
  const pick = (pattern: RegExp, fallback: string) => text.find((v) => pattern.test(v)) || fallback;
  const cards = [
    pick(/service|szolgált|solution|megold/i, 'Business Foundation'),
    pick(/lead|marketing|sales|értékes/i, 'Lead Generation Systems'),
    pick(/crm|automat|automation/i, 'Sales & CRM Automation'),
    pick(/scale|növek|growth/i, 'Scale & Optimize'),
  ];
  return (
    <div className="min-h-[1100px] bg-[#070707] text-[#f5f0e6]">
      <header className="h-16 px-7 flex items-center justify-between border-b border-[#d6aa4a33] bg-black">
        <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full border border-[#d6aa4a88] flex items-center justify-center text-[#d6aa4a]">ᛟ</div><div className="font-display tracking-[.18em] text-sm">{projectName.toUpperCase()}</div></div>
        <nav className="hidden sm:flex gap-5 text-[10px] text-[#cfc7b5aa] uppercase"><span>Home</span><span>Services</span><span>Solutions</span><span>Pricing</span><span>About</span></nav>
        <button className="px-3 py-2 rounded-md text-[10px] font-semibold bg-[#d6aa4a] text-black">GET STARTED</button>
      </header>
      <section className="relative px-8 py-20 min-h-[430px] flex items-center overflow-hidden" style={{ background:'radial-gradient(circle at 72% 35%,rgba(214,170,74,.25),transparent 28%),linear-gradient(120deg,#050505,#17130b,#050505)' }}>
        <div className="absolute right-[8%] top-10 w-64 h-64 rounded-full border-[18px] border-[#d6aa4a55] flex items-center justify-center"><div className="w-40 h-40 rounded-full border border-[#d6aa4a99] flex items-center justify-center text-7xl text-[#d6aa4a]">ᛟ</div></div>
        <div className="relative z-[1] max-w-xl"><div className="text-[10px] uppercase tracking-[.3em] text-[#d6aa4a] mb-4">AUTOMATE. BUILD. SCALE.</div><h1 className="text-4xl lg:text-6xl font-display font-bold leading-[.95] mb-5">{design.heroTitle || projectName}</h1><p className="text-sm leading-6 text-[#f5f0e699] max-w-lg mb-7">{design.heroDescription || 'Prémium, AI-alapú üzleti rendszer automatikus felépítéssel.'}</p><button className="px-6 py-3 rounded-md font-semibold text-xs bg-[#d6aa4a] text-black">{design.heroButton || 'EXPLORE SOLUTIONS →'}</button></div>
      </section>
      <section className="grid grid-cols-4 border-y border-[#d6aa4a33] bg-[#0b0b0b]">{['500+','98%','24/7','AI'].map((s)=><div key={s} className="py-5 text-center border-r border-[#d6aa4a22]"><div className="text-xl font-display text-[#d6aa4a]">{s}</div><div className="text-[9px] text-[#aaa38f88] mt-1">BUSINESS METRIC</div></div>)}</section>
      <section className="px-7 py-12 border-b border-[#d6aa4a22]"><div className="text-center mb-7"><div className="text-[9px] uppercase tracking-[.25em] text-[#d6aa4a]">OUR SOLUTIONS</div><h2 className="text-2xl font-display font-bold mt-2">Everything You Need to Build, Automate & Scale</h2></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{cards.map((card,i)=><div key={i} className="rounded-xl border border-[#d6aa4a33] bg-[#0d0d0d] p-4 min-h-[135px]"><div className="text-[#d6aa4a] text-xl mb-3">✦</div><div className="text-sm font-semibold mb-2">{card}</div><div className="text-[10px] leading-4 text-[#aaa38f88]">AI-powered business system with editable content.</div></div>)}</div></section>
      <section className="grid lg:grid-cols-2 border-b border-[#d6aa4a22]"><div className="p-7"><div className="text-[9px] text-[#d6aa4a]">DASHBOARD</div><h2 className="text-2xl font-display font-bold mt-2 mb-5">Business Growth Overview</h2><div className="grid grid-cols-2 gap-3">{['Revenue','Active Leads','Deals Closed','Conversion'].map((x,i)=><div key={x} className="rounded-lg border border-white/10 bg-[#0d0d0d] p-4"><div className="text-[9px] text-[#aaa38f88]">{x}</div><div className="text-lg text-[#d6aa4a] mt-2">{['$245,750','1,250','320','25.6%'][i]}</div></div>)}</div><div className="mt-3 h-32 rounded-lg border border-white/10 bg-[#0d0d0d] p-4"><div className="text-[9px] text-[#aaa38f88]">REVENUE GROWTH</div><div className="mt-5 h-px bg-[#d6aa4a] rotate-[-4deg]" /></div></div><div className="p-7 bg-[#0a0a0a]"><div className="text-[9px] text-[#d6aa4a]">AI ASSISTANT</div><h2 className="text-2xl font-display font-bold mt-2 mb-4">Your 24/7 Growth Partner</h2><div className="rounded-xl border border-[#d6aa4a33] p-5 bg-black/40"><div className="text-xs text-[#d6aa4a] mb-3">DESIGNLY AI</div><p className="text-xs text-[#f5f0e688] leading-5">AI asszisztens a látogatók és az üzlet támogatására.</p><div className="mt-4 space-y-2"><div className="rounded-md border border-white/10 px-3 py-2 text-[10px]">Hogyan szerezhetek több ügyfelet?</div><div className="rounded-md border border-white/10 px-3 py-2 text-[10px]">Mutasd az üzleti teljesítményt</div></div></div></div></section>
      <section className="px-7 py-12"><div className="text-[9px] text-[#d6aa4a]">PRICING PLANS</div><h2 className="text-2xl font-display font-bold mt-2 mb-6">Simple, Transparent Pricing</h2><div className="grid md:grid-cols-3 gap-3">{['Starter','Professional','Enterprise'].map((p,i)=><div key={p} className={`rounded-xl border ${i===1?'border-[#d6aa4a]':'border-[#d6aa4a33]'} bg-[#0d0d0d] p-5`}><div className="text-xs text-[#aaa38f99]">{p}</div><div className="text-2xl text-[#d6aa4a] font-display mt-2">{['$497','$997','$2,497'][i]}</div><div className="text-[10px] text-[#aaa38f88] mt-3">Szerkeszthető árhelyőrző</div><button className="mt-5 w-full py-2 rounded-md text-[10px] bg-[#d6aa4a] text-black">GET STARTED</button></div>)}</div></section>
      <section className="px-7 py-10 border-t border-[#d6aa4a22] flex items-center justify-between gap-5"><div><div className="text-xl font-display font-bold">Ready to Build Your Automatic Business?</div><div className="text-[10px] text-[#aaa38f88] mt-1">{joined.slice(0,160)}</div></div><button className="px-5 py-3 rounded-md text-xs font-semibold bg-[#d6aa4a] text-black">START BUILDING →</button></section>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-cream-300/60 hover:text-gold-200 hover:bg-ink-700/40 transition-all">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
