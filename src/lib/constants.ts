import type {
  AdFormat as _AdFormat,
  Language,
  Plan,
  CreditPackage,
  GenerationCost,
  ProjectType,
} from '@/types';

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'hu', name: 'Magyar', flag: 'HU' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'fr', name: 'Français', flag: 'FR' },
  { code: 'es', name: 'Español', flag: 'ES' },
  { code: 'it', name: 'Italiano', flag: 'IT' },
  { code: 'pl', name: 'Polski', flag: 'PL' },
  { code: 'uk', name: 'Українська', flag: 'UK' },
  { code: 'ro', name: 'Română', flag: 'RO' },
  { code: 'nl', name: 'Nederlands', flag: 'NL' },
];

/**
 * The plan ladder. Prices and allowances are mirrored in the `plans` table
 * and the credit table below — when one moves, all three move together.
 */
export const PUBLIC_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    creditsMonthly: 20,
    projectLimit: 3,
    features: ['20 credits / month', '3 projects', 'PNG / JPG export', 'Community support'],
  },
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 2990,
    creditsMonthly: 150,
    projectLimit: 15,
    features: [
      '150 credits / month',
      '15 projects',
      'All export formats',
      'Email support',
      'Commercial usage',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 7990,
    creditsMonthly: 500,
    projectLimit: 60,
    features: [
      '500 credits / month',
      '60 projects',
      'All export formats',
      'Brand Kits',
      'Priority support',
      'Commercial usage',
    ],
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Business',
    priceMonthly: 14990,
    creditsMonthly: 1200,
    projectLimit: 200,
    features: [
      '1,200 credits / month',
      '200 projects',
      'All export formats',
      'Unlimited Brand Kits',
      'Team collaboration',
      'Priority support',
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    priceMonthly: 29990,
    creditsMonthly: 3000,
    projectLimit: 1000,
    features: [
      '3,000 credits / month',
      '1,000 projects',
      'All export formats',
      'Unlimited Brand Kits',
      'Team collaboration',
      'Dedicated manager',
      'API access',
    ],
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    priceMonthly: 59990,
    creditsMonthly: 7500,
    projectLimit: 5000,
    features: [
      '7,500 credits / month',
      '5,000 projects',
      'Unlimited Brand Kits',
      'Team collaboration',
      'Priority support',
      'API access',
      'All premium features',
    ],
  },
];

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'pkg_100', credits: 100, price: 2990, label: '100 kredit' },
  { id: 'pkg_500', credits: 500, price: 12990, label: '500 kredit' },
  { id: 'pkg_1000', credits: 1000, price: 22990, label: '1 000 kredit' },
  { id: 'pkg_2500', credits: 2500, price: 49990, label: '2 500 kredit' },
  { id: 'pkg_5000', credits: 5000, price: 89990, label: '5 000 kredit' },
  { id: 'pkg_10000', credits: 10000, price: 159990, label: '10 000 kredit' },
];

/**
 * Per-type credit costs. Must agree with the `generation_costs` row in
 * `system_settings`, which is what the server charges against.
 */
export const GENERATION_COSTS: GenerationCost[] = [
  { type: 'social', label: 'Social Media Post', credits: 2 },
  { type: 'business_card', label: 'Business Card', credits: 2 },
  { type: 'invitation', label: 'Invitation', credits: 2 },
  { type: 'flyer', label: 'Flyer', credits: 2 },
  { type: 'menu', label: 'Menu', credits: 2 },
  { type: 'pricelist', label: 'Price List', credits: 2 },
  { type: 'poster', label: 'Poster', credits: 3 },
  { type: 'logo', label: 'Logo', credits: 3 },
  { type: 'advertisement', label: 'Advertisement', credits: 3 },
  { type: 'banner', label: 'Web Banner', credits: 3 },
  { type: 'brochure', label: 'Brochure', credits: 5 },
  { type: 'brand', label: 'Brand Identity', credits: 5 },
  { type: 'presentation', label: 'Presentation', credits: 5 },
  { type: 'landing', label: 'Landing Page', credits: 5 },
  { type: 'campaign', label: 'Campaign Bundle', credits: 10 },
  { type: 'website', label: 'Full Website + AI Team', credits: 10 },
  { type: 'custom', label: 'Custom Design', credits: 10 },
];

export function getCreditsForType(type: string): number {
  return GENERATION_COSTS.find((c) => c.type === type)?.credits ?? 10;
}

/** Bold, cinematic directions the brief builder can offer as presets. */
export const DESIGN_STYLES = [
  'premium', 'luxury', 'minimal', 'modern', 'corporate', 'elegant', 'bold', 'cinematic',
  'automotive', 'fashion', 'restaurant', 'real_estate', 'technology', 'industrial', 'creative',
  'nordic', 'celtic', 'editorial', 'art_deco', 'brutalist', 'futuristic', 'organic', 'tech_noir',
  'high_fashion', 'architectural', 'dark_academia', 'soft_luxury',
];

export const TEMPLATE_CATEGORIES = [
  'Business', 'Restaurant', 'Real Estate', 'Beauty', 'Fitness', 'Technology', 'Events', 'Wedding',
  'Personal', 'E-commerce', 'Marketing', 'Corporate', 'Automotive', 'Hospitality', 'Healthcare',
  'Education', 'Finance', 'Construction', 'Fashion', 'Travel', 'Creator', 'Gaming', 'Nonprofit', 'Luxury',
];

export const DISPLAY_EUR_HUF_RATE = 400;

/**
 * Hungarian pricing is quoted in forint, so the always-shown amount is HUF.
 * Every other language sees the same number converted at a static display
 * rate — this is a label, not a billing rate.
 */
export function formatPrice(ft: number, lang = 'hu'): string {
  if (lang !== 'hu') {
    const eur = ft / DISPLAY_EUR_HUF_RATE;
    const locale = lang === 'uk' ? 'uk-UA' : lang;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(eur);
  }
  return new Intl.NumberFormat('hu-HU').format(ft) + ' Ft';
}
