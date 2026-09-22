/*
 * Template artwork.
 *
 * The twelve launch templates are data rows with no images, so the hall renders
 * a monogram until artwork exists. Rather than ship twelve binaries, each entry
 * draws its own cover from a deterministic recipe keyed off its name — the same
 * template always produces the same cover, and a new row needs no asset upload.
 *
 * The palette is constrained to the brand: ink, gold, cream. A generated cover
 * that drifts into a colour outside that set reads as a different product.
 */

const INK = ['#050505', '#0f0f11', '#141417', '#0a0a0b'];
const GOLD = ['#c49a2e', '#d4ab3d', '#a87f24', '#e0c066'];
const CREAM = ['#f9f5ec', '#f0e9d8', '#fbf6e9', '#e4d9c0'];

/** FNV-1a over the name, so the recipe is stable across sessions. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function pick<T>(arr: T[], h: number, shift: number): T {
  return arr[(h >>> shift) % arr.length];
}

export interface TemplateArt {
  ink: string;
  gold: string;
  cream: string;
  /** Rotation of the knot motif in degrees, 0-45. */
  angle: number;
  /** Which knot variant the entry draws. */
  motif: 0 | 1 | 2;
}

export function templateArt(name: string): TemplateArt {
  const h = hash(name);
  return {
    ink: pick(INK, h, 0),
    gold: pick(GOLD, h, 4),
    cream: pick(CREAM, h, 8),
    angle: (h >>> 12) % 46,
    motif: ((h >>> 20) % 3) as 0 | 1 | 2,
  };
}

/**
 * A cover as an inline SVG string. Used as a `data:` URL so it needs no file
 * on disk and no bucket round trip.
 */
export function templateCoverSvg(name: string, category: string): string {
  const art = templateArt(name);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const motif = [
    // interlaced rings
    `<g stroke="${art.gold}" stroke-width="1.2" fill="none" opacity="0.5">
       <circle cx="200" cy="150" r="62" />
       <circle cx="200" cy="150" r="44" />
       <circle cx="200" cy="150" r="26" />
     </g>`,
    // offset lattice
    `<g stroke="${art.gold}" stroke-width="1" fill="none" opacity="0.45">
       ${Array.from({ length: 7 }, (_, i) => `<path d="M${60 + i * 46} 40 L${100 + i * 46} 260" />`).join('')}
       ${Array.from({ length: 5 }, (_, i) => `<path d="M40 ${70 + i * 46} L360 ${110 + i * 46}" />`).join('')}
     </g>`,
    // corner arcs
    `<g stroke="${art.gold}" stroke-width="1.4" fill="none" opacity="0.5">
       <path d="M40 240 A180 180 0 0 1 220 60" />
       <path d="M60 260 A160 160 0 0 1 240 80" />
       <path d="M80 280 A140 140 0 0 1 260 100" />
     </g>`,
  ][art.motif];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
    <rect width="400" height="300" fill="${art.ink}" />
    <g transform="rotate(${art.angle} 200 150)">${motif}</g>
    <text x="200" y="158" text-anchor="middle" font-family="Marcellus, Georgia, serif"
          font-size="46" fill="${art.cream}" opacity="0.92">${initials}</text>
    <text x="200" y="196" text-anchor="middle" font-family="Manrope, system-ui, sans-serif"
          font-size="11" letter-spacing="2.4" fill="${art.gold}" opacity="0.85">${category.toUpperCase()}</text>
    <rect x="0.5" y="0.5" width="399" height="299" fill="none" stroke="${art.gold}" stroke-opacity="0.28" />
  </svg>`;
}

export function templateCoverUrl(name: string, category: string): string {
  const svg = templateCoverSvg(name, category);
  // encodeURIComponent keeps the Hungarian accents in category labels intact
  // and avoids the base64 round trip for a payload this small.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
