import { useMemo, useState } from 'react';
import {
  Box,
  CircleDot,
  Copy,
  Download,
  Gauge,
  Hammer,
  Play,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Wrench,
} from 'lucide-react';

type Operation = 'contour' | 'pocket' | 'drill' | 'engrave';
type Controller = 'generic' | 'grbl' | 'linuxcnc' | 'fanuc' | 'haas';

type Params = {
  stockW: number;
  stockH: number;
  stockT: number;
  shapeW: number;
  shapeH: number;
  depth: number;
  tool: number;
  feed: number;
  plunge: number;
  spindle: number;
  stepDown: number;
  safeZ: number;
  holeSpacingX: number;
  holeSpacingY: number;
};

const defaults: Params = {
  stockW: 120, stockH: 80, stockT: 10, shapeW: 80, shapeH: 50,
  depth: 4, tool: 6, feed: 700, plunge: 250, spindle: 12000,
  stepDown: 1.5, safeZ: 5, holeSpacingX: 50, holeSpacingY: 30,
};

const fmt = (v: number) => Number(v.toFixed(3));
const depths = (depth: number, step: number) => {
  const target = -Math.abs(depth);
  const s = Math.max(0.1, Math.min(Math.abs(depth), Math.abs(step)));
  const out: number[] = [];
  let z = -s;
  while (z > target) { out.push(fmt(z)); z -= s; }
  out.push(fmt(target));
  return out.filter((v, i) => i === 0 || v !== out[i - 1]);
};
const rect = (x: number, y: number, w: number, h: number) => [
  [x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y],
] as number[][];

function buildGcode(operation: Operation, p: Params, controller: Controller) {
  const left = (p.stockW - p.shapeW) / 2;
  const bottom = (p.stockH - p.shapeH) / 2;
  const lines: string[] = [
    '( DESIGNLY CNC CAM )',
    '( Units: mm / absolute coordinates )',
    'G21 G90 G17 G94',
    'G0 Z' + fmt(p.safeZ),
    'M3 S' + Math.round(p.spindle),
  ];
  if (controller === 'grbl') lines.splice(1, 0, '( GRBL profile )');
  if (controller === 'linuxcnc') lines.splice(1, 0, '( LinuxCNC / RS274 profile )');
  if (controller === 'fanuc' || controller === 'haas') lines.splice(1, 0, '( FANUC/HAAS generic ISO profile )');

  const pushRect = (x: number, y: number, w: number, h: number, z: number) => {
    lines.push('G0 X' + fmt(x) + ' Y' + fmt(y));
    lines.push('G1 Z' + fmt(z) + ' F' + Math.round(p.plunge));
    for (const pt of rect(x, y, w, h)) lines.push('G1 X' + fmt(pt[0]) + ' Y' + fmt(pt[1]) + ' F' + Math.round(p.feed));
  };

  if (operation === 'drill') {
    const cx = p.stockW / 2, cy = p.stockH / 2;
    const holes = [
      [cx - p.holeSpacingX / 2, cy - p.holeSpacingY / 2],
      [cx + p.holeSpacingX / 2, cy - p.holeSpacingY / 2],
      [cx + p.holeSpacingX / 2, cy + p.holeSpacingY / 2],
      [cx - p.holeSpacingX / 2, cy + p.holeSpacingY / 2],
    ];
    for (const h of holes) {
      lines.push('G0 X' + fmt(h[0]) + ' Y' + fmt(h[1]));
      lines.push('G1 Z' + fmt(-Math.abs(p.depth)) + ' F' + Math.round(p.plunge));
      lines.push('G0 Z' + fmt(p.safeZ));
    }
  } else if (operation === 'pocket') {
    const r = p.tool / 2;
    for (const z of depths(p.depth, p.stepDown)) {
      let inset = 0;
      while (p.shapeW - r * 2 - inset * 2 > 0 && p.shapeH - r * 2 - inset * 2 > 0) {
        pushRect(left + r + inset, bottom + r + inset, p.shapeW - r * 2 - inset * 2, p.shapeH - r * 2 - inset * 2, z);
        inset += Math.max(0.5, p.tool * 0.45);
      }
    }
  } else {
    const inset = operation === 'contour' ? p.tool / 2 : 0;
    const w = p.shapeW - inset * 2, h = p.shapeH - inset * 2;
    if (w <= 0 || h <= 0) {
      return { lines: ['( ERROR: tool is too large for the selected geometry )'], points: [] as number[][] };
    }
    for (const z of depths(p.depth, p.stepDown)) pushRect(left + inset, bottom + inset, w, h, z);
  }

  lines.push('G0 Z' + fmt(p.safeZ), 'M5', 'G0 X0 Y0', 'M30');

  const points: number[][] = [];
  for (const line of lines) {
    const m = line.match(/^G[01] X(-?\d+(?:\.\d+)?) Y(-?\d+(?:\.\d+)?)/);
    if (m) points.push([Number(m[1]), Number(m[2])]);
  }
  return { lines, points };
}

