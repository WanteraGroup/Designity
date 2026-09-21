import { useMemo, useState } from 'react';
import {
  Box, CircleDot, Copy, Download, Gauge, Hammer, Play, RotateCcw,
  Settings2, ShieldCheck, Sparkles, Square, Wrench, Layers, FileText, Ruler, AlertTriangle,
} from 'lucide-react';

type Operation = 'contour' | 'pocket' | 'drill' | 'engrave' | 'slot' | 'face' | 'chamfer' | 'thread';
type Controller = 'generic' | 'grbl' | 'linuxcnc' | 'fanuc' | 'haas' | 'siemens' | 'mach3';
type Material = 'alu' | 'steel' | 'wood' | 'plastic';

type Params = {
  stockW: number; stockH: number; stockT: number;
  shapeW: number; shapeH: number;
  depth: number; tool: number;
  feed: number; plunge: number; spindle: number; stepDown: number;
  safeZ: number; holeSpacingX: number; holeSpacingY: number;
  holesX: number; holesY: number;
  slotWidth: number; chamfer: number; pitch: number;
  coolant: boolean;
};

const defaults: Params = {
  stockW: 120, stockH: 80, stockT: 10, shapeW: 80, shapeH: 50,
  depth: 4, tool: 6, feed: 700, plunge: 250, spindle: 12000,
  stepDown: 1.5, safeZ: 5, holeSpacingX: 50, holeSpacingY: 30,
  holesX: 2, holesY: 2, slotWidth: 8, chamfer: 1, pitch: 1.25, coolant: false,
};

const MATERIALS: Record<Material, { label: string; feed: number; plunge: number; spindle: number; stepDown: number; chip: string }> = {
  alu: { label: 'Aluminium', feed: 900, plunge: 250, spindle: 14000, stepDown: 2, chip: 'Forgacsolo olaj / spray' },
  steel: { label: 'Acel', feed: 380, plunge: 90, spindle: 4200, stepDown: 0.8, chip: 'Hutoemulzio kotelezo' },
  wood: { label: 'Fa / MDF', feed: 2200, plunge: 700, spindle: 18000, stepDown: 3, chip: 'Elszivas erosen ajanlott' },
  plastic: { label: 'Muanyag', feed: 1400, plunge: 350, spindle: 16000, stepDown: 1.5, chip: 'Leveghutes eleg' },
};

const CONTROLLERS: { id: Controller; label: string; note: string }[] = [
  { id: 'generic', label: 'Generic ISO', note: 'Altalanos ISO G-kod' },
  { id: 'grbl', label: 'GRBL', note: 'Hobby / desktop router' },
  { id: 'linuxcnc', label: 'LinuxCNC', note: 'RS274 szabvany' },
  { id: 'mach3', label: 'Mach3', note: 'PC-alapu vezerles' },
  { id: 'fanuc', label: 'Fanuc', note: 'Ipari ISO profil' },
  { id: 'haas', label: 'Haas', note: 'Haas vezerlo' },
  { id: 'siemens', label: 'Siemens 840D', note: 'Siemens dialektus' },
];

const OPERATIONS: { id: Operation; label: string; icon: typeof Square; desc: string }[] = [
  { id: 'pocket', label: 'Zseb', icon: Square, desc: 'Belso anyagkiforgacsolas retegekben' },
  { id: 'contour', label: 'Kontur', icon: Square, desc: 'Kulso/belso korvonal kivagas' },
  { id: 'drill', label: 'Furat', icon: CircleDot, desc: 'Furatkiosztas raszterben' },
  { id: 'engrave', label: 'Gravírozas', icon: Wrench, desc: 'Sekely vesett vonal' },
  { id: 'slot', label: 'Horony', icon: Layers, desc: 'Egyenes horony maras' },
  { id: 'face', label: 'Sikolas', icon: Ruler, desc: 'Felület simitasa savokban' },
  { id: 'chamfer', label: 'Letores', icon: Box, desc: 'El letorese ferde haladassal' },
  { id: 'thread', label: 'Menetfuras', icon: CircleDot, desc: 'Menetfuro ciklus' },
];

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

const rect = (x: number, y: number, w: number, h: number) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]] as number[][];

