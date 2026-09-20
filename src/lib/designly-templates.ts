export interface DesignlyTemplate {
  id: string;
  name: string;
  category: string;
  type: string;
  premium: boolean;
  description: string;
  style: string;
  effect: string;
  palette: string[];
  layout: 'editorial' | 'bold' | 'minimal' | 'luxury' | 'corporate';
  fontPair: string;
  format: string;
  variant: number;
}

const CATEGORIES = [
  'Business','Restaurant','Real Estate','Beauty','Fitness','Technology',
  'Events','Wedding','Personal','E-commerce','Marketing','Corporate',
  'Automotive','Hospitality','Healthcare','Education','Finance','Construction',
  'Fashion','Travel','Creator','Gaming','Nonprofit','Luxury',
];

const TYPES = [
  { type:'social', label:'Social Media' }, { type:'business_card', label:'Business Card' },
  { type:'invitation', label:'Invitation' }, { type:'flyer', label:'Flyer' },
  { type:'menu', label:'Menu' }, { type:'pricelist', label:'Price List' },
  { type:'poster', label:'Poster' }, { type:'logo', label:'Logo' },
  { type:'advertisement', label:'Advertisement' }, { type:'brochure', label:'Brochure' },
  { type:'brand', label:'Brand Identity' }, { type:'presentation', label:'Presentation' },
  { type:'landing', label:'Landing Page' }, { type:'campaign', label:'Campaign' },
  { type:'custom', label:'Custom Design' }, { type:'website', label:'Website' },
];

export const DESIGNLY_TEMPLATE_STYLES = [
  'Luxury','Editorial','Minimal','Bold','Corporate','Cinematic','Modern','Heritage',
  'Premium','Elegant','Nordic','Celtic','Art Deco','Monochrome','Glass','Brutalist',
  'Futuristic','Organic','Tech Noir','Editorial Luxe','Neo Classic','Y2K','Retro',
  'Street','High Fashion','Architectural','Dark Academia','Soft Luxury','Industrial',
];

const STYLES = DESIGNLY_TEMPLATE_STYLES;
const LAYOUTS: DesignlyTemplate['layout'][] = ['luxury','editorial','minimal','bold','corporate'];

export const DESIGNLY_PALETTES = [
  ['#090909','#c9a45c','#f4eee2'], ['#111111','#d4af63','#ffffff'],
  ['#0c0c0c','#b99045','#d9c7a0'], ['#171717','#c6a15b','#eee7d8'],
  ['#f3efe7','#8f7042','#24211d'], ['#0a0f12','#c7a15a','#e8e8e8'],
  ['#121212','#b79557','#f0ece3'], ['#0b0b0b','#d0a45b','#f2eee6'],
  ['#101010','#b89960','#ffffff'], ['#0d0d0d','#c6a15e','#eee7da'],
  ['#07111a','#56c2ff','#eaf7ff'], ['#0b1510','#8fd19e','#f1fff4'],
  ['#180b16','#d98ad0','#fff1fc'], ['#15100a','#ff9f43','#fff4e6'],
  ['#0d1020','#7c8cff','#eef0ff'], ['#111318','#9aa5b1','#f7f8fa'],
  ['#20130b','#e5b76b','#fff7e8'], ['#0d1717','#5dd6c0','#eafffb'],
  ['#170d0d','#e66a6a','#fff0f0'], ['#12100d','#d6c29a','#f7f1e2'],
  ['#030303','#f0c36a','#f7f7f7'], ['#0b0d14','#8ea7ff','#f0f3ff'], ['#120b08','#c97b4b','#fff0df'],
  ['#08120d','#4fd1a5','#effff8'], ['#100b17','#a78bfa','#f5f0ff'], ['#0c1020','#38bdf8','#ecfeff'],
  ['#18100a','#f59e0b','#fff7ed'], ['#111111','#eab308','#fafafa'], ['#151515','#f97316','#fff7ed'],
  ['#0b1114','#22d3ee','#ecfeff'], ['#120d14','#e879f9','#fff1ff'], ['#10150e','#a3e635','#f7fee7'],
  ['#16100d','#fb7185','#fff1f2'], ['#090d16','#60a5fa','#eff6ff'], ['#13110a','#facc15','#fefce8'],
  ['#0a1210','#34d399','#ecfdf5'], ['#100c18','#c084fc','#faf5ff'], ['#0d1117','#94a3b8','#f8fafc'],
  ['#1a0f0b','#fdba74','#fff7ed'], ['#07151a','#67e8f9','#ecfeff'], ['#170b12','#f472b6','#fdf2f8'],
  ['#0c120f','#86efac','#f0fdf4'], ['#11100b','#fde68a','#fffbeb'], ['#0b0b12','#a5b4fc','#eef2ff'],
  ['#161616','#d1d5db','#ffffff'], ['#120f0b','#b45309','#fffbeb'], ['#0b1217','#0ea5e9','#f0f9ff'],
  ['#140b10','#be123c','#fff1f2'], ['#0a1512','#047857','#ecfdf5'], ['#120d1b','#7c3aed','#f5f3ff'],
  ['#101214','#475569','#f8fafc'], ['#1a1308','#a16207','#fefce8'], ['#081218','#0369a1','#e0f2fe'],
  ['#180b0b','#991b1b','#fef2f2'], ['#07130d','#166534','#f0fdf4'], ['#120b16','#6b21a8','#faf5ff'],
  ['#0f172a','#334155','#f1f5f9'], ['#1c1917','#78716c','#fafaf9'], ['#0c0a09','#92400e','#fffbeb'],
  ['#082f49','#0c4a6e','#e0f2fe'], ['#450a0a','#7f1d1d','#fef2f2'], ['#052e16','#14532d','#f0fdf4'],
  ['#3b0764','#581c87','#faf5ff'], ['#172554','#1e3a8a','#eff6ff'], ['#422006','#713f12','#fefce8'],
  ['#164e63','#155e75','#ecfeff'], ['#500724','#831843','#fdf2f8'], ['#312e81','#4338ca','#eef2ff'],
  ['#4c1d95','#6d28d9','#f5f3ff'], ['#7c2d12','#9a3412','#fff7ed'],
];


