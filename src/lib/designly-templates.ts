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
];

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
  'Prestige','Summit','Noir','Elysian','Valhalla','Raven','Fjord','Runestone',
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

// 50,000 deterministic templates are available locally.
// The catalogue is generated on demand to avoid allocating 50,000 objects during app startup.
export const TEMPLATE_TOTAL = 50000;
export const DESIGNLY_TEMPLATE_INDEXES = Array.from({ length: TEMPLATE_TOTAL }, (_, i) => i);
export function getDesignlyTemplate(index: number): DesignlyTemplate {
  const safeIndex = Math.max(0, Math.min(TEMPLATE_TOTAL - 1, Math.floor(index)));
  return templateAt(safeIndex);
}
