import { useEffect, useMemo, useState } from 'react';
import { KeyRound, Shield, UserCog, Users, Plus, Settings2 } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface AdminProps {
  onNavigate: (page: string) => void;
}

export default function Admin({ onNavigate }: AdminProps) {
  const { isAdmin, isOwner } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roleName, setRoleName] = useState('');
  const [savedRole, setSavedRole] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('profiles').select('id,email,role,plan_id,unlimited_access').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => setUsers(data || []));
  }, [isAdmin]);

  const roles = useMemo(() => {
    const discovered = users.map((user) => user.role).filter(Boolean);
    return Array.from(new Set(['Owner', 'Admin', 'Editor', 'Viewer', ...discovered]));
  }, [users]);

  const saveRoleDraft = () => {
    if (!roleName.trim()) return;
    localStorage.setItem('designly_role_draft', JSON.stringify({
      name: roleName.trim(),
      savedAt: new Date().toISOString(),
    }));
    setSavedRole(true);
    window.setTimeout(() => setSavedRole(false), 2000);
    setRoleName('');
  };

  if (!isAdmin) {
    return (
      <div className="relative min-h-screen bg-[#020505] text-[#E3FFFB] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-[0.24]" style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }} aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020505]/35 to-[#020505]/95" aria-hidden="true" />
        <NordicHeader title="ADMIN — CONTROL HALL" />
        <main className="relative z-10 p-8">
          <ForgedPanel className="max-w-2xl mx-auto p-12 text-center">
            <Shield className="w-10 h-10 mx-auto mb-4 text-red-300/60" />
            <div className="font-serif text-3xl">Access Restricted</div>
            <p className="mt-3 text-sm text-[#EEE8DC]/45">Admin jogosultság szükséges a Control Hall megnyitásához.</p>
          </ForgedPanel>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#020505] text-[#E3FFFB] overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center opacity-[0.24]" style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }} aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020505]/35 to-[#020505]/95" aria-hidden="true" />

      <NordicHeader title="ADMIN — CONTROL HALL" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">
                <Shield className="w-4 h-4" /> CONTROL COMMAND
              </div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Administration Hall</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
                Felhasználók, szerepkörök és a teljes adminisztrációs vezérlőközpont egyetlen DESIGNLY felületen.
              </p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Metric icon={Users} label="Users" value={String(users.length || '—')} />
            <Metric icon={UserCog} label="Roles" value={String(roles.length)} />
            <Metric icon={Shield} label="Access" value={isOwner ? 'OWNER' : 'ADMIN'} />
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-[.28em] text-[#9CEEE5]/60">USER COMMAND</div>
              <h2 className="mt-2 font-serif text-3xl">Users</h2>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('admin-workspace')}>
              <Settings2 className="w-4 h-4" /> Open Admin Console
            </ForgedButton>
          </div>

          <ForgedPanel>
            <div className="space-y-3">
              {users.length === 0 ? (
                <div className="text-sm text-[#EEE8DC]/40">Felhasználók betöltése…</div>
              ) : (
                users.slice(0, 8).map((user) => (
                  <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#263636] bg-black/15 px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-sm text-[#EEE8DC] truncate">{user.email || '—'}</div>
                      <div className="text-[10px] text-[#EEE8DC]/40 mt-1">
                        {user.role || 'viewer'} · {user.unlimited_access ? 'FULL UNLOCK' : user.plan_id || '—'}
                      </div>
                    </div>
                    <span className="chip border-[#D6B36A]/20 text-[#F5DFA3]">{user.role || 'viewer'}</span>
                  </div>
                ))
              )}
            </div>
          </ForgedPanel>
        </section>

        <section>
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#9CEEE5]/60">ROLE FORGE</div>
            <h2 className="mt-2 font-serif text-3xl">Roles</h2>
          </div>

          <ForgedPanel className="max-w-4xl">
            <div className="flex items-center gap-3 mb-5">
              <KeyRound className="w-5 h-5 text-[#D6B36A]/75" />
              <div className="font-serif text-2xl">Create Role</div>
            </div>

            <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
              <label className="space-y-1 block text-xs">
                <span className="text-[#EEE8DC]/70">Role Name</span>
                <input
                  value={roleName}
                  onChange={(event) => setRoleName(event.target.value)}
                  className="w-full bg-[#071311]/75 border border-[#263636] rounded-[10px] px-3 py-2.5 text-xs text-[#E3FFFB] placeholder:text-[#EEE8DC]/35 outline-none focus:border-[#9CEEE5]/40"
                  placeholder="Admin / Editor / Viewer"
                />
              </label>
              <ForgedButton variant="primary" onClick={saveRoleDraft} disabled={!roleName.trim()}>
                <Plus className="w-4 h-4" /> {savedRole ? 'Saved' : 'Create Role'}
              </ForgedButton>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {roles.map((role) => (
                <span key={role} className="chip border-[#263636] text-[#EEE8DC]/60">{role}</span>
              ))}
            </div>

            <p className="mt-4 text-[11px] text-[#EEE8DC]/35">
              A jelenlegi adatmodellben nincs külön szerepkör-létrehozási tábla, ezért a Role Forge itt biztonságos draftként ment; a tényleges jogosultságkezelés a meglévő Admin Console-ban történik.
            </p>
          </ForgedPanel>
        </section>

        <ForgedPanel className="max-w-4xl">
          <div className="flex items-start gap-3">
            <Settings2 className="w-5 h-5 text-[#D6B36A]/75 mt-0.5" />
            <div>
              <div className="text-[9px] uppercase tracking-[.22em] text-[#D6B36A]/60">ADMINISTRATION BRIDGE</div>
              <div className="font-serif text-2xl mt-1">Control Hall → Admin Console</div>
              <p className="mt-2 text-sm leading-7 text-[#EEE8DC]/45">
                A részletes user management, csomag- és árkezelés, credit package, gifting és owner generation-cost vezérlés az eredeti Admin Console-ban maradt meg.
              </p>
              <div className="mt-4">
                <ForgedButton variant="secondary" onClick={() => onNavigate('admin-workspace')}>
                  Open Full Admin Console
                </ForgedButton>
              </div>
            </div>
          </div>
        </ForgedPanel>
      </main>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <ForgedPanel>
      <Icon className="w-5 h-5 mb-3 text-[#D6B36A]/75" />
      <div className="text-xs text-[#EEE8DC]/55">{label}</div>
      <div className="font-serif text-4xl mt-2">{value}</div>
    </ForgedPanel>
  );
}
