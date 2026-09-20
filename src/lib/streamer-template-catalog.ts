export type StreamerTemplateSeed = {
  style: string;
  layout: string;
  motif: string;
  palette: string;
  typography: string;
};

export const STREAMER_TEMPLATE_AXES = {
  styles: [
    'tech_noir','gaming','esports','cyberpunk','neon',
    'nordic','celtic','minimal','retro','dark_fantasy'
  ],
  layouts: [
    'edge_hud','full_frame','split_screen','clean_minimal',
    'glass_panel','center_stage'
  ],
  motifs: [
    'raven','wolf','dragon','skull','tiger','oni',
    'mech','phoenix','viking','galaxy','flame','lightning'
  ],
  palettes: [
    'black_gold_silver','black_neon_blue','black_red',
    'purple_cyan','acid_green_black','white_black_gold',
    'orange_black','ice_blue_white','crimson_silver',
    'violet_gold'
  ],
  typography: [
    'bold_condensed','esports_block','futuristic',
    'sharp_serif','clean_sans','rune_display'
  ],
} as const;

export const STREAMER_TEMPLATE_COUNT =
  STREAMER_TEMPLATE_AXES.styles.length *
  STREAMER_TEMPLATE_AXES.layouts.length *
  STREAMER_TEMPLATE_AXES.motifs.length *
  STREAMER_TEMPLATE_AXES.palettes.length *
  STREAMER_TEMPLATE_AXES.typography.length;

export const STREAMER_TEMPLATE_COUNT_LABEL =
  STREAMER_TEMPLATE_COUNT >= 100000
    ? '100 000+'
    : STREAMER_TEMPLATE_COUNT.toLocaleString('hu-HU');

export function getStreamerTemplate(index: number): StreamerTemplateSeed {
  const safeIndex = Math.max(0, Math.floor(index)) % STREAMER_TEMPLATE_COUNT;
  const pick = <T,>(items: readonly T[], offset: number) =>
    items[Math.floor(safeIndex / offset) % items.length];

  return {
    style: pick(STREAMER_TEMPLATE_AXES.styles, 1),
    layout: pick(STREAMER_TEMPLATE_AXES.layouts, STREAMER_TEMPLATE_AXES.styles.length),
    motif: pick(STREAMER_TEMPLATE_AXES.motifs, STREAMER_TEMPLATE_AXES.styles.length * STREAMER_TEMPLATE_AXES.layouts.length),
    palette: pick(
      STREAMER_TEMPLATE_AXES.palettes,
      STREAMER_TEMPLATE_AXES.styles.length *
        STREAMER_TEMPLATE_AXES.layouts.length *
        STREAMER_TEMPLATE_AXES.motifs.length
    ),
    typography: pick(
      STREAMER_TEMPLATE_AXES.typography,
      STREAMER_TEMPLATE_AXES.styles.length *
        STREAMER_TEMPLATE_AXES.layouts.length *
        STREAMER_TEMPLATE_AXES.motifs.length *
        STREAMER_TEMPLATE_AXES.palettes.length
    ),
  };
}

export function buildStreamerTemplatePrompt(
  seed: StreamerTemplateSeed,
  assetLabel: string,
  platform: string,
  size: string,
  creator: string,
  handle: string,
  brief: string,
) {
  return [
    'DESIGNLY STREAMER TEMPLATE FACTORY',
    'Create a production-ready streamer/gamer template variation.',
    `ASSET: ${assetLabel}`,
    `PLATFORM: ${platform}`,
    `SIZE: ${size}`,
    `STYLE: ${seed.style}`,
    `LAYOUT: ${seed.layout}`,
    `MOTIF: ${seed.motif}`,
    `PALETTE: ${seed.palette}`,
    `TYPOGRAPHY: ${seed.typography}`,
    `CREATOR: ${creator}`,
    `HANDLE: ${handle}`,
    `BRIEF: ${brief || 'Premium high-contrast gaming identity with clear safe zones and strong focal hierarchy.'}`,
    'Return a coherent visual system that can be reused across the creator asset family.',
  ].join('\\n');
}

export const STREAMER_TEMPLATE_PREVIEWS = Array.from(
  { length: 12 },
  (_, index) => ({
    id: `stream-template-${index + 1}`,
    seed: getStreamerTemplate(index * 173),
  }),
);
