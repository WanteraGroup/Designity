import { useState } from 'react';
import { Users, CreditCard, Settings, BarChart3, Shield, Infinity as InfinityIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { PUBLIC_PLANS, CREDIT_PACKAGES, GENERATION_COSTS, formatPrice } from '@/lib/constants';

interface AdminPageProps {
  onNavigate: (page: string) => void;
}

export function AdminPage({ onNavigate }: AdminPageProps) {
  const { t } = useI18n();
  const { isOwner, isAdmin } = useAuth();
  const [tab, setTab] = useState<'overview' | 'users' | 'plans' | 'credits' | 'costs'>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editCosts, setEditCosts] = useState(GENERATION_COSTS.map((c) => c.credits));
  const [savedMsg, setSavedMsg] = useState(false);

  if (!isAdmin) {
    return (
      <div className="card-lux p-12 text-center">
        <Shield className="w-10 h-10 text-red-400/50 mx-auto mb-4" />
        <p className="text-sm text-cream-300/60">{t('admin.noAccessDesc')}</p>
      </div>
    );
  }

  const loadUsers = async () => {
    setLoadingUsers(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50);
    setUsers(data || []);
    setLoadingUsers(false);
  };

  const saveCosts = async () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const tabs = [
    { id: 'overview', label: t('admin.overview'), icon: BarChart3 },
    { id: 'users', label: t('admin.users'), icon: Users },
    { id: 'plans', label: t('admin.plans'), icon: CreditCard },
    { id: 'credits', label: t('admin.creditPackages'), icon: CreditCard },
    ...(isOwner ? [{ id: 'costs', label: t('admin.genCosts'), icon: Settings }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gold-600/15 border border-gold-600/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-gold-400" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-cream-50">{t('admin.title')}</h1>
          <p className="text-xs text-cream-300/50">{t('admin.subtitle')}</p>
        </div>
        {isOwner && (
          <span className="chip border-gold-600/40 bg-gold-600/15 text-gold-300 ml-auto">
            <InfinityIcon className="w-3 h-3" /> OWNER
          </span>
        )}
      </div>

      <div className="flex gap-1 border-b border-ink-600/40 overflow-x-auto">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => { setTab(tb.id as any); if (tb.id === 'users') loadUsers(); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${
              tab === tb.id ? 'text-gold-200 border-gold-400' : 'text-cream-300/50 border-transparent hover:text-cream-200'
            }`}
          >
            <tb.icon className="w-4 h-4" />
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminStat label={t('admin.totalUsers')} value={users.length || '—'} />
          <AdminStat label={t('admin.activePlans')} value={PUBLIC_PLANS.length} />
          <AdminStat label={t('admin.creditPkgs')} value={CREDIT_PACKAGES.length} />
          <AdminStat label={t('admin.designTypes')} value={GENERATION_COSTS.length} />
        </div>
      )}

      {tab === 'users' && (
        <div className="card-lux overflow-hidden">
          {loadingUsers ? (
            <div className="p-8 text-center text-sm text-cream-300/50">{t('admin.loadingUsers')}</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-8 h-8 text-cream-400/30 mx-auto mb-3" />
              <button onClick={loadUsers} className="btn-ghost text-sm">{t('admin.loadUsers')}</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-600/40">
                  <th className="text-left py-3 px-5 text-cream-300/50 font-medium">{t('admin.colUser')}</th>
                  <th className="text-left py-3 px-5 text-cream-300/50 font-medium">{t('admin.colRole')}</th>
                  <th className="text-left py-3 px-5 text-cream-300/50 font-medium">{t('admin.colPlan')}</th>
                  <th className="text-right py-3 px-5 text-cream-300/50 font-medium">{t('admin.colCredits')}</th>
                  <th className="text-right py-3 px-5 text-cream-300/50 font-medium">{t('admin.colJoined')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-ink-700/30 last:border-0">
                    <td className="py-3 px-5 text-cream-100">{u.email}</td>
                    <td className="py-3 px-5">
                      <span className={`chip text-[10px] capitalize ${
                        u.role === 'owner' ? 'border-gold-600/40 bg-gold-600/15 text-gold-300' :
                        u.role === 'admin' ? 'border-blue-500/30 bg-blue-500/10 text-blue-300' :
                        'border-ink-500/40 text-cream-300/60'
                      }`}>{u.role}</span>
                    </td>
                    <td className="py-3 px-5 text-cream-200 capitalize">{u.plan_id}</td>
                    <td className="py-3 px-5 text-right text-gold-200">{u.role === 'owner' ? '∞' : u.credits}</td>
                    <td className="py-3 px-5 text-right text-cream-300/40 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'plans' && (
        <div className="card-lux overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-600/40">
                <th className="text-left py-3 px-5 text-cream-300/50 font-medium">{t('admin.colPlan')}</th>
                <th className="text-right py-3 px-5 text-cream-300/50 font-medium">{t('admin.colPrice')}</th>
                <th className="text-right py-3 px-5 text-cream-300/50 font-medium">{t('credits.creditsCol')}</th>
                <th className="text-right py-3 px-5 text-cream-300/50 font-medium">{t('admin.colProjects')}</th>
              </tr>
            </thead>
            <tbody>
              {PUBLIC_PLANS.map((p) => (
                <tr key={p.id} className="border-b border-ink-700/30 last:border-0">
                  <td className="py-3 px-5 text-cream-100 font-medium">{p.name}</td>
                  <td className="py-3 px-5 text-right text-gold-200">{formatPrice(p.priceMonthly)}</td>
                  <td className="py-3 px-5 text-right text-cream-200">{p.creditsMonthly}</td>
                  <td className="py-3 px-5 text-right text-cream-200">{p.projectLimit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'credits' && (
        <div className="card-lux overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-600/40">
                <th className="text-left py-3 px-5 text-cream-300/50 font-medium">{t('admin.colPkg')}</th>
                <th className="text-right py-3 px-5 text-cream-300/50 font-medium">{t('credits.creditsCol')}</th>
                <th className="text-right py-3 px-5 text-cream-300/50 font-medium">{t('admin.colPrice')}</th>
              </tr>
            </thead>
            <tbody>
              {CREDIT_PACKAGES.map((p) => (
                <tr key={p.id} className="border-b border-ink-700/30 last:border-0">
                  <td className="py-3 px-5 text-cream-100">{p.label}</td>
                  <td className="py-3 px-5 text-right text-gold-200">{p.credits}</td>
                  <td className="py-3 px-5 text-right text-cream-200">{formatPrice(p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'costs' && isOwner && (
        <div className="space-y-4">
          <div className="card-lux p-6">
            <h3 className="text-lg font-display font-semibold text-cream-100 mb-4">{t('admin.genCostsTitle')}</h3>
            <p className="text-xs text-cream-300/50 mb-6">{t('admin.genCostsDesc')}</p>
            <div className="space-y-3">
              {GENERATION_COSTS.map((c, i) => (
                <div key={c.type} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-ink-800/50">
                  <span className="text-sm text-cream-100">{c.label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={editCosts[i]}
                      onChange={(e) => setEditCosts(prev => prev.map((v, j) => j === i ? parseInt(e.target.value) || 1 : v))}
                      className="w-20 px-3 py-1.5 bg-ink-700 border border-ink-600/40 rounded-lg text-cream-100 text-right focus:outline-none focus:border-gold-600/60"
                    />
                    <span className="text-xs text-cream-300/40">{t('misc.creditsShort')}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={saveCosts} className="btn-gold text-sm mt-6">
              {savedMsg ? t('admin.saved') : t('admin.saveChanges')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card-lux p-5">
      <div className="text-xs text-cream-300/50 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-2xl font-display font-bold text-cream-50">{value}</div>
    </div>
  );
}
