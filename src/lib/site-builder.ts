// DESIGNLY Website Builder — site engine
// Block engine (section types + factory) and multi-page HTML exporter.

export interface SiteSection {
  type: string;
  id?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  cta?: string;
  align?: 'left' | 'center';
  items?: Array<Record<string, string>>;
  plans?: Array<Record<string, string>>;
}

export interface SitePage {
  path: string;
  title: string;
  sections: SiteSection[];
}

export interface SiteSpec {
  name: string;
  pages: SitePage[];
}

export type SiteFiles = Record<string, string>;

const BLOCK_TYPES = [
  { id: 'hero', label: 'Hero / Fo szekcio', icon: '\u2605' },
  { id: 'features', label: 'Szolgaltatasok / Grid', icon: '\u25A6' },
  { id: 'about', label: 'Rolunk / Szoveg', icon: '\u25E8' },
  { id: 'gallery', label: 'Galeria', icon: '\u25A7' },
  { id: 'pricing', label: 'Arak / Csomagok', icon: '\u25C8' },
  { id: 'testimonials', label: 'Velemenyek', icon: '\u2766' },
  { id: 'faq', label: 'GYIK', icon: '?' },
  { id: 'cta', label: 'CTA sav', icon: '\u279C' },
  { id: 'contact', label: 'Kapcsolat / Urlapon', icon: '\u2709' },
  { id: 'footer', label: 'Lablec', icon: '\u25AC' },
];

function newSection(type: string): SiteSection {
  const base: SiteSection = { type, id: 's' + Math.random().toString(36).slice(2, 9) };
  switch (type) {
    case 'hero':
      return { ...base, eyebrow: 'PREMIUM DIGITALIS ELMENY', title: 'A markad tortenete', body: 'Rovid, eros mondat arrol, mit nyujtasz es kinek.', cta: 'Kapcsolatfelvetel', align: 'left' };
    case 'features':
      return { ...base, title: 'Amit kinalunk', body: 'Harom-negy kiemelt szolgaltatas.', items: [{ title: 'Szolgaltatas', body: 'Leiras' }, { title: 'Szolgaltatas', body: 'Leiras' }, { title: 'Szolgaltatas', body: 'Leiras' }] };
    case 'about':
      return { ...base, title: 'Rolunk', body: 'A markad bemutatasa, ertekek, folyamat.' };
    case 'gallery':
      return { ...base, title: 'Munkaink', items: [{ title: '1' }, { title: '2' }, { title: '3' }, { title: '4' }, { title: '5' }, { title: '6' }] };
    case 'pricing':
      return { ...base, title: 'Csomagok', plans: [{ name: 'Alap', price: '49 000 Ft', body: 'Belepo csomag' }, { name: 'Profi', price: '129 000 Ft', body: 'Legnepszerubb' }, { name: 'Premium', price: '249 000 Ft', body: 'Teljes csomag' }] };
    case 'testimonials':
      return { ...base, title: 'Velemenyek', items: [{ title: 'Ugyfel', body: 'Kivalo munka, ajanlom.' }, { title: 'Ugyfel', body: 'Profi csapat.' }] };
    case 'faq':
      return { ...base, title: 'Gyakori kerdesek', items: [{ title: 'Kerdes?', body: 'Valasz.' }, { title: 'Kerdes?', body: 'Valasz.' }] };
    case 'cta':
      return { ...base, title: 'Kezdjuk el', body: 'Vedd fel velunk a kapcsolatot meg ma.', cta: 'Irj nekunk' };
    case 'contact':
      return { ...base, title: 'Kapcsolat', body: 'Irj nekunk es 24 oran belul valaszolunk.' };
    case 'footer':
      return { ...base, title: 'Markanev' };
    default:
      return base;
  }
}

function newPage(n: number): SitePage {
  return { path: '/oldal-' + n, title: 'Uj oldal ' + n, sections: [newSection('hero'), newSection('features')] };
}

function defaultSite(projectName?: string): SiteSpec {
  return {
    name: projectName || 'Uj weboldal',
    pages: [
      { path: '/', title: 'Kezdolap', sections: [newSection('hero'), newSection('features'), newSection('gallery'), newSection('cta')] },
    ],
  };
}

function esc(v: unknown): string {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c] || c;
  });
}

