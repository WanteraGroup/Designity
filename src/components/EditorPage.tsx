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
        setBuildSpec(spec);
        const content = spec?.content || {};
        setDesign((current) => ({ ...current, heroTitle: String(content.heroTitle || content.title || data.name || current.heroTitle), heroDescription: String(content.heroDescription || content.description || data.brief || current.heroDescription), heroButton: String(content.cta || content.heroButton || current.heroButton), celticBorder: true, atmosphere: 'mist' }));
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
          <button
            onClick={exportSettings}
            className="btn-gold text-xs px-4 py-2"
          >
            <Download className="w-3.5 h-3.5" />
            {t('editor.export')}
          </button>
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
          <div
            className="rounded-xl border border-ink-600/40 shadow-2xl overflow-hidden transition-all duration-500"
            style={{ width: deviceWidths[device], maxWidth: '100%' }}
          >
            <div
              className={`min-h-[800px] p-8 ${atmosphereClass} relative overflow-hidden`}
              style={{
                color: design.text,
                border: design.celticBorder ? `1px solid ${design.accent}66` : undefined,
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  background:
                    design.celticBorder
                      ? `repeating-linear-gradient(45deg, transparent 0 18px, ${design.accent}22 18px 19px, transparent 19px 36px)`
                      : undefined,
                }}
              />

              <section className={`relative py-16 min-h-[420px] flex flex-col justify-center ${heroAlignClass} px-4`}>
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg,${design.accent},#fff1b8,${design.accent})`,
                    boxShadow: `0 0 50px ${design.accent}33`,
                  }}
                >
                  <span className="font-display font-bold text-ink-950 text-2xl">D</span>
                </div>
                <h2 className="text-3xl lg:text-5xl font-display font-bold mb-4 tracking-tight max-w-4xl">
                  {design.heroTitle}
                </h2>
                <p className="text-sm lg:text-base max-w-2xl mb-7 leading-7 opacity-70">
                  {design.heroDescription}
                </p>
                <button
                  className="px-5 py-3 rounded-xl font-semibold text-sm transition-transform hover:-translate-y-0.5"
                  style={{
                    background: design.accent,
                    color: '#08090b',
                    boxShadow: `0 15px 35px ${design.accent}22`,
                  }}
                >
                  {design.heroButton}
                </button>
              </section>

              <section className="relative py-8">
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: `repeat(${design.galleryColumns},minmax(0,1fr))` }}
                >
                  {galleryItems.map((item) => (
                    <div
                      key={item}
                      className="aspect-square rounded-xl border border-white/8"
                      style={{
                        background: `linear-gradient(145deg,${design.surface},${design.accent}12)`,
                      }}
                    />
                  ))}
                </div>
              </section>

              <section className="relative mt-8 rounded-2xl border border-white/8 p-6" style={{ background: design.surface }}>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-lg border border-white/7 bg-black/10" />
                  ))}
                </div>
              </section>
            </div>
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