export interface DesignlyMaterial {
  id: string;
  name: string;
  category: 'Metal' | 'Wood' | 'Stone' | 'Glass' | 'Leather' | 'Fabric' | 'Paper' | 'Concrete' | 'Carbon' | 'Ceramic' | 'Liquid' | 'Nature' | 'Special';
  colors: string[];
  finish: string;
  texture: string;
  css: string;
  textCompatible: boolean;
  surfaceCompatible: boolean;
}

export const DESIGNLY_MATERIAL_LIBRARY: DesignlyMaterial[] = [
  { id:'metal-gold', name:'Arany fém', category:'Metal', colors:['#6f4d16','#c9a45c','#f7e7ad'], finish:'polished', texture:'brushed-metal', css:'linear-gradient(135deg,#5b3d0d,#c9a45c 45%,#fff0ad 58%,#8a641d)', textCompatible:true, surfaceCompatible:true },
  { id:'metal-silver', name:'Ezüst / króm', category:'Metal', colors:['#565b61','#cfd4d8','#ffffff'], finish:'chrome', texture:'chrome', css:'linear-gradient(110deg,#4a4f55,#ffffff 42%,#9aa1a8 58%,#f7f7f7)', textCompatible:true, surfaceCompatible:true },
  { id:'metal-copper', name:'Réz', category:'Metal', colors:['#6e2f18','#b87333','#f2b07b'], finish:'satin', texture:'copper', css:'linear-gradient(135deg,#572311,#b87333,#ffd0a8,#7a351b)', textCompatible:true, surfaceCompatible:true },
  { id:'metal-black', name:'Fekete fém', category:'Metal', colors:['#050505','#242424','#737373'], finish:'matte', texture:'black-metal', css:'linear-gradient(135deg,#050505,#3b3b3b,#0b0b0b)', textCompatible:true, surfaceCompatible:true },
  { id:'wood-oak', name:'Tölgyfa', category:'Wood', colors:['#6b3e1e','#b9783b','#e1b77b'], finish:'natural', texture:'oak-grain', css:'linear-gradient(90deg,#6b3e1e,#b9783b,#7d481f,#d6a66d)', textCompatible:true, surfaceCompatible:true },
  { id:'wood-walnut', name:'Diófa', category:'Wood', colors:['#24140c','#60351d','#a56b3f'], finish:'polished', texture:'walnut-grain', css:'linear-gradient(90deg,#24140c,#6b3b20,#3a1d11,#9a6238)', textCompatible:true, surfaceCompatible:true },
  { id:'wood-black', name:'Fekete fa', category:'Wood', colors:['#090705','#241c17','#4a372b'], finish:'charred', texture:'charred-wood', css:'linear-gradient(90deg,#090705,#3a2b21,#110d0a)', textCompatible:true, surfaceCompatible:true },
  { id:'stone-marble', name:'Márvány', category:'Stone', colors:['#e8e4dc','#a9a39a','#34312d'], finish:'polished', texture:'marble-vein', css:'linear-gradient(135deg,#f2eee6,#c9c2b7 45%,#eee8dc 58%,#aaa39a)', textCompatible:true, surfaceCompatible:true },
  { id:'stone-granite', name:'Gránit', category:'Stone', colors:['#171717','#555555','#a7a7a7'], finish:'polished', texture:'granite', css:'radial-gradient(circle,#777 0 1px,transparent 1px),linear-gradient(135deg,#111,#555,#222)', textCompatible:true, surfaceCompatible:true },
  { id:'stone-slate', name:'Palakő', category:'Stone', colors:['#171b1e','#3c454a','#788188'], finish:'split', texture:'slate', css:'linear-gradient(135deg,#11171a,#455057,#171b1e)', textCompatible:true, surfaceCompatible:true },
  { id:'glass-clear', name:'Átlátszó üveg', category:'Glass', colors:['#dff8ff','#8dd8e8','#ffffff'], finish:'clear', texture:'glass', css:'linear-gradient(135deg,rgba(255,255,255,.25),rgba(90,210,240,.12),rgba(255,255,255,.32))', textCompatible:true, surfaceCompatible:true },
  { id:'glass-smoked', name:'Füstüveg', category:'Glass', colors:['#11161a','#4d5960','#b7c2c7'], finish:'smoked', texture:'smoked-glass', css:'linear-gradient(135deg,rgba(10,15,18,.92),rgba(100,120,130,.38),rgba(255,255,255,.12))', textCompatible:true, surfaceCompatible:true },
  { id:'leather-black', name:'Fekete bőr', category:'Leather', colors:['#050505','#171717','#3c3029'], finish:'matte', texture:'leather-grain', css:'linear-gradient(135deg,#050505,#211a16,#080808)', textCompatible:true, surfaceCompatible:true },
  { id:'leather-brown', name:'Barna bőr', category:'Leather', colors:['#2b1409','#713b1f','#b56d3d'], finish:'aged', texture:'leather', css:'linear-gradient(135deg,#2b1409,#814522,#3a1b0e)', textCompatible:true, surfaceCompatible:true },
  { id:'fabric-velvet', name:'Bársony', category:'Fabric', colors:['#13050c','#4d0d2d','#a83b68'], finish:'soft', texture:'velvet', css:'linear-gradient(120deg,#10040a,#741642 48%,#210711)', textCompatible:true, surfaceCompatible:true },
  { id:'fabric-silk', name:'Selyem', category:'Fabric', colors:['#ded4c0','#f7eee0','#9b8d79'], finish:'satin', texture:'silk', css:'linear-gradient(110deg,#9f927e,#fffaf0 35%,#c9bda8 58%,#f7eee0)', textCompatible:true, surfaceCompatible:true },
  { id:'paper-luxury', name:'Prémium papír', category:'Paper', colors:['#eee9dd','#c9c0af','#ffffff'], finish:'uncoated', texture:'paper', css:'linear-gradient(135deg,#eee9dd,#fffdf7,#d6cdbc)', textCompatible:true, surfaceCompatible:true },
  { id:'concrete-dark', name:'Sötét beton', category:'Concrete', colors:['#242424','#555555','#888888'], finish:'raw', texture:'concrete', css:'linear-gradient(135deg,#202020,#5a5a5a,#303030)', textCompatible:true, surfaceCompatible:true },
  { id:'carbon-fiber', name:'Karbon', category:'Carbon', colors:['#020202','#151515','#383838'], finish:'woven', texture:'carbon-fiber', css:'repeating-linear-gradient(45deg,#090909 0 3px,#1d1d1d 3px 6px)', textCompatible:true, surfaceCompatible:true },
  { id:'ceramic-white', name:'Fehér kerámia', category:'Ceramic', colors:['#eeeeea','#ffffff','#aaa9a2'], finish:'glossy', texture:'ceramic', css:'linear-gradient(135deg,#d8d8d1,#ffffff 50%,#aaa9a2)', textCompatible:true, surfaceCompatible:true },
  { id:'liquid-gold', name:'Folyékony arany', category:'Liquid', colors:['#5c3c08','#d6aa4a','#fff1a8'], finish:'liquid', texture:'liquid-metal', css:'linear-gradient(115deg,#4c3005,#d6aa4a 30%,#fff4ad 48%,#9c6b12 68%,#f1d275)', textCompatible:true, surfaceCompatible:true },
  { id:'liquid-chrome', name:'Folyékony króm', category:'Liquid', colors:['#31363b','#dce3e7','#ffffff'], finish:'liquid', texture:'liquid-chrome', css:'linear-gradient(115deg,#20252a,#fff 30%,#7e878e 48%,#f7f7f7 65%,#30353a)', textCompatible:true, surfaceCompatible:true },
  { id:'nature-moss', name:'Moha / természet', category:'Nature', colors:['#142615','#496b31','#9aa86a'], finish:'organic', texture:'moss', css:'linear-gradient(135deg,#101d10,#56733a,#1e321b)', textCompatible:true, surfaceCompatible:true },
  { id:'special-celtic', name:'Kelta patina', category:'Special', colors:['#17231d','#5e765e','#c2a75c'], finish:'aged', texture:'celtic-patina', css:'linear-gradient(135deg,#152019,#6b805f 48%,#b69a51)', textCompatible:true, surfaceCompatible:true },
];

