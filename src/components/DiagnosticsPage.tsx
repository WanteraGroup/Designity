import { useState } from 'react';
import { CheckCircle2, CircleAlert, Loader2, Play, ShieldCheck, Store, UserRound, Wrench, Bot } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { askHuginn } from '@/lib/huginn-agent';
import { buildGcode } from './CncCamPage';

type TestState = 'idle' | 'running' | 'pass' | 'fail';
type Row = { key: string; label: string; detail: string; state: TestState };

const initialRows: Row[] = [
  { key: 'profile', label: 'Owner / profil', detail: 'Profil és jogosultság betöltése', state: 'idle' },
  { key: 'catalog', label: 'Kreditkatalógus', detail: 'Csomagok és előfizetések olvashatók', state: 'idle' },
  { key: 'cnc', label: 'CNC CAM', detail: 'G-kód és paramétervalidáció helyben', state: 'idle' },
  { key: 'shopify', label: 'Shopify Studio', detail: 'Shop és termékkatalógus kapcsolat', state: 'idle' },
  { key: 'huginn', label: 'HUGINN AI', detail: 'Szerveroldali AI agent elérés', state: 'idle' },
];

export function DiagnosticsPage() {
  const { profile, isAdmin, isOwner } = useAuth();
  const [rows, setRows] = useState(initialRows);
  const [running, setRunning] = useState(false);

  const setRow = (key: string, state: TestState, detail?: string) => {
    setRows((current) => current.map((row) => row.key === key ? { ...row, state, detail: detail || row.detail } : row));
  };

  const runTests = async () => {
    if (!isAdmin) return;
    setRunning(true);
    setRows(initialRows.map((row) => ({ ...row, state: 'running' })));

    const profileOk = Boolean(profile?.role === 'owner' || profile?.role === 'admin');
    setRow('profile', profileOk ? 'pass' : 'fail', profileOk ? `Szerepkör: ${profile?.role}; kredit: ${profile?.credits?.toLocaleString('hu-HU')}` : 'Admin/owner jogosultság nem található.');

    const [{ data: packages, error: packageError }, { data: plans, error: planError }] = await Promise.all([
      supabase.from('credit_packages').select('id,credits,price').limit(20),
      supabase.from('plans').select('id,price_monthly').limit(20),
    ]);
    const catalogOk = !packageError && !planError && Boolean(packages?.length) && Boolean(plans?.length);
    setRow('catalog', catalogOk ? 'pass' : 'fail', catalogOk ? `${packages?.length || 0} kreditcsomag, ${plans?.length || 0} terv` : (packageError?.message || planError?.message || 'Katalógus lekérdezési hiba.'));

    const validParams = {
      stockW: 120, stockH: 80, stockT: 10, shapeW: 80, shapeH: 50, depth: 4,
      tool: 6, feed: 700, plunge: 250, spindle: 12000, stepDown: 1.5, safeZ: 5,
      holeSpacingX: 50, holeSpacingY: 30,
    };
    const cnc = buildGcode('pocket', validParams, 'generic');
    const cncBad = buildGcode('pocket', { ...validParams, depth: 20 }, 'generic');
    const cncOk = cnc.lines.length > 10 && cnc.lines.some((line) => line.startsWith('G1 Z-4')) && cncBad.lines[0].startsWith('( ERROR');
    setRow('cnc', cncOk ? 'pass' : 'fail', cncOk ? `${cnc.lines.length} G-kód sor + mélységhatár teszt OK` : 'CNC generátor/validáció teszt sikertelen.');

    try {
      const { data, error } = await supabase.functions.invoke('shopify-studio', { body: { action: 'list' } });
      const shopOk = !error && !data?.error && Boolean(data?.shop?.domain);
      setRow('shopify', shopOk ? 'pass' : 'fail', shopOk ? `${data.shop.name} · ${data.shop.domain} · ${data.products?.length || 0} termék` : (data?.message || error?.message || 'Shopify kapcsolat sikertelen.'));
    } catch (error) {
      setRow('shopify', 'fail', error instanceof Error ? error.message : 'Shopify kapcsolat sikertelen.');
    }

    try {
      const result = await askHuginn('Mondd röviden: HUGINN teszt sikeres?', 'hu');
      setRow('huginn', result.ok && Boolean(result.reply) ? 'pass' : 'fail', result.ok ? 'AI válasz érkezett.' : (result.error || 'HUGINN nem válaszolt.'));
    } catch {
      setRow('huginn', 'fail', 'HUGINN hálózati teszt sikertelen.');
    }

    setRunning(false);
  };

  const passed = rows.filter((row) => row.state === 'pass').length;
  const failed = rows.filter((row) => row.state === 'fail').length;

  if (!isAdmin) {
    return <div className="card-lux p-10 text-center text-sm text-red-200">A QA Center csak admin/owner számára érhető el.</div>;
  }

  return (
    <div className="space-y-6">
      <section className="card-lux p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-gold-300 text-[10px] uppercase tracking-[.28em]"><ShieldCheck className="w-4 h-4" /> DESIGNLY QA CENTER</div>
            <h1 className="mt-2 text-3xl font-display font-bold text-cream-50">Rendszerellenőrzés</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-cream-300/55">Egy gombbal ellenőrizhető az owner profil, kreditkatalógus, CNC CAM, Shopify és HUGINN kapcsolat. A teszt nem hoz létre Shopify terméket és nem módosít kreditet.</p>
          </div>
          <button onClick={() => void runTests()} disabled={running} className="btn-gold text-sm">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} {running ? 'TESZTELÉS…' : 'ÖSSZES TESZT FUTTATÁSA'}
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="chip border-gold-500/20 bg-gold-500/5 text-gold-200">Owner: {isOwner ? 'IGEN' : 'NEM'}</span>
          <span className="chip border-gold-500/20 bg-gold-500/5 text-gold-200">Sikeres: {passed}</span>
          <span className="chip border-red-500/20 bg-red-500/5 text-red-200">Hibás: {failed}</span>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => {
          const Icon = row.key === 'shopify' ? Store : row.key === 'cnc' ? Wrench : row.key === 'huginn' ? Bot : row.key === 'profile' ? UserRound : ShieldCheck;
          return (
            <article key={row.key} className="card-lux p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-gold-500/15 bg-gold-500/5 text-gold-300"><Icon className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-cream-100">{row.label}</h2>
                    {row.state === 'running' && <Loader2 className="w-4 h-4 animate-spin text-gold-300" />}
                    {row.state === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
                    {row.state === 'fail' && <CircleAlert className="w-4 h-4 text-red-300" />}
                  </div>
                  <p className="mt-2 text-xs leading-6 text-cream-300/50">{row.detail}</p>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