function renderSection(s: SiteSection, ctxName: string): string {
  const t = esc;
  switch (s.type) {
    case 'hero':
      return '<section class="hero' + (s.align === 'center' ? ' hero-c' : '') + '"><div class="wrap"><div class="eyebrow">' + t(s.eyebrow || 'PREMIUM') + '</div><h1>' + t(s.title || ctxName) + '</h1><p class="lead">' + t(s.body || '') + '</p>' + (s.cta ? '<a class="btn" href="#kapcsolat">' + t(s.cta) + '</a>' : '') + '</div></section>';
    case 'features': {
      const items = s.items || [];
      return '<section class="sec" id="szolgaltatasok"><div class="wrap"><h2>' + t(s.title || 'Amit kinalunk') + '</h2>' + (s.body ? '<p class="sub">' + t(s.body) + '</p>' : '') + '<div class="grid grid-' + Math.min(4, Math.max(2, items.length || 3)) + '">' + items.map(function (it) { return '<article class="card"><div class="mark">&#10022;</div><h3>' + t(it.title || '') + '</h3><p>' + t(it.body || '') + '</p></article>'; }).join('') + '</div></div></section>';
    }
    case 'about':
      return '<section class="sec alt" id="rolunk"><div class="wrap"><div class="two"><div><h2>' + t(s.title || 'Rolunk') + '</h2><p>' + t(s.body || '') + '</p></div><div class="art"><span>&#9670;</span></div></div></div></section>';
    case 'gallery': {
      const g = s.items || [];
      const gi = g.length ? g : [{ title: '1' }, { title: '2' }, { title: '3' }, { title: '4' }, { title: '5' }, { title: '6' }];
      return '<section class="sec" id="galeria"><div class="wrap"><h2>' + t(s.title || 'Munkaink') + '</h2><div class="gal">' + gi.map(function (_, i) { return '<figure class="shot"><span>' + (i + 1) + '</span></figure>'; }).join('') + '</div></div></section>';
    }
    case 'pricing':
      return '<section class="sec alt" id="arak"><div class="wrap"><h2>' + t(s.title || 'Csomagok') + '</h2><div class="grid grid-3">' + (s.plans || []).map(function (p, i) { return '<article class="price' + (i === 1 ? ' hot' : '') + '"><div class="pname">' + t(p.name || '') + '</div><div class="pval">' + t(p.price || '') + '</div><p>' + t(p.body || '') + '</p><a class="btn ghost" href="#kapcsolat">Ajanlatot kerek</a></article>'; }).join('') + '</div></div></section>';
    case 'testimonials':
      return '<section class="sec" id="velemenyek"><div class="wrap"><h2>' + t(s.title || 'Velemenyek') + '</h2><div class="grid grid-2">' + (s.items || []).map(function (q) { return '<blockquote class="quote"><p>&bdquo;' + t(q.body || '') + '&rdquo;</p><cite>' + t(q.title || '') + '</cite></blockquote>'; }).join('') + '</div></div></section>';
    case 'faq':
      return '<section class="sec alt" id="gyik"><div class="wrap"><h2>' + t(s.title || 'Gyakori kerdesek') + '</h2><div class="faq">' + (s.items || []).map(function (q) { return '<details><summary>' + t(q.title || '') + '</summary><p>' + t(q.body || '') + '</p></details>'; }).join('') + '</div></div></section>';
    case 'cta':
      return '<section class="cta"><div class="wrap"><h2>' + t(s.title || 'Kezdjuk el') + '</h2><p>' + t(s.body || '') + '</p>' + (s.cta ? '<a class="btn" href="#kapcsolat">' + t(s.cta) + '</a>' : '') + '</div></section>';
    case 'contact':
      return '<section class="sec" id="kapcsolat"><div class="wrap narrow"><h2>' + t(s.title || 'Kapcsolat') + '</h2>' + (s.body ? '<p class="sub">' + t(s.body) + '</p>' : '') + '<form onsubmit="event.preventDefault();this.querySelector(&quot;.ok&quot;).style.display=&quot;block&quot;;"><input required placeholder="Nev" aria-label="Nev"><input required type="email" placeholder="E-mail" aria-label="E-mail"><textarea required placeholder="Uzenet" aria-label="Uzenet"></textarea><button class="btn" type="submit">Uzenet kuldese</button><div class="ok">Koszonyjuk, hamarosan valaszolunk.</div></form></div></section>';
    default:
      return '';
  }
}