export const DESIGNLY_MATERIAL_CATEGORIES = ['Metal','Wood','Stone','Glass','Leather','Fabric','Paper','Concrete','Carbon','Ceramic','Liquid','Nature','Special'] as const;

export const DESIGNLY_FONT_PAIRS = [
  'Cinzel + Inter','Playfair Display + Manrope','Cormorant Garamond + Montserrat',
  'DM Serif Display + DM Sans','Libre Baskerville + Source Sans 3','Bodoni Moda + Inter',
  'Cormorant + Outfit','EB Garamond + Manrope','Fraunces + Inter','Prata + Lato',
  'Unbounded + Inter','Space Grotesk + DM Sans','Plus Jakarta Sans + Playfair Display',
  'Sora + Inter','Raleway + Merriweather','Oswald + Lato','Bebas Neue + Inter',
  'Archivo + Cormorant Garamond','Montserrat + Lora','Poppins + Libre Baskerville',
  'Manrope + Cormorant Garamond','Outfit + DM Serif Display','Syne + Inter',
  'Urbanist + Playfair Display','Marcellus + Source Sans 3','Jost + Cormorant Garamond',
  'Anton + Inter','IBM Plex Sans + Playfair Display','Noto Serif + Manrope','Space Grotesk + Cormorant',
  'Bodoni + Montserrat','Gloock + Inter','DM Serif Text + Manrope','Newsreader + Inter','Instrument Serif + Inter','Young Serif + Manrope',
  'Cormorant Infant + Montserrat','Cardo + Work Sans','Lora + Poppins','Merriweather + Montserrat','Spectral + Inter','Bitter + Manrope',
  'Source Serif 4 + Inter','Literata + Manrope','Crimson Pro + Work Sans','Playfair Display + Raleway','Prata + Montserrat','Oranienbaum + Inter',
  'Abril Fatface + Lato','Bodoni Moda + Space Grotesk','DM Serif Display + Outfit','Fraunces + Manrope','Marcellus + Montserrat','Cinzel Decorative + Inter',
  'Unica One + Inter','League Spartan + Lora','Archivo Black + Manrope','Barlow Condensed + Inter','Roboto Slab + Manrope','Kanit + Inter',
  'Rajdhani + Inter','Oxanium + Manrope','Michroma + Inter','Orbitron + Inter','Exo 2 + Manrope','Space Mono + Inter',
  'JetBrains Mono + Inter','IBM Plex Mono + Inter','Fira Code + Inter','Chakra Petch + Inter','Titillium Web + Lora','Barlow + Cormorant',
  'Quicksand + DM Serif Display','Nunito Sans + Playfair Display','Raleway + DM Serif','Josefin Sans + Cormorant','Cabin + Libre Baskerville','Karla + Fraunces',
  'Mulish + Cormorant Garamond','Work Sans + EB Garamond','Inter + Bodoni Moda','Manrope + Prata','Outfit + Cormorant','Sora + Libre Baskerville',
  'Figtree + DM Serif Display','Geist + Playfair Display','Geist + Manrope','Plus Jakarta Sans + Cormorant','Public Sans + Lora','Rubik + Merriweather',
  'Vollkorn + Inter','Arvo + Manrope','Zilla Slab + Inter','Bree Serif + Lato','Alfa Slab One + Inter','Righteous + Manrope',
  'Poiret One + Montserrat','Cormorant SC + Inter','Forum + Manrope','Yeseva One + Inter','Italiana + Lato','Bodoni 72 + Inter',
];

