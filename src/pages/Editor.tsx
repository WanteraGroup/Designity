import { useEffect, useState } from 'react';
import { Download, Edit3, FileImage, Save, Sparkles } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface EditorProps {
  onNavigate: (page: string) => void;
}

export default function Editor({ onNavigate }: EditorProps) {
  const { profile } = useAuth();
  const [artifactName, setArtifactName] = useState('DESIGNLY STUDIO');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadArtifact() {
      const projectId = localStorage.getItem('designly_selected_project');
      if (!projectId) return;
      const { data } = await supabase.from('projects').select('name,preview_url').eq('id', projectId).maybeSingle();
      if (cancelled || !data) return;
      setArtifactName(data.name || 'DESIGNLY STUDIO');
      setPreviewUrl(data.preview_url || null);
    }
    void loadArtifact();
    return () => { cancelled = true; };
  }, []);

  const openEditor = () => onNavigate('editor-workspace');

  const exportArtifact = async () => {
    const payload = {
      product: 'DESIGNLY STUDIO',
      artifact: artifactName,
      projectId: localStorage.getItem('designly_selected_project'),
      exportedBy: profile?.email || 'DESIGNLY OPERATOR',
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'designly-artifact.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveArtifact = async () => {
    const projectId = localStorage.getItem('designly_selected_project');
    if (!projectId) {
      onNavigate('projects');
      return;
    }
    setSaving(true);
    await supabase.from('projects').update({ updated_at: new Date().toISOString() }).eq('id', projectId);
    setSaving(false);
  };

  return (
    <div className="relative min-h-screen bg-[#020505] text-[#E3FFFB] overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center opacity-[0.24]" style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }} aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020505]/35 to-[#020505]/95" aria-hidden="true" />

      <NordicHeader title="EDITOR — ARTIFACT EDITOR" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">
                <Edit3 className="w-4 h-4" /> ARTIFACT COMMAND
              </div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Current Artifact</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
                A kiválasztott projekt vizuális artifactja innen nyitható meg a teljes DESIGNLY Editor workspace-ben.
              </p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('projects')}>← Projects</ForgedButton>
          </div>

          <ForgedPanel>
            <div className="relative h-72 lg:h-96 bg-[#020505]/80 border border-[#263636] rounded-[16px] overflow-hidden flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt={artifactName} className="max-h-full max-w-full object-contain select-none" draggable={false} />
              ) : (
                <div className="text-center">
                  <FileImage className="w-12 h-12 mx-auto mb-3 text-[#D6B36A]/25" />
                  <div className="font-serif text-2xl">{artifactName}</div>
                  <div className="mt-2 text-xs text-[#EEE8DC]/35">No preview image available</div>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3 items-center">
              <ForgedButton variant="primary" onClick={openEditor}>
                <Sparkles className="w-4 h-4" /> Open Full Editor
              </ForgedButton>
              <ForgedButton variant="secondary" onClick={saveArtifact} disabled={saving}>
                <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
              </ForgedButton>
              <ForgedButton variant="secondary" onClick={exportArtifact}>
                <Download className="w-4 h-4" /> Export
              </ForgedButton>
            </div>
          </ForgedPanel>
        </section>
      </main>
    </div>
  );
}
