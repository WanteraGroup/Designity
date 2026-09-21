import { useState } from 'react';
import { CalendarClock, CheckCircle2, ListTodo, Save, Sparkles, Users } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';

interface PlannerProps {
  onNavigate: (page: string) => void;
}

const tasks = [
  { id: 1, title: 'Finalize campaign visuals', module: 'Campaigns', due: 'Today' },
  { id: 2, title: 'Generate product music bed', module: 'Music', due: 'Tomorrow' },
];

export default function Planner({ onNavigate }: PlannerProps) {
  const [objective, setObjective] = useState('');
  const [keyTasks, setKeyTasks] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saved, setSaved] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);

  const savePlan = () => {
    localStorage.setItem(
      'designly_planner_plan',
      JSON.stringify({
        objective: objective.trim(),
        keyTasks: keyTasks.trim(),
        deadline: deadline.trim(),
        savedAt: new Date().toISOString(),
      }),
    );
    setSaved(true);
  };

  const assignToAgents = () => {
    localStorage.setItem(
      'designly_planner_agent_brief',
      JSON.stringify({
        objective: objective.trim(),
        keyTasks: keyTasks.trim(),
        deadline: deadline.trim(),
      }),
    );
    onNavigate('agents');
  };

  const openTask = (task: typeof tasks[number]) => {
    if (task.module === 'Campaigns') onNavigate('campaign');
    else if (task.module === 'Music') onNavigate('music');
  };

  const toggleComplete = (id: number) => {
    setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
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

      <NordicHeader title="PLANNER — STRATEGIC PLANNER" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">
                <CalendarClock className="w-4 h-4" /> STRATEGIC COMMAND
              </div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Today’s Plan</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
                A napi célok, feladatok és agent-hozzárendelések egyetlen stratégiai tervezési felületen kezelhetők.
              </p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <ForgedPanel className="max-w-4xl">
            <div className="grid md:grid-cols-3 gap-5 text-xs">
              <Field label="Main Objective" placeholder="Pl. Launch Nordic campaign" value={objective} onChange={setObjective} />
              <Field label="Key Tasks" placeholder="Design, copy, assets, deployment" value={keyTasks} onChange={setKeyTasks} />
              <Field label="Deadline" placeholder="Dátum / idő" value={deadline} onChange={setDeadline} />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <ForgedButton variant="primary" onClick={savePlan}>
                <Save className="w-4 h-4" /> {saved ? 'Plan Saved' : 'Save Plan'}
              </ForgedButton>
              <ForgedButton variant="secondary" onClick={assignToAgents}>
                <Users className="w-4 h-4" /> Assign to Agents
              </ForgedButton>
              <ForgedButton variant="secondary" onClick={() => onNavigate('planner-workspace')}>
                <Sparkles className="w-4 h-4" /> Open Planner AI
              </ForgedButton>
            </div>
          </ForgedPanel>
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-[.28em] text-[#9CEEE5]/60">TASK QUEUE</div>
              <h2 className="mt-2 font-serif text-3xl lg:text-4xl">Upcoming Tasks</h2>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('planner-workspace')}>
              Open Strategic Planner
            </ForgedButton>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tasks.map((task) => {
              const done = completed.includes(task.id);
              return (
                <ForgedPanel key={task.id}>
                  <div className="flex justify-between items-start gap-4 mb-5">
                    <div>
                      <div className="font-serif text-2xl">{task.title}</div>
                      <div className="text-xs text-[#EEE8DC]/55 mt-1">{task.module}</div>
                    </div>
                    <div className={`text-[9px] uppercase tracking-[.18em] ${done ? 'text-emerald-300/80' : 'text-[#9CEEE5]/70'}`}>
                      {done ? 'Completed' : task.due}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <ForgedButton variant="secondary" className="flex-1" onClick={() => openTask(task)}>
                      Open
                    </ForgedButton>
                    <ForgedButton
                      variant="secondary"
                      className={`flex-1 ${done ? 'border-emerald-400/30 text-emerald-200' : ''}`}
                      onClick={() => toggleComplete(task.id)}
                    >
                      <CheckCircle2 className="w-4 h-4" /> {done ? 'Completed' : 'Complete'}
                    </ForgedButton>
                  </div>
                </ForgedPanel>
              );
            })}
          </div>
        </section>

        <ForgedPanel className="max-w-4xl">
          <div className="flex items-start gap-3">
            <ListTodo className="w-5 h-5 text-[#D6B36A]/75 mt-0.5" />
            <div>
              <div className="text-[9px] uppercase tracking-[.22em] text-[#D6B36A]/60">PLANNER BRIDGE</div>
              <div className="font-serif text-2xl mt-1">Strategic Planner → AI Visualization</div>
              <p className="mt-2 text-sm leading-7 text-[#EEE8DC]/45">
                A részletes AI tervezés, koncepció-előnézet és végleges vizualizáció a meglévő Planner & Visualizer workspace-ben marad.
              </p>
            </div>
          </div>
        </ForgedPanel>
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