export const DESIGNLY_EFFECTS = [
  'Metallic sheen','Soft grain','Cinematic glow','Glass edge','Celtic linework',
  'Parallax mist','Gold light sweep','Paper texture','Editorial shadow','Neon-free aura',
  'Chrome reflection','Frosted glass','Film halation','Embossed edge','Ink bleed',
  'Soft bloom','Prismatic highlight','Brushed metal','Architectural grid','Velvet depth',
];

const EFFECTS = DESIGNLY_EFFECTS;

const NAMES = [
  'Aurelia','Nordic','Celtic','Imperial','Velvet','Obsidian','Monarch','Atlas',
  'Eclipse','Heritage','Noble','Vantage','Sovereign','Aurora','Legacy','Element',
  'Prestige','Summit','Noir','Elysian','Valhalla','Raven','Fjord','Runestone','Odin','Freya','Thor','Asgard','Drakkar','Saga',
  'Valkyrie','Mjolnir','Fenrir','Yggdrasil','Bifrost','Skald','Jarl','Edda','Boreal','Solstice','Ember','Onyx','Titan',
  'Apex','Crown','Regal','Majestic','Halo','Nova','Luna','Solaris','Vesper','Celeste','Artemis','Apollo','Zenith','Vertex',
  'Forge','Foundry','Legacy','Dynasty','Empire','Regent','Palace','Chateau','Maison','Atelier','Studio','Craft','Pulse','Vector',
  'Quantum','Nexus','Orbit','Matrix','Signal','Vertex','Prism','Flux','Echo','Horizon','Monument','Pillar','Keystone','Summit',
];