function renderSite(site: SiteSpec): SiteFiles {
  const pages = site.pages && site.pages.length ? site.pages : [{ path: '/', title: site.name, sections: [] }];
  const nav = pages.map(function (p) {
    const path = String(p.path || '/');
    return { href: path === '/' ? 'index.html' : (path.replace(/^\/+/, '') + '.html'), title: String(p.title || path) };
  });
  const css = ':root{--bg:#07090a;--panel:#0d1113;--line:rgba(214,179,106,.18);--gold:#d6b36a;--gold2:#f2d99a;--ink:#e8f4f2;--mut:rgba(232,244,242,.55)}'
    + '*{box-sizing:border-box}html{scroll-behavior:smooth}'
    + 'body{margin:0;background:var(--bg);color:var(--ink);font:400 16px/1.7 Inter,-apple-system,system-ui,sans-serif}'
    + '.wrap{max-width:1200px;margin:0 auto;padding:0 26px}a{color:inherit;text-decoration:none}'
    + 'h1,h2,h3{font-family:Georgia,serif;line-height:1.1;margin:0 0 14px}'
    + 'h1{font-size:clamp(40px,6vw,76px)}h2{font-size:clamp(28px,3.4vw,44px)}p{margin:0 0 14px;color:var(--mut)}'
    + '.eyebrow{font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--gold);margin-bottom:16px}'
    + '.lead{font-size:18px;max-width:640px}'
    + 'header.site{position:sticky;top:0;z-index:30;background:rgba(7,9,10,.92);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}'
    + 'header.site .wrap{display:flex;align-items:center;gap:20px;height:74px}'
    + '.brand{font-family:Georgia,serif;font-size:19px;letter-spacing:.14em;margin-right:auto}'
    + 'header.site nav a{margin-left:20px;font-size:13px;color:var(--mut);padding:6px 2px;border-bottom:1px solid transparent}'
    + 'header.site nav a:hover,header.site nav a.on{color:var(--gold2);border-color:var(--gold)}'
    + '.btn{display:inline-block;margin-top:8px;padding:14px 26px;border-radius:10px;background:linear-gradient(135deg,var(--gold),#e8c67f);color:#0a0c0d;font-weight:700;font-size:14px;border:1px solid rgba(255,255,255,.18)}'
    + '.btn.ghost{background:transparent;color:var(--gold2);border:1px solid var(--line)}'
    + '.hero{min-height:78vh;display:flex;align-items:center;background:radial-gradient(circle at 78% 20%,rgba(214,179,106,.20),transparent 32%),linear-gradient(135deg,#0a1512,#07090a)}'
    + '.hero-c{text-align:center}.hero-c .lead{margin:0 auto 18px}'
    + '.sec{padding:clamp(64px,8vw,120px) 0}.sec.alt{background:var(--panel);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}'
    + '.sec .sub{max-width:720px;margin-bottom:34px}'
    + '.grid{display:grid;gap:16px}.grid-2{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}'
    + '.grid-3{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}.grid-4{grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}'
    + '.card{background:linear-gradient(160deg,rgba(18,23,25,.95),rgba(9,12,13,.98));border:1px solid var(--line);border-radius:16px;padding:26px;min-height:170px}'
    + '.card .mark{color:var(--gold);font-size:20px;margin-bottom:10px}.card h3{font-size:19px;margin-bottom:8px}'
    + '.two{display:grid;grid-template-columns:1.1fr .9fr;gap:36px;align-items:center}'
    + '.two .art{min-height:280px;border:1px solid var(--line);border-radius:18px;display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,rgba(214,179,106,.18),transparent 60%),#0b0f10;font-size:46px;color:var(--gold)}'
    + '.gal{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}'
    + '.shot{aspect-ratio:4/3;border:1px solid var(--line);border-radius:14px;margin:0;display:grid;place-items:center;background:linear-gradient(150deg,#101617,#0a0d0e);color:rgba(214,179,106,.5);font-size:26px}'
    + '.price{border:1px solid var(--line);border-radius:18px;padding:28px;background:linear-gradient(160deg,rgba(18,23,25,.96),rgba(9,12,13,.99))}'
    + '.price.hot{border-color:rgba(214,179,106,.55);box-shadow:0 26px 70px rgba(0,0,0,.45)}'
    + '.pname{font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:var(--mut)}.pval{font-family:Georgia,serif;font-size:34px;margin:10px 0 12px;color:var(--gold2)}'
    + '.quote{border:1px solid var(--line);border-radius:16px;padding:26px;margin:0;background:var(--panel)}'
    + '.quote p{color:var(--ink);font-size:17px}.quote cite{font-style:normal;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}'
    + '.faq details{border-bottom:1px solid var(--line);padding:18px 0}.faq summary{cursor:pointer;font-family:Georgia,serif;font-size:20px}'
    + '.cta{padding:clamp(56px,7vw,96px) 0;text-align:center;background:radial-gradient(circle at 50% 0%,rgba(214,179,106,.18),transparent 45%),#080b0c;border-top:1px solid var(--line)}'
    + '.narrow{max-width:680px}'
    + 'form input,form textarea{width:100%;padding:15px;margin-bottom:12px;border:1px solid var(--line);border-radius:10px;background:#0a0e0f;color:var(--ink);font:inherit}'
    + 'form .ok{display:none;margin-top:14px;color:var(--gold2)}'
    + 'footer.site{border-top:1px solid var(--line);padding:34px 0;font-size:12px;color:rgba(232,244,242,.35)}'
    + '@media(max-width:760px){.two{grid-template-columns:1fr}header.site nav a{margin-left:12px;font-size:12px}}';
  const js = '(function(){var here=location.pathname.split("/").pop()||"index.html";document.querySelectorAll("header.site nav a").forEach(function(a){if(a.getAttribute("href")===here)a.classList.add("on");});})();';
  const files: SiteFiles = {};
  pages.forEach(function (p) {
    const path = String(p.path || '/');
    const file = path === '/' ? 'index.html' : (path.replace(/^\/+/, '') + '.html');
    const body = (p.sections || []).map(function (s) { return renderSection(s, site.name); }).join('\n');
    const navHtml = nav.map(function (n) { return '<a href="' + esc(n.href) + '">' + esc(n.title) + '</a>'; }).join('');
    files[file] = '<!doctype html>\n<html lang="hu">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + esc(p.title || site.name) + ' - ' + esc(site.name) + '</title>\n<link rel="stylesheet" href="style.css">\n</head>\n<body>\n<header class="site"><div class="wrap"><div class="brand">' + esc(site.name) + '</div><nav>' + navHtml + '</nav></div></header>\n<main>\n' + body + '\n</main>\n<footer class="site"><div class="wrap">' + esc(site.name) + ' &middot; Kesztult a DESIGNLY Website Builderrel</div></footer>\n<script src="script.js"></script>\n</body>\n</html>';
  });
  files['style.css'] = css;
  files['script.js'] = js;
  return files;
}