export function buildGcode(operation: Operation, p: Params, controller: Controller) {
  const invalid = [
    p.stockW <= 0 ? 'Anyag X merete legyen pozitiv.' : '',
    p.stockH <= 0 ? 'Anyag Y merete legyen pozitiv.' : '',
    p.stockT <= 0 ? 'Anyag Z vastagsaga legyen pozitiv.' : '',
    p.shapeW <= 0 ? 'Forma X merete legyen pozitiv.' : '',
    p.shapeH <= 0 ? 'Forma Y merete legyen pozitiv.' : '',
    p.shapeW > p.stockW ? 'A forma X merete nagyobb az anyagnal.' : '',
    p.shapeH > p.stockH ? 'A forma Y merete nagyobb az anyagnal.' : '',
    Math.abs(p.depth) <= 0 ? 'A megmunkalasi melyseg legyen nagyobb 0 mm-nel.' : '',
    Math.abs(p.depth) > p.stockT ? 'A megmunkalasi melyseg nem lehet nagyobb az anyag vastagsaganal.' : '',
    p.tool <= 0 ? 'A szerszamatmérő legyen pozitiv.' : '',
    p.feed <= 0 || p.plunge <= 0 || p.spindle <= 0 ? 'Az elotolas, Z-elotolas es fordulatszam legyen pozitiv.' : '',
    p.safeZ <= 0 ? 'A biztonsagi Z legyen pozitiv.' : '',
    p.stepDown <= 0 ? 'A lepesmelyseg legyen pozitiv.' : '',
  ].filter(Boolean);
  if (operation === 'contour' && (p.shapeW <= p.tool || p.shapeH <= p.tool)) invalid.push('Konturnal a szerszam nem lehet nagyobb a forma belso meretenel.');
  if (operation === 'slot' && (p.slotWidth <= 0 || p.slotWidth > p.stockW)) invalid.push('A horony szelessege ervenytelen.');
  if (operation === 'chamfer' && (p.chamfer <= 0 || p.chamfer > p.tool)) invalid.push('A letorez merete ervenytelen.');
  if ((operation === 'drill' || operation === 'thread') && (Math.abs(p.holeSpacingX) > p.stockW || Math.abs(p.holeSpacingY) > p.stockH)) invalid.push('A furatkiosztas nem fer el az anyagban.');
  if (invalid.length) return { lines: ['( ERROR: ' + invalid.join(' | ') + ' )'], points: [] as number[][] };

  const left = (p.stockW - p.shapeW) / 2;
  const bottom = (p.stockH - p.shapeH) / 2;
  const lines: string[] = [
    '%',
    '( DESIGNLY CNC CAM )',
    '( Part: ' + p.shapeW + ' x ' + p.shapeH + ' mm, depth ' + p.depth + ' mm )',
    '( Tool: D' + p.tool + ' mm, S' + Math.round(p.spindle) + ' rpm )',
    '( Units: mm / absolute coordinates )',
    'G21 G90 G17 G94',
    'G0 Z' + fmt(p.safeZ),
    'M3 S' + Math.round(p.spindle),
  ];
  if (p.coolant) lines.push('M8');
  const tag = CONTROLLERS.find((c) => c.id === controller);
  if (tag && controller !== 'generic') lines.splice(1, 0, '( ' + tag.label + ' profile )');

  const pushRect = (x: number, y: number, w: number, h: number, z: number) => {
    lines.push('( depth ' + z + ' mm )');
    lines.push('G0 X' + fmt(x) + ' Y' + fmt(y));
    lines.push('G1 Z' + fmt(z) + ' F' + Math.round(p.plunge));
    for (const pt of rect(x, y, w, h)) lines.push('G1 X' + fmt(pt[0]) + ' Y' + fmt(pt[1]) + ' F' + Math.round(p.feed));
  };

  if (operation === 'drill' || operation === 'thread') {
    const cx = p.stockW / 2, cy = p.stockH / 2;
    const nx = Math.max(1, Math.round(p.holesX)), ny = Math.max(1, Math.round(p.holesY));
    const spanX = p.holeSpacingX * (nx - 1), spanY = p.holeSpacingY * (ny - 1);
    let n = 0;
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        const hx = cx - spanX / 2 + ix * p.holeSpacingX;
        const hy = cy - spanY / 2 + iy * p.holeSpacingY;
        n++;
        lines.push('( hole ' + n + ' )');
        lines.push('G0 X' + fmt(hx) + ' Y' + fmt(hy));
        if (operation === 'thread') {
          lines.push('G84 Z' + fmt(-Math.abs(p.depth)) + ' R' + fmt(p.safeZ) + ' F' + fmt(p.pitch * Math.round(p.spindle)) + ' P0');
        } else {
          for (const z of depths(p.depth, p.stepDown)) {
            lines.push('G1 Z' + fmt(z) + ' F' + Math.round(p.plunge));
          }
        }
        lines.push('G0 Z' + fmt(p.safeZ));
      }
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
  } else if (operation === 'face') {
    const step = Math.max(0.5, p.tool * 0.7);
    for (const z of depths(p.depth, p.stepDown)) {
      let y = 0;
      let dir = 1;
      lines.push('( face pass Z' + z + ' )');
      while (y <= p.stockH) {
        const x0 = dir > 0 ? 0 : p.stockW;
        const x1 = dir > 0 ? p.stockW : 0;
        lines.push('G0 X' + fmt(x0) + ' Y' + fmt(y));
        lines.push('G1 Z' + fmt(z) + ' F' + Math.round(p.plunge));
        lines.push('G1 X' + fmt(x1) + ' Y' + fmt(y) + ' F' + Math.round(p.feed));
        y += step; dir = -dir;
      }
    }
  } else if (operation === 'slot') {
    const y = p.stockH / 2;
    for (const z of depths(p.depth, p.stepDown)) {
      lines.push('( slot Z' + z + ' )');
      lines.push('G0 X' + fmt(0) + ' Y' + fmt(y));
      lines.push('G1 Z' + fmt(z) + ' F' + Math.round(p.plunge));
      lines.push('G1 X' + fmt(p.stockW) + ' F' + Math.round(p.feed));
      lines.push('G0 Z' + fmt(p.safeZ));
    }
  } else if (operation === 'chamfer') {
    const r = p.tool / 2;
    const z = -Math.abs(p.chamfer);
    lines.push('( chamfer ' + p.chamfer + ' mm )');
    const inset = Math.max(0, r - Math.abs(p.chamfer));
    pushRect(left + inset, bottom + inset, p.shapeW - inset * 2, p.shapeH - inset * 2, z);
  } else {
    const inset = operation === 'contour' ? p.tool / 2 : operation === 'engrave' ? 0.2 : 0;
    const w = p.shapeW - inset * 2, h = p.shapeH - inset * 2;
    if (w <= 0 || h <= 0) return { lines: ['( ERROR: a szerszam tul nagy a kivalasztott geometriahoz )'], points: [] as number[][] };
    for (const z of depths(p.depth, p.stepDown)) pushRect(left + inset, bottom + inset, w, h, z);
  }

  if (p.coolant) lines.push('M9');
  lines.push('G0 Z' + fmt(p.safeZ), 'M5', 'G0 X0 Y0', 'M30', '%');

  const points: number[][] = [];
  for (const line of lines) {
    const m = line.match(/^G[01] X(-?\d+(?:\.\d+)?) Y(-?\d+(?:\.\d+)?)/);
    if (m) points.push([Number(m[1]), Number(m[2])]);
  }
  return { lines, points };
}