function templateAt(index: number): DesignlyTemplate {
  const category = CATEGORIES[index % CATEGORIES.length];
  const spec = TYPES[Math.floor(index / CATEGORIES.length) % TYPES.length];
  const style = STYLES[Math.floor(index / 17) % STYLES.length];
  const effect = EFFECTS[Math.floor(index / 13) % EFFECTS.length];
  const layout = LAYOUTS[Math.floor(index / 31) % LAYOUTS.length];
  const palette = DESIGNLY_PALETTES[Math.floor(index / 7) % DESIGNLY_PALETTES.length];
  const fontPair = DESIGNLY_FONT_PAIRS[Math.floor(index / 11) % DESIGNLY_FONT_PAIRS.length];
  const name = `${NAMES[index % NAMES.length]} ${category} ${spec.label} ${String((index % 250) + 1).padStart(3,'0')}`;

  return {
    id: `tpl-${String(index + 1).padStart(5,'0')}`,
    name,
    category,
    type: spec.type,
    premium: index % 5 !== 4,
    description: `${style} ${category.toLowerCase()} ${spec.label.toLowerCase()} — ${effect.toLowerCase()}, ${fontPair}.`,
    style: style.toLowerCase(),
    effect,
    palette,
    layout,
    fontPair,
    format: spec.type === 'social' ? '1080×1080' : 'Premium',
    variant: index + 1,
  };
}

// 100,000 deterministic templates are available locally.
// The catalogue is generated on demand to keep startup memory usage low.
// Each template is reproducible from its index, so the library can scale without shipping
// 100,000 duplicated JSON objects. Logo, brand, website, social, print and campaign variants
// are distributed across the catalogue with many font, palette, layout and effect combinations.
export const TEMPLATE_TOTAL = 100000;
export const DESIGNLY_TEMPLATE_INDEXES = Array.from({ length: TEMPLATE_TOTAL }, (_, i) => i);
export function getDesignlyTemplate(index: number): DesignlyTemplate {
  const safeIndex = Math.max(0, Math.min(TEMPLATE_TOTAL - 1, Math.floor(index)));
  return templateAt(safeIndex);
}
