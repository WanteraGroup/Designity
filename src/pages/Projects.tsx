import { useEffect, useMemo, useState } from 'react';
import { Archive, FolderOpen, Layers3, Plus, Sparkles } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/types';

interface ProjectsProps {
  onNavigate: (page: string) => void;
}

export default function Projects({ onNavigate }: ProjectsProps) {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [brand, setBrand] = useState('');
  const [saved, setSaved] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function load() {
      if (!profile) return;
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false });
      setProjects((data as Project[]) || []);
      setLoading(false);
    }
    load();
  }, [profile]);

  const activeProjects = projects.length;
  const archived = 0;

  const createProject = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem(
      'designly_project_brief',
      JSON.stringify({ name: trimmed, type: type.trim(), brand: brand.trim() }),
    );
    setCreating(true);
    window.setTimeout(() => {
      setCreating(false);
      onNavigate('create');
    }, 350);
  };

  const saveDraft = () => {
    localStorage.setItem(
      'designly_project_draft',
      JSON.stringify({ name: name.trim(), type: type.trim(), brand: brand.trim(), savedAt: new Date().toISOString() }),
    );
    setSaved(true);
  };

  const visibleProjects = useMemo(() => projects.slice(0, 6), [projects]);

  const openProject = (project: Project) => {
    localStorage.setItem('designly_selected_project', project.id);
    onNavigate('editor');
  };

  const archiveProject = async (project: Project) => {
    // The current project schema has no archive flag. Keep the action safe by
    // opening the project rather than silently deleting production data.
    openProject(project);
  };

  return (
    <div className="relative min-h-screen bg-[#020505] text-[#E3FFFB] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.24]"
        style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#020505]/35 to-[#020505]/95"
        aria-hidden="true"
      />

      <NordicHeader title="PROJECTS — DESIGNLY WORKSPACE" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">
                <Layers3 className="w-4 h-4" /> PROJECT COMMAND
              </div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Project Overview</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
                A DESIGNLY projektjei egyetlen Nordic Workspace felületen kezelhetők, az editorba vezető közvetlen munkafolyamattal.
              </p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Metric label="Total Projects" value={String(projects.length)} icon={FolderOpen} />
            <Metric label="Active" value={String(activeProjects)} icon={Sparkles} />
            <Metric label="Archived" value={String(archived)} icon={Archive} />
          </div>
        </section>

        <section>
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#9CEEE5]/60">WORKSPACE ENTRY</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl">Create New Project</h2>
          </div>

          <ForgedPanel className="max-w-4xl">
            <div className="grid md:grid-cols-3 gap-5 text-xs">
              <Field label="Project Name" placeholder="Pl. Nordic Brand 2026" value={name} onChange={setName} />
              <Field label="Type" placeholder="Campaign / Website / Logo / Product / CNC" value={type} onChange={setType} />
              <Field label="Brand" placeholder="Márkanév" value={brand} onChange={setBrand} />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <ForgedButton variant="primary" onClick={createProject} disabled={creating || !name.trim()}>
                <Plus className="w-4 h-4" /> {creating ? 'Preparing…' : 'Create Project'}
              </ForgedButton>
              <ForgedButton variant="secondary" onClick={saveDraft}>
                <FolderOpen className="w-4 h-4" /> {saved ? 'Draft Saved' : 'Save Draft'}
              </ForgedButton>
            </div>
            <p className="mt-3 text-[11px] text-[#EEE8DC]/35">
              A projektadatokat a meglévő Create / Editor munkafolyamat kapja meg; nincs külön párhuzamos projekt-rendszer.
            </p>
          </ForgedPanel>
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">PROJECT VAULT</div>
              <h2 className="mt-2 font-serif text-3xl lg:text-4xl">Projects</h2>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('create')}>
              <Sparkles className="w-4 h-4" /> Open Create Workspace
            </ForgedButton>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((id) => <ForgedPanel key={id} className="h-44 animate-pulse"><div className="h-full rounded-2xl bg-black/20" /></ForgedPanel>)}
            </div>
          ) : visibleProjects.length === 0 ? (
            <ForgedPanel className="p-12 text-center">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 text-[#EEE8DC]/20" />
              <div className="font-serif text-2xl">No projects yet</div>
              <p className="mt-2 text-sm text-[#EEE8DC]/40">Hozd létre az első projektet a Forge Workspace-ben.</p>
              <div className="mt-6"><ForgedButton variant="primary" onClick={() => onNavigate('create')}><Sparkles className="w-4 h-4" /> Start Creating</ForgedButton></div>
            </ForgedPanel>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {visibleProjects.map((project) => (
                <ForgedPanel key={project.id}>
                  <div className="flex justify-between items-start gap-4 mb-5">
                    <div className="min-w-0">
                      <div className="font-serif text-2xl truncate">{project.name}</div>
                      <div className="text-xs text-[#EEE8DC]/55 mt-1 capitalize">
                        {project.type.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="text-[9px] uppercase tracking-[.18em] text-[#9CEEE5]/70">ACTIVE</div>
                  </div>
                  <div className="flex gap-3">
                    <ForgedButton variant="secondary" className="flex-1" onClick={() => openProject(project)}>
                      <FolderOpen className="w-4 h-4" /> Open
                    </ForgedButton>
                    <ForgedButton variant="secondary" className="flex-1" onClick={() => archiveProject(project)}>
                      <Archive className="w-4 h-4" /> Archive
                    </ForgedButton>
                  </div>
                </ForgedPanel>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 block">
      <span className="text-[#EEE8DC]/70">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-[#071311]/75 border border-[#263636] rounded-[10px] px-3 py-2.5 text-xs text-[#E3FFFB] placeholder:text-[#EEE8DC]/35 outline-none focus:border-[#9CEEE5]/40 focus:ring-2 focus:ring-[#9CEEE5]/5"
        placeholder={placeholder}
      />
    </label>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof FolderOpen;
}) {
  return (
    <ForgedPanel>
      <Icon className="w-5 h-5 mb-3 text-[#D6B36A]/75" />
      <div className="text-xs text-[#EEE8DC]/55">{label}</div>
      <div className="font-serif text-4xl mt-2">{value}</div>
    </ForgedPanel>
  );
}