export function estimateCycle(lines: string[], p: Params) {
  let cut = 0, rapid = 0;
  let x = 0, y = 0, z = p.safeZ;
  for (const line of lines) {
    const g1 = line.match(/^G1 X(-?\d+(?:\.\d+)?) Y(-?\d+(?:\.\d+)?)/);
    const g0 = line.match(/^G0 X(-?\d+(?:\.\d+)?) Y(-?\d+(?:\.\d+)?)/);
    const z1 = line.match(/^G1 Z(-?[\d.]+)/);
    const z0 = line.match(/^G0 Z(-?[\d.]+)/);
    if (g1) { const nx = Number(g1[1]), ny = Number(g1[2]); cut += Math.hypot(nx - x, ny - y); x = nx; y = ny; }
    if (g0) { const nx = Number(g0[1]), ny = Number(g0[2]); rapid += Math.hypot(nx - x, ny - y); x = nx; y = ny; }
    if (z1) z = Number(z1[1]);
    if (z0) z = Number(z0[1]);
  }
  const zTravel = lines.reduce((n, l) => n + (/^G[01] Z/.test(l) ? Math.abs(Number((l.match(/Z(-?[\d.]+)/) || [0])[1] || 0) - Math.abs(z)) * 0 : 0), 0);
  const feedTime = cut / Math.max(1, p.feed) * 60;
  const rapidTime = rapid / 5000 * 60;
  const plungeCount = lines.filter((l) => /^G1 Z/.test(l)).length;
  const plungeTime = plungeCount * (Math.abs(p.depth) / Math.max(1, p.plunge) * 60) + zTravel;
  return {
    cutLength: Math.round(cut),
    rapidLength: Math.round(rapid),
    minutes: Math.max(1, Math.round(feedTime + rapidTime + plungeTime)),
  };
}

