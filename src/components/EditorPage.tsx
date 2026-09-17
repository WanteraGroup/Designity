import { useState } from 'react';
import { Monitor, Tablet, Smartphone, Sparkles, Type, Palette, Layout, Download, Undo2, Redo2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';

interface EditorPageProps {
  onNavigate: (page: string) => void;
}

export function EditorPage({ onNavigate }: EditorPageProps) {
  const { t } = useI18n();
  const { isOwner } = useAuth();
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [aiCommand, setAiCommand] = useState('');
  const [aiHistory, setAiHistory] = useState<string[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  const handleAiCommand = () => {
    if (!aiCommand.trim()) return;
    setAiHistory([aiCommand, ...aiHistory]);
    setAiCommand('');
  };

  const aiCommands = [
    'Make it more luxurious',
    'Use silver instead of gold',
    'Make the typography stronger',
    'Make the mobile version cleaner',
    'Add a subtle Celtic border',
    'Make it look more premium',
  ];

  const sections = [
    { id: 'hero', name: t('editor.heroSection'), type: 'section' },
    { id: 'gallery', name: t('editor.gallery'), type: 'section' },
    { id: 'pricing', name: t('editor.pricing'), type: 'section' },
    { id: 'contact', name: t('editor.contactForm'), type: 'section' },
    { id: 'footer', name: t('editor.footer'), type: 'section' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] -mt-6 -mx-5 lg:-mx-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gold-600/10 bg-ink-900/80 backdrop-blur-xl gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('projects')} className="text-sm text-cream-300/60 hover:text-gold-200 transition-colors flex items-center gap-1">
            ← {t('editor.projects')}
          </button>
        </div>

        {/* Device switcher */}
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
            >
              <d.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-cream-300/60 hover:text-gold-200 transition-colors">
            <Undo2 className="w-4 h-4" />
          </button>
          <button className="p-2 text-cream-300/60 hover:text-gold-200 transition-colors">
            <Redo2 className="w-4 h-4" />
          </button>
          <button className="btn-gold text-xs px-4 py-2">
            <Download className="w-3.5 h-3.5" />
            {t('editor.export')}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — sections */}
        <div className="hidden md:flex w-56 flex-col border-r border-gold-600/10 bg-ink-900/50 overflow-y-auto">
          <div className="p-3">
            <div className="text-xs text-cream-300/40 uppercase tracking-wider mb-3 px-2">{t('editor.sections')}</div>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedElement(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  selectedElement === s.id ? 'bg-gold-600/15 text-gold-200 border border-gold-600/20' : 'text-cream-300/60 hover:bg-ink-700/40'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                {s.name}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-gold-600/10">
            <div className="text-xs text-cream-300/40 uppercase tracking-wider mb-3 px-2">{t('editor.tools')}</div>
            <div className="space-y-1">
              <ToolButton icon={Type} label={t('editor.editText')} />
              <ToolButton icon={Palette} label={t('editor.changeColors')} />
              <ToolButton icon={Layout} label={t('editor.changeLayout')} />
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-ink-950 flex justify-center p-4 lg:p-8">
          <div
            className="bg-ink-850 rounded-xl border border-ink-600/40 shadow-2xl overflow-hidden transition-all duration-500"
            style={{ width: deviceWidths[device], maxWidth: '100%' }}
          >
            {/* Preview content */}
            <div className="min-h-[400px] p-8">
              {/* Hero preview */}
              <div className="text-center py-12 border-b border-ink-600/30">
                <div className="w-16 h-16 rounded-full bg-gold-gradient mx-auto mb-6 flex items-center justify-center">
                  <span className="font-display font-bold text-ink-950 text-2xl">D</span>
                </div>
                <h2 className="text-2xl lg:text-4xl font-display font-bold text-cream-50 mb-3">
                  {t('editor.previewTitle')}
                </h2>
                <p className="text-sm text-cream-300/60 max-w-md mx-auto mb-6">
                  {t('editor.previewDesc')}
                </p>
                <button className="btn-gold text-sm">{t('editor.getStarted')}</button>
              </div>

              {/* Gallery preview */}
              <div className="py-8">
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square rounded-lg bg-ink-700/50 border border-ink-600/30" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar — AI editing */}
        <div className="hidden lg:flex w-72 flex-col border-l border-gold-600/10 bg-ink-900/50">
          <div className="p-4 border-b border-gold-600/10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span className="text-sm font-medium text-cream-100">{t('editor.aiEditor')}</span>
            </div>
            <textarea
              value={aiCommand}
              onChange={(e) => setAiCommand(e.target.value)}
              rows={3}
              className="input-lux text-sm resize-none"
              placeholder={t('editor.aiPlaceholder')}
            />
            <button onClick={handleAiCommand} disabled={!aiCommand.trim()} className="btn-gold w-full text-sm mt-2 disabled:opacity-40">
              <Sparkles className="w-3.5 h-3.5" />
              {t('editor.applyEdit')}
            </button>
          </div>

          <div className="p-4">
            <div className="text-xs text-cream-300/40 uppercase tracking-wider mb-3">{t('editor.quickCommands')}</div>
            <div className="space-y-1.5">
              {aiCommands.map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => { setAiHistory([cmd, ...aiHistory]); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-cream-300/60 hover:text-gold-200 hover:bg-gold-600/10 transition-all border border-transparent hover:border-gold-600/20"
                >
                  "{cmd}"
                </button>
              ))}
            </div>
          </div>

          {aiHistory.length > 0 && (
            <div className="p-4 border-t border-gold-600/10 flex-1 overflow-y-auto">
              <div className="text-xs text-cream-300/40 uppercase tracking-wider mb-3">{t('editor.recentEdits')}</div>
              <div className="space-y-1.5">
                {aiHistory.slice(0, 10).map((cmd, i) => (
                  <div key={i} className="text-xs text-cream-300/40 px-3 py-1.5 rounded bg-ink-800/50">
                    {cmd}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-gold-600/10">
            <div className="text-xs text-cream-300/40 mb-2">{t('editor.costPerEdit')}</div>
            <div className="text-sm font-medium text-gold-200">{isOwner ? '∞' : `1 ${t('misc.creditsShort')}`}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-cream-300/60 hover:text-gold-200 hover:bg-ink-700/40 transition-all">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
