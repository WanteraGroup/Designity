export interface DesignlyTemplate {
  id: string;
  name: string;
  category: string;
  type: string;
  premium: boolean;
  description: string;
  style: string;
  palette: string[];
  layout: 'editorial' | 'bold' | 'minimal' | 'luxury' | 'corporate';
  fontPair: string;
  format: string;
  variant: number;
}

const CATEGORIES = ['Business','Restaurant','Real Estate','Beauty','Fitness','Technology','Events','Wedding','Personal','E-commerce','Marketing','Corporate'];
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
const STYLES = ['Luxury','Editorial','Minimal','Bold','Corporate','Cinematic','Modern','Heritage','Premium','Elegant'];
const LAYOUTS: DesignlyTemplate['layout'][] = ['luxury','editorial','minimal','bold','corporate'];
const PALETTES = [
  ['#090909','#c9a45c','#f4eee2'], ['#111111','#d4af63','#ffffff'], ['#0c0c0c','#b99045','#d9c7a0'],
  ['#171717','#c6a15b','#eee7d8'], ['#f3efe7','#8f7042','#24211d'], ['#0a0f12','#c7a15a','#e8e8e8'],
  ['#121212','#b79557','#f0ece3'], ['#0b0b0b','#d0a45b','#f2eee6'], ['#101010','#b89960','#ffffff'],
  ['#0d0d0d','#c6a15e','#eee7da'],
];
const FONT_PAIRS = [
  'Cinzel + Inter','Playfair Display + Manrope','Cormorant Garamond + Montserrat','DM Serif Display + DM Sans',
  'Libre Baskerville + Source Sans 3','Bodoni Moda + Inter','Cormorant + Outfit','EB Garamond + Manrope',
  'Fraunces + Inter','Prata + Lato','Unbounded + Inter','Space Grotesk + DM Sans','Plus Jakarta Sans + Playfair Display',
  'Sora + Inter','Raleway + Merriweather','Oswald + Lato','Bebas Neue + Inter','Archivo + Cormorant Garamond',
  'Montserrat + Lora','Poppins + Libre Baskerville',
];

const NAMES = ['Aurelia','Nordic','Celtic','Imperial','Velvet','Obsidian','Monarch','Atlas','Eclipse','Heritage','Noble','Vantage','Sovereign','Aurora','Legacy','Element','Prestige','Summit','Noir','Elysian'];

function templateAt(index: number): DesignlyTemplate {
  const category = CATEGORIES[index % CATEGORIES.length];
  const spec = TYPES[Math.floor(index / CATEGORIES.length) % TYPES.length];
  const style = STYLES[Math.floor(index / 17) % STYLES.length];
  const layout = LAYOUTS[Math.floor(index / 31) % LAYOUTS.length];
  const palette = PALETTES[Math.floor(index / 7) % PALETTES.length];
  const fontPair = FONT_PAIRS[Math.floor(index / 11) % FONT_PAIRS.length];
  const name = `${NAMES[index % NAMES.length]} ${category} ${spec.label} ${String((index % 250) + 1).padStart(3,'0')}`;
  return {
    id: `tpl-${String(index + 1).padStart(5,'0')}`,
    name, category, type: spec.type,
    premium: index % 5 !== 4,
    description: `${style} ${category.toLowerCase()} ${spec.label.toLowerCase()} prémium vizuális rendszerrel.`,
    style: style.toLowerCase(), palette, layout, fontPair,
    format: spec.type === 'social' ? '1080×1080' : spec.type === 'story' ? '1080×1920' : 'Premium',
    variant: index + 1,
  };
}

// 50,000 deterministic templates. They are generated locally so the catalogue is instant,
// searchable and does not require 50,000 database rows or paid generation APIs.
export const DESIGNLY_TEMPLATES: DesignlyTemplate[] = Array.from({ length: 50000 }, (_, i) => templateAt(i));

export const TEMPLATE_TOTAL = DESIGNLY_TEMPLATES.length;
