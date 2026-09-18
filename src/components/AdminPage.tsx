import { useState } from 'react';
import {
  Users, CreditCard, Settings, BarChart3, Shield, Infinity as InfinityIcon,
  Gift, Mail, Save, RefreshCw, RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { PUBLIC_PLANS, CREDIT_PACKAGES, GENERATION_COSTS, formatPrice } from '@/lib/constants';

interface AdminPageProps {
  onNavigate: (page: string) => void;
}

type AdminTab = 'overview' | 'users' | 'plans' | 'credits' | 'gifts' | 'costs';

interface GiftRow {
  id: string;
  email: string;
  gift_type: 'full_unlock' | 'plan';
  plan_id: string | null;
  status: string;
  created_at: string;
  target_user_id: string | null;
}

const publicPlanIds = ['free', 'starter', 'pro', 'business', 'agency', 'ultimate'];

export function AdminPage({ onNavigate }: AdminPageProps) {
  const { t, lang } = useI18n();
  const { isOwner, isAdmin } = useAuth();
  const hu = lang === 'hu';

  const [tab, setTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [catalogPlans, setCatalogPlans] = useState<any[]>(PUBLIC_PLANS);
  const [catalogPackages, setCatalogPackages] = useState<any[]>(CREDIT_PACKAGES);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [editCosts, setEditCosts] = useState(GENERATION_COSTS.map((c) => c.credits));
  const [savedMsg, setSavedMsg] = useState(false);

  const [giftEmail, setGiftEmail] = useState('');
  const [giftType, setGiftType] = useState<'full_unlock' | 'plan'>('full_unlock');
  const [giftPlan, setGiftPlan] = useState('pro');
  const [giftBusy, setGiftBusy] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [gifts, setGifts] = useState<GiftRow[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(false);

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
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100);
    setUsers(data || []);
    setLoadingUsers(false);
  };

  const loadCatalog = async () => {
    setCatalogLoading(true);
    const [{ data: plans }, { data: packages }] = await Promise.all([
      supabase.from('plans').select('*').in('id', publicPlanIds).order('sort_order'),
      supabase.from('credit_packages').select('*').order('sort_order'),
    ]);
    if (plans?.length) setCatalogPlans(plans);
    if (packages?.length) setCatalogPackages(packages);
    setCatalogLoading(false);
  };

  const loadGifts = async () => {
    setLoadingGifts(true);
    const { data } = await supabase
      .from('admin_gifts')
      .select('id,email,gift_type,plan_id,status,created_at,target_user_id')
      .order('created_at', { ascending: false })
      .limit(100);
    setGifts((data || []) as GiftRow[]);
    setLoadingGifts(false);
  };

  const savePlanPrice = async (planId: string, price: number) => {
    const { error } = await supabase.from('plans').update({ price_monthly: Math.max(0, Math.round(price)) }).eq('id', planId);
    if (error) {
      setGiftMessage(hu ? 'Az ár mentése nem sikerült.' : 'Failed to save the plan price.');
      return;
    }
    await supabase.from('admin_audit_log').insert({
      action: 'plan_price_updated',
      target_email: null,
      metadata: { plan_id: planId, price_monthly: Math.max(0, Math.round(price)) },
    });
    setGiftMessage(hu ? 'Előfizetési ár mentve.' : 'Subscription price saved.');
  };

  const savePackagePrice = async (packageId: string, price: number) => {
    const { error } = await supabase.from('credit_packages').update({ price: Math.max(0, Math.round(price)) }).eq('id', packageId);
    if (error) {
      setGiftMessage(hu ? 'A kreditcsomag ára nem menthető.' : 'Failed to save the credit package price.');
      return;
    }
    await supabase.from('admin_audit_log').insert({
      action: 'credit_package_price_updated',
      metadata: { package_id: packageId, price: Math.max(0, Math.round(price)) },
    });
    setGiftMessage(hu ? 'Kreditcsomag ára mentve.' : 'Credit package price saved.');
  };

  const saveCosts = async () => {
    const value = GENERATION_COSTS.reduce<Record<string, number>>((acc, item, i) => {
      acc[item.type] = Math.max(1, editCosts[i] || 1);
      return acc;
    }, {});
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key: 'generation_costs', value, description: 'Credit costs per generation type', updated_at: new Date().toISOString() });
    if (!error) {
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    }
  };

  const grantGift = async () => {
    const email = giftEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setGiftMessage(hu ? 'Adj meg érvényes e-mail címet.' : 'Enter a valid email address.');
      return;
    }

    setGiftBusy(true);
    setGiftMessage('');

    const { data, error } = await supabase.functions.invoke('admin-gift', {
      body: {
        action: 'gift',
        email,
        giftType,
        planId: giftType === 'plan' ? giftPlan : undefined,
      },
    });

    setGiftBusy(false);

    if (error || !data?.success) {
      setGiftMessage(data?.message || error?.message || (hu ? 'Az ajándékozás nem sikerült.' : 'Gift operation failed.'));
      return;
    }

    setGiftMessage(data.message || (hu ? 'Ajándék hozzáférés aktiválva.' : 'Gift access granted.'));
    setGiftEmail('');
    await loadGifts();
  };

  const revokeGift = async (giftId: string) => {
    setGiftBusy(true);
    const { data, error } = await supabase.functions.invoke('admin-gift', {
      body: { action: 'revoke', giftId },
    });
    setGiftBusy(false);

    if (error || !data?.success) {
      setGiftMessage(data?.message || error?.message || (hu ? 'A visszavonás nem sikerült.' : 'Revoke failed.'));
      return;
    }

    setGiftMessage(hu ? 'Ajándék hozzáférés visszavonva.' : 'Gift access revoked.');
    await loadGifts();
    await loadUsers();
  };

  const tabs = [
    { id: 'overview', label: t('admin.overview'), icon: BarChart3 },
    { id: 'users', label: t('admin.users'), icon: Users },
    { id: 'plans', label: hu ? 'Előfizetések és árak' : 'Plans & prices', icon: CreditCard },
    { id: 'credits', label: t('admin.creditPackages'), icon: CreditCard },
    { id: 'gifts', label: hu ? 'Ajándékozás' : 'Gifting', icon: Gift },
    ...(isOwner ? [{ id: 'costs', label: t('admin.genCosts'), icon: Settings }] : []),
  ];

  const planName = (id: string | null) =>
    catalogPlans.find((p) => p.id === id)?.name || id || '—';

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
            onClick={() => {
              setTab(tb.id as AdminTab);
              if (tb.id === 'users') loadUsers();
              if (tb.id === 'plans' || tb.id === 'credits') loadCatalog();
              if (tb.id === 'gifts') loadGifts();
            }}
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
          <AdminStat label={t('admin.activePlans')} value={catalogPlans.length} />
          <AdminStat label={t('admin.creditPkgs')} value={catalogPackages.length} />
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
            <div className="overflow-x-auto">
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
                      <td className="py-3 px-5"><span className="chip text-[10px] border-ink-500/40 text-cream-300/60">{u.role}</span></td>
                      <td className="py-3 px-5 text-cream-200 capitalize">{u.unlimited_access ? 'FULL UNLOCK' : u.plan_id}</td>
                      <td className="py-3 px-5 text-right text-gold-200">{u.role === 'owner' || u.unlimited_access ? '∞' : u.credits}</td>
                      <td className="py-3 px-5 text-right text-cream-300/40 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="card-lux p-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-display font-semibold text-cream-100">{hu ? 'Előfizetési árak' : 'Subscription prices'}</h3>
                <p className="text-xs text-cream-300/50">{hu ? 'A módosítás az adatbázisban tárolódik és az új checkoutok ezt az árat használják.' : 'Prices are stored in the database and new checkouts use the updated amount.'}</p>
              </div>
              <button onClick={loadCatalog} className="btn-ghost text-xs" disabled={catalogLoading}><RefreshCw className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              {catalogPlans.map((p) => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-ink-800/50">
                  <div>
                    <div className="text-sm text-cream-100 font-medium">{p.name}</div>
                    <div className="text-xs text-cream-300/40">{p.credits_monthly} credits/month</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={p.price_monthly}
                      onChange={(e) => setCatalogPlans(prev => prev.map(x => x.id === p.id ? { ...x, price_monthly: Number(e.target.value) } : x))}
                      className="w-28 px-3 py-2 bg-ink-700 border border-ink-600/40 rounded-lg text-cream-100 text-right focus:outline-none focus:border-gold-600/60"
                    />
                    <span className="text-xs text-cream-300/40">Ft</span>
                    <button onClick={() => savePlanPrice(p.id, p.price_monthly)} className="btn-gold text-xs px-3 py-2"><Save className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {giftMessage && <Notice message={giftMessage} />}
        </div>
      )}

      {tab === 'credits' && (
        <div className="space-y-4">
          <div className="card-lux p-4">
            <h3 className="text-lg font-display font-semibold text-cream-100 mb-1">{hu ? 'Kreditcsomagok és árak' : 'Credit packages & prices'}</h3>
            <p className="text-xs text-cream-300/50 mb-4">{hu ? 'Az ár közvetlenül a kreditcsomag adatbázis-rekordját módosítja.' : 'Updates the credit package price in the database.'}</p>
            <div className="space-y-3">
              {catalogPackages.map((p) => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-ink-800/50">
                  <div>
                    <div className="text-sm text-cream-100">{p.label}</div>
                    <div className="text-xs text-cream-300/40">{p.credits} credits</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={p.price}
                      onChange={(e) => setCatalogPackages(prev => prev.map(x => x.id === p.id ? { ...x, price: Number(e.target.value) } : x))}
                      className="w-28 px-3 py-2 bg-ink-700 border border-ink-600/40 rounded-lg text-cream-100 text-right focus:outline-none focus:border-gold-600/60"
                    />
                    <span className="text-xs text-cream-300/40">Ft</span>
                    <button onClick={() => savePackagePrice(p.id, p.price)} className="btn-gold text-xs px-3 py-2"><Save className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {giftMessage && <Notice message={giftMessage} />}
        </div>
      )}

      {tab === 'gifts' && (
        <div className="space-y-5">
          <div className="card-lux p-5">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-gold-600/15 border border-gold-600/20 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <h3 className="text-lg font-display font-semibold text-cream-100">{hu ? 'Csomag ajándékozása' : 'Gift a package'}</h3>
                <p className="text-xs text-cream-300/50">{hu ? 'E-mail cím alapján meglévő felhasználót azonnal felold, új felhasználónak meghívó e-mailt küld.' : 'Existing users are unlocked immediately; new users receive a Supabase invitation email.'}</p>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="text-xs text-cream-300/60">
                E-mail
                <input value={giftEmail} onChange={(e) => setGiftEmail(e.target.value)} type="email" placeholder="user@example.com" className="mt-2 w-full px-3 py-2.5 bg-ink-800 border border-ink-600/40 rounded-lg text-cream-100 focus:outline-none focus:border-gold-600/60" />
              </label>

              <label className="text-xs text-cream-300/60">
                {hu ? 'Ajándék típusa' : 'Gift type'}
                <select value={giftType} onChange={(e) => setGiftType(e.target.value as 'full_unlock' | 'plan')} className="mt-2 w-full px-3 py-2.5 bg-ink-800 border border-ink-600/40 rounded-lg text-cream-100 focus:outline-none focus:border-gold-600/60">
                  <option value="full_unlock">{hu ? 'FULL UNLOCK — minden prémium + korlátlan' : 'FULL UNLOCK — all premium + unlimited'}</option>
                  <option value="plan">{hu ? 'Konkrét előfizetési csomag' : 'Specific subscription plan'}</option>
                </select>
              </label>

              {giftType === 'plan' && (
                <label className="text-xs text-cream-300/60">
                  {hu ? 'Csomag' : 'Plan'}
                  <select value={giftPlan} onChange={(e) => setGiftPlan(e.target.value)} className="mt-2 w-full px-3 py-2.5 bg-ink-800 border border-ink-600/40 rounded-lg text-cream-100 focus:outline-none focus:border-gold-600/60">
                    {catalogPlans.filter((p) => p.id !== 'free').map((p) => <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.price_monthly)}</option>)}
                  </select>
                </label>
              )}

              <button onClick={grantGift} disabled={giftBusy} className="btn-gold w-full sm:w-auto">
                {giftBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {giftBusy ? (hu ? 'Feldolgozás…' : 'Processing…') : (hu ? 'AJÁNDÉK AKTIVÁLÁSA' : 'GRANT GIFT ACCESS')}
              </button>

              {giftMessage && <Notice message={giftMessage} />}
            </div>
          </div>

          <div className="card-lux overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-ink-600/40">
              <div>
                <h3 className="text-sm font-semibold text-cream-100">{hu ? 'Ajándék előzmények' : 'Gift history'}</h3>
                <p className="text-xs text-cream-300/40">Audit trail</p>
              </div>
              <button onClick={loadGifts} className="btn-ghost text-xs"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {loadingGifts ? (
              <div className="p-8 text-center text-sm text-cream-300/50">{t('common.loading')}</div>
            ) : gifts.length === 0 ? (
              <div className="p-8 text-center text-sm text-cream-300/40">{hu ? 'Még nincs ajándék.' : 'No gifts yet.'}</div>
            ) : (
              <div className="divide-y divide-ink-700/40">
                {gifts.map((g) => (
                  <div key={g.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="min-w-0">
                      <div className="text-sm text-cream-100 truncate">{g.email}</div>
                      <div className="text-xs text-cream-300/40">
                        {g.gift_type === 'full_unlock' ? 'FULL UNLOCK' : planName(g.plan_id)}
                        {' · '}{g.status}
                        {' · '}{new Date(g.created_at).toLocaleString()}
                      </div>
                    </div>
                    {g.status === 'active' && (
                      <button onClick={() => revokeGift(g.id)} disabled={giftBusy} className="btn-ghost text-xs text-red-300 border-red-500/20 shrink-0">
                        <RotateCcw className="w-3.5 h-3.5" /> {hu ? 'Visszavonás' : 'Revoke'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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

function Notice({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-gold-600/20 bg-gold-600/5 px-4 py-3 text-xs text-gold-200">
      {message}
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