export function CncCamPage() {
  const [operation, setOperation] = useState<Operation>('pocket');
  const [controller, setController] = useState<Controller>('generic');
  const [params, setParams] = useState<Params>(defaults);
  const [gcode, setGcode] = useState<string[]>([]);
  const [status, setStatus] = useState('Készen áll');
  const [aiPrompt, setAiPrompt] = useState('');

  const result = useMemo(() => buildGcode(operation, params, controller), [operation, params, controller]);
  const shown = gcode.length ? gcode : result.lines;

  const set = (key: keyof Params, value: string) => {
    const n = Number(value);
    setParams((old) => ({ ...old, [key]: Number.isFinite(n) ? n : 0 }));
  };

  const generate = () => {
    setGcode(result.lines);
    setStatus(result.lines[0].startsWith('( ERROR') ? 'Paraméter hiba' : 'G-kód elkészült');
  };

  const reset = () => {
    setParams(defaults); setOperation('pocket'); setController('generic'); setGcode([]); setAiPrompt(''); setStatus('Készen áll');
  };

  const download = () => {
    const blob = new Blob([shown.join('\.') + '\.'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'designly-' + operation + '.nc'; a.click(); URL.revokeObjectURL(url);
    setStatus('NC fájl exportálva');
  };

  const copy = async () => {
    await navigator.clipboard.writeText(shown.join('\.'));
    setStatus('G-kód a vágólapra másolva');
  };

  const interpret = () => {
    const s = aiPrompt.toLowerCase();
    const updates: Partial<Params> = {};
    const pair = s.match(/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)/);
    if (pair) { updates.shapeW = Number(pair[1].replace(',', '.')); updates.shapeH = Number(pair[2].replace(',', '.')); }
    const d = s.match(/(\d+(?:[.,]\d+)?)\s*mm\s*m(?:é|e)ly/);
    if (d) updates.depth = Number(d[1].replace(',', '.'));
    const t = s.match(/(\d+(?:[.,]\d+)?)\s*mm(?:-es)?\s*mar/);
    if (t) updates.tool = Number(t[1].replace(',', '.'));
    if (s.includes('furat') || s.includes('fúr')) setOperation('drill');
    else if (s.includes('zseb')) setOperation('pocket');
    else if (s.includes('kontúr') || s.includes('kivág')) setOperation('contour');
    setParams((old) => ({ ...old, ...updates }));
    setStatus('Helyi AI-paraméterértelmezés lefutott');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-300 text-xs uppercase tracking-[0.22em] mb-2"><Hammer className="w-4 h-4" /> DESIGNLY CNC CAM</div>
          <h1 className="text-3xl font-display font-bold text-cream-50">CNC megmunkálás tervező</h1>
          <p className="text-sm text-cream-300/55 mt-2 max-w-3xl">3 tengelyes CAM MVP: kontúr, zseb, furat és gravírozás → G-kód → NC export.</p>
        </div>
        <div className="flex items-center gap-2"><span className="chip border-gold-600/30 bg-gold-600/10 text-gold-200"><ShieldCheck className="w-3 h-3" /> SIMULATION-FIRST</span><span className="chip border-ink-500/30 text-cream-300/60">{status}</span></div>
      </div>

      <div className="grid xl:grid-cols-[380px_1fr] gap-6">
        <aside className="space-y-4">
          <section className="card-lux p-5 space-y-4">
            <div className="flex items-center gap-2 text-cream-100 font-semibold"><Sparkles className="w-4 h-4 text-gold-400" /> Természetes nyelv</div>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Példa: marj egy 80 x 50 mm-es, 4 mm mély zsebet 6 mm-es maróval" className="w-full min-h-24 px-3 py-3 bg-ink-900 border border-ink-600/40 rounded-xl text-sm text-cream-100 focus:outline-none focus:border-gold-500/50" />
            <button onClick={interpret} className="btn-ghost w-full text-sm"><Sparkles className="w-4 h-4" /> PARAMÉTEREK ÉRTELMEZÉSE</button>
            <p className="text-[11px] text-cream-300/40">Lokális értelmező, külső AI/API nélkül.</p>
          </section>

          <section className="card-lux p-5 space-y-4">
            <div className="flex items-center gap-2 text-cream-100 font-semibold"><Settings2 className="w-4 h-4 text-gold-400" /> Művelet és gép</div>
            <div className="grid grid-cols-2 gap-2">
              {([['pocket','Zseb',Square],['contour','Kontúr',Square],['drill','Furat',CircleDot],['engrave','Gravírozás',Wrench]] as const).map(([id,label,Icon]) => (
                <button key={id} onClick={() => setOperation(id)} className={'p-3 rounded-xl border text-left ' + (operation === id ? 'border-gold-500/50 bg-gold-500/10 text-gold-200' : 'border-ink-600/40 text-cream-300/60 hover:bg-ink-800/60')}><Icon className="w-4 h-4 mb-2" /><span className="text-xs font-semibold">{label}</span></button>
              ))}
            </div>
            <select value={controller} onChange={(e) => setController(e.target.value as Controller)} className="input-lux w-full"><option value="generic">Generic ISO</option><option value="grbl">GRBL</option><option value="linuxcnc">LinuxCNC</option><option value="fanuc">Fanuc</option><option value="haas">Haas</option></select>
          </section>

          <section className="card-lux p-5 space-y-4">
            <div className="flex items-center gap-2 text-cream-100 font-semibold"><Box className="w-4 h-4 text-gold-400" /> Anyag és geometria</div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Anyag X" value={params.stockW} onChange={(v) => set('stockW', v)} />
              <Field label="Anyag Y" value={params.stockH} onChange={(v) => set('stockH', v)} />
              <Field label="Anyag Z" value={params.stockT} onChange={(v) => set('stockT', v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Forma X" value={params.shapeW} onChange={(v) => set('shapeW', v)} />
              <Field label="Forma Y" value={params.shapeH} onChange={(v) => set('shapeH', v)} />
              <Field label="Mélység" value={params.depth} onChange={(v) => set('depth', v)} />
              <Field label="Szerszám Ø" value={params.tool} onChange={(v) => set('tool', v)} />
              {operation === 'drill' && <><Field label="Furat osztás X" value={params.holeSpacingX} onChange={(v) => set('holeSpacingX', v)} /><Field label="Furat osztás Y" value={params.holeSpacingY} onChange={(v) => set('holeSpacingY', v)} /></>}
            </div>
          </section>

          <section className="card-lux p-5 space-y-4">
            <div className="flex items-center gap-2 text-cream-100 font-semibold"><Gauge className="w-4 h-4 text-gold-400" /> Technológia</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="RPM" value={params.spindle} onChange={(v) => set('spindle', v)} />
              <Field label="Előtolás" value={params.feed} onChange={(v) => set('feed', v)} />
              <Field label="Z előtolás" value={params.plunge} onChange={(v) => set('plunge', v)} />
              <Field label="Lépésmélység" value={params.stepDown} onChange={(v) => set('stepDown', v)} />
              <Field label="Biztonsági Z" value={params.safeZ} onChange={(v) => set('safeZ', v)} />
            </div>
            <div className="flex gap-2"><button onClick={generate} className="btn-gold flex-1 text-sm"><Play className="w-4 h-4" /> G-KÓD GENERÁLÁSA</button><button onClick={reset} className="btn-ghost text-sm"><RotateCcw className="w-4 h-4" /></button></div>
          </section>
        </aside>

        <main className="space-y-4">
          <section className="card-lux p-5">
            <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-display font-semibold text-cream-100">Szerszámpálya szimuláció</h2><p className="text-xs text-cream-300/45 mt-1">Paraméteres 2D toolpath előnézet.</p></div><span className="chip border-gold-600/20 text-gold-200">{operation.toUpperCase()}</span></div>
            <div className="aspect-[16/10] rounded-2xl border border-gold-600/15 bg-black/25 overflow-hidden p-4"><ToolpathPreview stockW={params.stockW} stockH={params.stockH} points={result.points} /></div>
          </section>

          <section className="card-lux overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b border-ink-600/40"><div><h2 className="text-lg font-display font-semibold text-cream-100">G-kód</h2><p className="text-xs text-cream-300/45 mt-1">{shown.length} sor · ellenőrizd a gép specifikációját export előtt</p></div><div className="flex gap-2"><button onClick={copy} className="btn-ghost text-xs"><Copy className="w-4 h-4" /> Másolás</button><button onClick={download} className="btn-gold text-xs"><Download className="w-4 h-4" /> .NC EXPORT</button></div></div>
            <pre className="p-4 max-h-[520px] overflow-auto bg-black/30 text-[11px] leading-5 text-cream-200/80 font-mono whitespace-pre">{shown.join('\.')}</pre>
          </section>

          <section className="card-lux p-5"><div className="flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" /><div><h3 className="text-sm font-semibold text-cream-100">Biztonsági ellenőrzés</h3><p className="text-xs text-cream-300/50 mt-1">A modul nem küld G-kódot közvetlenül CNC gépre. Export előtt ellenőrizd a nullpontot, tengelyutakat, szerszámot, fordulatot, előtolást és vezérlő-specifikus kódokat.</p></div></div></section>
        </main>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return <label className="block text-[11px] text-cream-300/55">{label}<input type="number" step="0.1" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full input-lux" /></label>;
}

function ToolpathPreview({ stockW, stockH, points }: { stockW: number; stockH: number; points: number[][] }) {
  const pad = 8;
  const sx = (x: number) => pad + (x / Math.max(1, stockW)) * (100 - pad * 2);
  const sy = (y: number) => 100 - pad - (y / Math.max(1, stockH)) * (100 - pad * 2);
  const ps = points.map(([x,y]) => sx(x) + ',' + sy(y)).join(' ');
  return <svg viewBox="0 0 100 100" className="w-full h-full"><rect x={pad} y={pad} width={100-pad*2} height={100-pad*2} rx="2" fill="none" stroke="currentColor" opacity=".25" />{points.length > 1 && <polyline points={ps} fill="none" stroke="currentColor" strokeWidth=".8" vectorEffect="non-scaling-stroke" />}{points.length > 0 && <circle cx={sx(points[points.length-1][0])} cy={sy(points[points.length-1][1])} r="1.4" fill="currentColor" />}</svg>;
}
