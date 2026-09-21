import { useEffect, useMemo, useState } from 'react';
import { Download, Plus, Minus, RotateCcw, Calculator, FileText } from 'lucide-react';

interface TakeoffItem {
  id: string;
  label: string;
  unit: string;
  per: number;
  base: number;
  price: number;
}

const ELECTRICAL: TakeoffItem[] = [
  { id: 'socket', label: 'Dugalj', unit: 'db', per: 0.06, base: 2, price: 3200 },
  { id: 'switch', label: 'Kapcsolo', unit: 'db', per: 0.02, base: 1, price: 2800 },
  { id: 'light', label: 'Lampatest / pont', unit: 'db', per: 0.07, base: 1, price: 6500 },
  { id: 'dist', label: 'Eloszto / kismegszakito', unit: 'db', per: 0, base: 4, price: 18500 },
  { id: 'cable', label: 'Kabel (3x1,5 / 3x2,5)', unit: 'm', per: 2.4, base: 12, price: 420 },
];

const PLUMBING: TakeoffItem[] = [
  { id: 'tap', label: 'Csaptelep', unit: 'db', per: 0.012, base: 1, price: 22000 },
  { id: 'drain', label: 'Lefolyo', unit: 'db', per: 0.012, base: 1, price: 9500 },
  { id: 'wc', label: 'WC / tartaly', unit: 'db', per: 0.008, base: 1, price: 62000 },
  { id: 'boiler', label: 'Vizmero / elzaro', unit: 'db', per: 0, base: 2, price: 16000 },
  { id: 'pipe', label: 'Csovezetek (viz/lefolyo)', unit: 'm', per: 1.6, base: 10, price: 1800 },
];

const HVAC: TakeoffItem[] = [
  { id: 'radiator', label: 'Radiator', unit: 'db', per: 0.035, base: 1, price: 42000 },
  { id: 'valve', label: 'Szelep / termosztat', unit: 'db', per: 0.035, base: 1, price: 12500 },
  { id: 'hvacpipe', label: 'Futescso (elo/utoviz)', unit: 'm', per: 2.2, base: 14, price: 1450 },
  { id: 'vent', label: 'Szellozo pont', unit: 'db', per: 0.015, base: 1, price: 28000 },
];

const BASE: TakeoffItem[] = [
  { id: 'wall', label: 'Festett falfelulet', unit: 'm2', per: 2.6, base: 0, price: 1600 },
  { id: 'floor', label: 'Padloburk olat', unit: 'm2', per: 1.0, base: 0, price: 8500 },
];

function pickSet(planType: string): { key: string; title: string; items: TakeoffItem[] } {
  if (planType === 'electrical') return { key: 'electrical', title: 'Villamos anyagszukseglet', items: ELECTRICAL };
  if (planType === 'plumbing') return { key: 'plumbing', title: 'Gepeszeti anyagszukseglet', items: PLUMBING };
  if (planType === 'hvac') return { key: 'hvac', title: 'Hotechnikai anyagszukseglet', items: HVAC };
  return { key: 'base', title: 'Altalanos anyagszukseglet', items: BASE };
}

function parseArea(area: string): number {
  const m = String(area).match(/(\d+([.,]\d+)?)/);
  if (!m) return 100;
  return Math.max(1, parseFloat(m[1].replace(',', '.')));
}

function countRooms(rooms: string): number {
  const parts = String(rooms || '').split(/[,;\u00b7\n]/).map((s) => s.trim()).filter(Boolean);
  return Math.max(1, parts.length || 1);
}