export function CncCamPage() {
  const [operation, setOperation] = useState<Operation>('pocket');
  const [controller, setController] = useState<Controller>('generic');
  const [material, setMaterial] = useState<Material>('alu');
  const [params, setParams] = useState<Params>(defaults);
  const [gcode, setGcode] = useState<string[]>([]);
  const [status, setStatus] = useState('Keszen all');
  const [aiPrompt, setAiPrompt] = useState('');

  const result = useMemo(() => buildGcode(operation, params, controller), [operation, params, controller]);
  const shown = gcode.length ? gcode : result.lines;
  const cycle = useMemo(() => estimateCycle(shown, params), [shown, params]);

  const set = (key: keyof Params, value: string) => {
    const n = Number(value);
    setParams((old) => ({ ...old, [key]: Number.isFinite(n) ? n : 0 }));
  };

  const applyMaterial = (m: Material) => {
    setMaterial(m);
    const tech = MATERIALS[m];
    setParams((old) => ({ ...old, feed: tech.feed, plunge: tech.plunge, spindle: tech.spindle, stepDown: tech.stepDown }));
    setStatus('Anyagprofil betoltve: ' + tech.label);
  };

  const generate = () => {
    setGcode(result.lines);
    setStatus(result.lines[0].startsWith('( ERROR') ? 'Parameter hiba - export tiltva' : 'G-kod elkeszult');
  };

  const reset = () => {
    setParams(defaults); setOperation('pocket'); setController('generic'); setMaterial('alu');
    setGcode([]); setAiPrompt(''); setStatus('Keszen all');
  };

  const download = () => {
    const blob = new Blob([shown.join('\n') + '\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'designly-' + operation + '.nc'; a.click(); URL.revokeObjectURL(url);
    setStatus('NC fajl exportalva');
  };

  const downloadSetup = () => {
    const payload = {
      product: 'DESIGNLY CNC CAM',
      operation, controller, material,
      params, cycle,
      safety: 'NC export elott ellenorizd a nullpontot, tengelyutakat, szerszamot es vezerlo-specifikus kodokat.',
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'designly-cnc-setup.json'; a.click(); URL.revokeObjectURL(url);
    setStatus('Beallitas exportalva');
  };

  const copy = async () => {
    await navigator.clipboard.writeText(shown.join('\n'));
    setStatus('G-kod a vagolapra masolva');
  };

  const interpret = () => {
    const s = aiPrompt.toLowerCase();
    const updates: Partial<Params> = {};
    const pair = s.match(/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)/);
    if (pair) { updates.shapeW = Number(pair[1].replace(',', '.')); updates.shapeH = Number(pair[2].replace(',', '.')); }
    const d = s.match(/(\d+(?:[.,]\d+)?)\s*mm\s*m(?:e|é)ly/);
    if (d) updates.depth = Number(d[1].replace(',', '.'));
    const t = s.match(/(\d+(?:[.,]\d+)?)\s*mm(?:-es)?\s*mar/);
    if (t) updates.tool = Number(t[1].replace(',', '.'));
    const c = s.match(/(\d+)\s*furat/);
    if (c) { const n = Number(c[1]); updates.holesX = n; updates.holesY = 1; }
    if (s.includes('furat') || s.includes('fúr')) setOperation('drill');
    else if (s.includes('menet')) setOperation('thread');
    else if (s.includes('horony')) setOperation('slot');
    else if (s.includes('sikol') || s.includes('síkol')) setOperation('face');
    else if (s.includes('letor')) setOperation('chamfer');
    else if (s.includes('zseb')) setOperation('pocket');
    else if (s.includes('kontur') || s.includes('kontúr') || s.includes('kivag')) setOperation('contour');
    else if (s.includes('grav')) setOperation('engrave');
    setParams((old) => ({ ...old, ...updates }));
    setStatus('Helyi AI-parameterertelmezes lefutott');
  };

  const materialInfo = MATERIALS[material];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-300 text-xs uppercase tracking-[0.22em] mb-2"><Hammer className="w-4 h-4" /> DESIGNLY CNC CAM</div>
          <h1 className="text-3xl font-display font-bold text-cream-50">CNC megmunkalas tervezo</h1>
          <p className="text-sm text-cream-300/55 mt-2 max-w-3xl">
            8 muvelet · anyagprofilok · vezerlo-dialektusok · G-kod, ciklusido es NC export.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="chip border-gold-600/30 bg-gold-600/10 text-gold-200"><ShieldCheck className="w-3 h-3" /> SIMULATION-FIRST</span>
          <span className="chip border-ink-500/30 text-cream-300/60">{status}</span>
        </div>
      </div>

      <div className="grid xl:grid-cols-[380px_1fr] gap-6">
        <aside className="space-y-4">
          <section className="card-lux p-5 space-y-4">
            <div className="flex items-center gap-2 text-cream-100 font-semibold"><Sparkles className="w-4 h-4 text-gold-400" /> Termeszetes nyelv</div>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Pelda: marj egy 80 x 50 mm-es, 4 mm mely zsebet 6 mm-es maroval" className="w-full min-h-24 px-3 py-3 bg-ink-900 border border-ink-600/40 rounded-xl text-sm text-cream-100 focus:outline-none focus:border-gold-500/50" />
            <button onClick={interpret} className="btn-ghost w-full text-sm"><Sparkles className="w-4 h-4" /> PARAMETEREK ERTELMEZESE</button>
          </section>

          <section className="card-lux p-5 space-y-4">
            <div className="flex items-center gap-2 text-cream-100 font-semibold"><Box className="w-4 h-4 text-gold-400" /> Anyagprofil</div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(MATERIALS) as Material[]).map((m) => (
                <button key={m} onClick={() => applyMaterial(m)} className={'p-3 rounded-xl border text-left ' + (material === m ? 'border-gold-500/50 bg-gold-500/10 text-gold-200' : 'border-ink-600/40 text-cream-300/60 hover:bg-ink-800/60')}>
                  <span className="text-xs font-semibold">{MATERIALS[m].label}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-cream-300/45">Ajanlott: {materialInfo.chip}. S{materialInfo.spindle} · F{materialInfo.feed} · lepes {materialInfo.stepDown} mm.</p>
          </section>

          <section className="card-lux p-5 space-y-4">
            <div className="flex items-center gap-2 text-cream-100 font-semibold"><Settings2 className="w-4 h-4 text-gold-400" /> Muvelet es vezerlo</div>
            <div className="grid grid-cols-2 gap-2">
              {OPERATIONS.map(({ id, label, icon: Icon, desc }) => (
                <button key={id} onClick={() => setOperation(id)} title={desc} className={'p-3 rounded-xl border text-left ' + (operation === id ? 'border-gold-500/50 bg-gold-500/10 text-gold-200' : 'border-ink-600/40 text-cream-300/60 hover:bg-ink-800/60')}>
                  <Icon className="w-4 h-4 mb-2" /><span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
            <select value={controller} onChange={(e) => setController(e.target.value as Controller)} className="input-lux w-full">
              {CONTROLLERS.map((c) => <option key={c.id} value={c.id}>{c.label} - {c.note}</option>)}
            </select>
            <label className="flex items-center gap-2 text-xs text-cream-300/70">
              <input type="checkbox" checked={params.coolant} onChange={(e) => setParams((o) => ({ ...o, coolant: e.target.checked }))} />
              Hutes (M8/M9)
            </label>
          </section>

          <section className="card-lux p-5 space-y-4">
            <div className="flex items-center gap-2 text-cream-100 font-semibold"><Box className="w-4 h-4 text-gold-400" /> Anyag es geometria</div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Anyag X" value={params.stockW} onChange={(v) => set('stockW', v)} />
              <Field label="Anyag Y" value={params.stockH} onChange={(v) => set('stockH', v)} />
              <Field label="Anyag Z" value={params.stockT} onChange={(v) => set('stockT', v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Forma X" value={params.shapeW} onChange={(v) => set('shapeW', v)} />
              <Field label="Forma Y" value={params.shapeH} onChange={(v) => set('shapeH', v)} />
              <Field label="Melyseg" value={params.depth} onChange={(v) => set('depth', v)} />
              <Field label="Szerszam D" value={params.tool} onChange={(v) => set('tool', v)} />
              {(operation === 'drill' || operation === 'thread') && (
                <>
                  <Field label="Furatok X" value={params.holesX} onChange={(v) => set('holesX', v)} />
                  <Field label="Furatok Y" value={params.holesY} onChange={(v) => set('holesY', v)} />
                  <Field label="Osztas X" value={params.holeSpacingX} onChange={(v) => set('holeSpacingX', v)} />
                  <Field label="Osztas Y" value={params.holeSpacingY} onChange={(v) => set('holeSpacingY', v)} />
                </>
              )}
              {operation === 'slot' && <Field label="Horony szelesseg" value={params.slotWidth} onChange={(v) => set('slotWidth', v)} />}
              {operation === 'chamfer' && <Field label="Letores mm" value={params.chamfer} onChange={(v) => set('chamfer', v)} />}
              {operation === 'thread' && <Field label="Menetemelkedes" value={params.pitch} onChange={(v) => set('pitch', v)} />}
            </div>
          </section>

          <section className="card-lux p-5 space-y-4">
            <div className="flex items-center gap-2 text-cream-100 font-semibold"><Gauge className="w-4 h-4 text-gold-400" /> Technologia</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="RPM" value={params.spindle} onChange={(v) => set('spindle', v)} />
              <Field label="Elotolas" value={params.feed} onChange={(v) => set('feed', v)} />
              <Field label="Z elotolas" value={params.plunge} onChange={(v) => set('plunge', v)} />
              <Field label="Lepesmelyseg" value={params.stepDown} onChange={(v) => set('stepDown', v)} />
              <Field label="Biztonsagi Z" value={params.safeZ} onChange={(v) => set('safeZ', v)} />
            </div>
            <div className="flex gap-2">
              <button onClick={generate} className="btn-gold flex-1 text-sm"><Play className="w-4 h-4" /> G-KOD GENERALASA</button>
              <button onClick={reset} className="btn-ghost text-sm"><RotateCcw className="w-4 h-4" /></button>
            </div>
          </section>
        </aside>

        <main className="space-y-4">
          <section className="grid sm:grid-cols-3 gap-3">
            <Metric label="Vagasi hossz" value={cycle.cutLength + ' mm'} />
            <Metric label="Gyorsjarat" value={cycle.rapidLength + ' mm'} />
            <Metric label="Becsult ciklusido" value={'~' + cycle.minutes + ' min'} accent />
          </section>

          <section className="card-lux p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-display font-semibold text-cream-100">Szerszampálya szimulacio</h2>
                <p className="text-xs text-cream-300/45 mt-1">Parameteres 2D toolpath elonezet.</p>
              </div>
              <span className="chip border-gold-600/20 text-gold-200">{operation.toUpperCase()}</span>
            </div>
            <div className="aspect-[16/10] rounded-2xl border border-gold-600/15 bg-black/25 overflow-hidden p-4">
              <ToolpathPreview stockW={params.stockW} stockH={params.stockH} points={result.points} />
            </div>
          </section>

          <section className="card-lux overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b border-ink-600/40">
              <div>
                <h2 className="text-lg font-display font-semibold text-cream-100">G-kod</h2>
                <p className="text-xs text-cream-300/45 mt-1">{shown.length} sor · ellenorizd a gep specifikaciojat export elott</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={copy} className="btn-ghost text-xs"><Copy className="w-4 h-4" /> Masolas</button>
                <button onClick={downloadSetup} className="btn-ghost text-xs"><FileText className="w-4 h-4" /> Setup JSON</button>
                <button onClick={download} className="btn-gold text-xs"><Download className="w-4 h-4" /> .NC EXPORT</button>
              </div>
            </div>
            <pre className="p-4 max-h-[520px] overflow-auto bg-black/30 text-[11px] leading-5 text-cream-200/80 font-mono whitespace-pre">{shown.join('\n')}</pre>
          </section>

          <section className="card-lux p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-cream-100">Biztonsagi ellenorzes</h3>
                <p className="text-xs text-cream-300/50 mt-1">
                  A modul nem kuld G-kodot kozvetlenul CNC gepre. Export elott ellenorizd a nullpontot,
                  tengelyutakat, szerszamot, fordulatot, elotolast es vezerlo-specifikus kodokat.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card-lux p-4">
      <div className="text-[10px] uppercase tracking-[.18em] text-cream-300/45">{label}</div>
      <div className={'font-display text-2xl mt-1 ' + (accent ? 'text-gold-200' : 'text-cream-100')}>{value}</div>
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
  const ps = points.map(([x, y]) => sx(x) + ',' + sy(y)).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect x={pad} y={pad} width={100 - pad * 2} height={100 - pad * 2} rx="2" fill="none" stroke="currentColor" opacity=".25" />
      {points.length > 1 && <polyline points={ps} fill="none" stroke="currentColor" strokeWidth=".8" vectorEffect="non-scaling-stroke" />}
      {points.length > 0 && <circle cx={sx(points[points.length - 1][0])} cy={sy(points[points.length - 1][1])} r="1.4" fill="currentColor" />}
    </svg>
  );
}