function crc32(bytes: Uint8Array): number {
  let c, crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = (crc ^ bytes[i]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStore(files: SiteFiles): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Array<{ nameBytes: Uint8Array; crc: number; size: number; offset: number }> = [];
  let offset = 0;
  Object.keys(files).forEach(function (name) {
    const nameBytes = enc.encode(name);
    const data = enc.encode(files[name]);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length);
    const dv = new DataView(local.buffer);
    dv.setUint32(0, 0x04034b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 0, true);
    dv.setUint16(8, 0, true);
    dv.setUint16(10, 0, true);
    dv.setUint16(12, 0, true);
    dv.setUint32(14, crc, true);
    dv.setUint32(18, data.length, true);
    dv.setUint32(22, data.length, true);
    dv.setUint16(26, nameBytes.length, true);
    dv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    parts.push(local, data);
    central.push({ nameBytes, crc, size: data.length, offset });
    offset += local.length + data.length;
  });
  const cdParts: Uint8Array[] = [];
  let cdSize = 0;
  central.forEach(function (e) {
    const h = new Uint8Array(46 + e.nameBytes.length);
    const dv = new DataView(h.buffer);
    dv.setUint32(0, 0x02014b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 20, true);
    dv.setUint16(8, 0, true);
    dv.setUint16(10, 0, true);
    dv.setUint16(12, 0, true);
    dv.setUint16(14, 0, true);
    dv.setUint32(16, e.crc, true);
    dv.setUint32(20, e.size, true);
    dv.setUint32(24, e.size, true);
    dv.setUint16(28, e.nameBytes.length, true);
    dv.setUint32(42, e.offset, true);
    h.set(e.nameBytes, 46);
    cdParts.push(h);
    cdSize += h.length;
  });
  const end = new Uint8Array(22);
  const edv = new DataView(end.buffer);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(8, central.length, true);
  edv.setUint16(10, central.length, true);
  edv.setUint32(12, cdSize, true);
  edv.setUint32(16, offset, true);
  const all = parts.concat(cdParts, [end]);
  const total = all.reduce(function (n, a) { return n + a.length; }, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  all.forEach(function (a) { out.set(a, pos); pos += a.length; });
  return out;
}

export { BLOCK_TYPES, newSection, newPage, defaultSite, renderSite, zipStore };