export function MaterialTakeoffPanel({ planType, area, rooms }: { planType: string; area: string; rooms: string }) {
  const set = pickSet(planType);
  const areaNum = useMemo(() => parseArea(area), [area]);
  const roomNum = useMemo(() => countRooms(rooms), [rooms]);

  const estimate = (item: TakeoffItem) => {
    if (item.id === 'wall' || item.id === 'floor') return Math.round(areaNum * item.per);
    if (item.unit === 'db') return Math.max(item.base > 0 ? item.base * roomNum : 0, Math.round(areaNum * item.per));
    return Math.max(item.base * roomNum, Math.round(areaNum * item.per));
  };

  const [qty, setQty] = useState<Record<string, number>>({});

  useEffect(() => {
    const next: Record<string, number> = {};
    set.items.forEach((it) => { next[it.id] = estimate(it); });
    setQty(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planType, areaNum, roomNum]);

  const step = (it: TakeoffItem) => (it.unit === 'm' ? 5 : 1);

  const adjust = (it: TakeoffItem, dir: number) => {
    setQty((prev) => ({ ...prev, [it.id]: Math.max(0, (prev[it.id] ?? 0) + dir * step(it)) }));
  };

  const reset = () => {
    const next: Record<string, number> = {};
    set.items.forEach((it) => { next[it.id] = estimate(it); });
    setQty(next);
  };

  const totals = set.items.reduce(
    (acc, it) => {
      const q = qty[it.id] ?? 0;
      acc.cost += q * it.price;
      acc.lines.push({ label: it.label, unit: it.unit, qty: q, price: it.price, sum: q * it.price });
      return acc;
    },
    { cost: 0, lines: [] as Array<{ label: string; unit: string; qty: number; price: number; sum: number }> },
  );

  const fmt = (n: number) => new Intl.NumberFormat('hu-HU').format(Math.round(n));

  const exportCsv = () => {
    const rows = [
      ['Terv', set.title],
      ['Terulet', areaNum + ' m2'],
      ['Helyisegek', String(roomNum)],
      [],
      ['Megnevezes', 'Mennyiseg', 'Egyseg', 'Egysegar (Ft)', 'Osszeg (Ft)'],
      ...totals.lines.map((l) => [l.label, String(l.qty), l.unit, String(l.price), String(Math.round(l.sum))]),
      [],
      ['Becsult osszkoltseg', '', '', '', String(Math.round(totals.cost))],
    ];
    const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'designly-anyagszamitas.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="card-lux p-5 lg:p-7 border-gold-500/20">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-gold-300 text-[10px] uppercase tracking-[.22em]">
            <Calculator className="w-4 h-4" /> ANYAGSZUKSEGLET
          </div>
          <h2 className="text-xl lg:text-2xl font-display text-cream-50 mt-1">{set.title}</h2>
          <p className="mt-2 text-xs leading-6 text-cream-200/50">
            A becsles a {areaNum} m2 terulet es a {roomNum} helyiseg alapjan keszult.
            A darabszamokat barmikor atirhatod - az ar es a vegosszeg azonnal koveti.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={reset} className="btn-ghost text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> Visszaallitas
          </button>
          <button type="button" onClick={exportCsv} className="btn-gold text-xs">
            <Download className="w-3.5 h-3.5" /> CSV EXPORT
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold-600/20 text-left text-[10px] uppercase tracking-[.16em] text-cream-300/50">
              <th className="py-3 pr-3">Megnevezes</th>
              <th className="py-3 px-3 w-[210px]">Mennyiseg</th>
              <th className="py-3 px-3 text-right">Egysegar</th>
              <th className="py-3 pl-3 text-right">Osszeg</th>
            </tr>
          </thead>
          <tbody>
            {set.items.map((it) => {
              const q = qty[it.id] ?? 0;
              return (
                <tr key={it.id} className="border-b border-white/5">
                  <td className="py-3 pr-3 text-cream-100">{it.label}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => adjust(it, -1)} className="w-7 h-7 grid place-items-center rounded-md border border-gold-600/25 text-gold-200 hover:bg-gold-600/10" aria-label="Kevesebb">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        value={q}
                        onChange={(e) => setQty((prev) => ({ ...prev, [it.id]: Math.max(0, Number(e.target.value) || 0) }))}
                        className="w-20 bg-[#071311]/75 border border-[#263636] rounded-md px-2 py-1.5 text-center text-xs text-[#E3FFFB] outline-none focus:border-gold-500/40"
                      />
                      <span className="text-[11px] text-cream-300/50 w-6">{it.unit}</span>
                      <button type="button" onClick={() => adjust(it, 1)} className="w-7 h-7 grid place-items-center rounded-md border border-gold-600/25 text-gold-200 hover:bg-gold-600/10" aria-label="Tobb">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-cream-300/60 text-xs">{fmt(it.price)} Ft</td>
                  <td className="py-3 pl-3 text-right text-gold-200">{fmt(q * it.price)} Ft</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-gold-500/25 bg-gold-600/5 px-5 py-4">
        <div className="flex items-center gap-2 text-cream-100">
          <FileText className="w-4 h-4 text-gold-300" />
          <span className="text-sm">Becsult anyagkoltseg</span>
        </div>
        <div className="text-2xl font-display text-gold-200">{fmt(totals.cost)} Ft</div>
      </div>

      <p className="mt-3 text-[10px] leading-5 text-cream-300/40">
        Az arak becsult atlagarak, tajekoztato jelleggel. A vegleges mennyiseg es koltseg
        a helyszini felmeres es a kivitelezesi tervek alapjan pontosithato.
      </p>
    </section>
  );
}

export default MaterialTakeoffPanel;
