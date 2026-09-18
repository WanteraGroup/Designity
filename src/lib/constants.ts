import type { Language, Plan, CreditPackage, GenerationCost, AdFormat, ProjectType } from '@/types';

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

export const PUBLIC_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    creditsMonthly: 10,
    projectLimit: 3,
    features: ['10 credits / month', '3 projects', 'Basic exports (PNG, JPG)', 'Community support'],
  },
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 2990,
    creditsMonthly: 50,
    projectLimit: 15,
    features: ['50 credits / month', '15 projects', 'All export formats', 'Email support', 'Commercial usage'],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 7990,
    creditsMonthly: 200,
    projectLimit: 60,
    features: ['200 credits / month', '60 projects', 'All export formats', 'Brand Kits', 'Priority support', 'Commercial usage'],
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Business',
    priceMonthly: 14990,
    creditsMonthly: 500,
    projectLimit: 200,
    features: ['500 credits / month', '200 projects', 'All export formats', 'Unlimited Brand Kits', 'Team collaboration', 'Priority support'],
  },
  {
    id: 'agency',
    name: 'Agency',
    priceMonthly: 29990,
    creditsMonthly: 1500,
    projectLimit: 1000,
    features: ['1,500 credits / month', '1,000 projects', 'All export formats', 'Unlimited Brand Kits', 'Team collaboration', 'Dedicated manager', 'API access'],
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    priceMonthly: 59990,
    creditsMonthly: 5000,
    projectLimit: 5000,
    features: ['5,000 credits / month', '5,000 projects', 'All export formats', 'Unlimited Brand Kits', 'Team collaboration', 'Priority support', 'API access', 'All premium features'],
  },
];

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'pkg_100', credits: 100, price: 2990, label: '100 credits' },
  { id: 'pkg_500', credits: 500, price: 9990, label: '500 credits' },
  { id: 'pkg_1000', credits: 1000, price: 16990, label: '1,000 credits' },
  { id: 'pkg_2500', credits: 2500, price: 34990, label: '2,500 credits' },
];

export const GENERATION_COSTS: GenerationCost[] = [
  { type: 'social', label: 'Social Media Post', credits: 2 },
  { type: 'business_card', label: 'Business Card', credits: 2 },
  { type: 'invitation', label: 'Invitation', credits: 2 },
  { type: 'flyer', label: 'Flyer', credits: 2 },
  { type: 'menu', label: 'Menu', credits: 2 },
  { type: 'pricelist', label: 'Price List', credits: 2 },
  { type: 'logo', label: 'Logo', credits: 3 },
  { type: 'poster', label: 'Poster', credits: 3 },
  { type: 'advertisement', label: 'Advertisement', credits: 3 },
  { type: 'brand', label: 'Brand Identity', credits: 5 },
  { type: 'landing', label: 'Landing Page', credits: 5 },
  { type: 'brochure', label: 'Brochure', credits: 5 },
  { type: 'presentation', label: 'Presentation', credits: 5 },
  { type: 'website', label: 'Full Website', credits: 10 },
  { type: 'campaign', label: 'Campaign Bundle', credits: 10 },
  { type: 'custom', label: 'Custom Design', credits: 10 },
];

export const AD_FORMATS: AdFormat[] = [
  { id: 'print_a4', label: 'A4', width: 2480, height: 3508, type: 'print' },
  { id: 'print_a3', label: 'A3', width: 3508, height: 4961, type: 'print' },
  { id: 'print_a2', label: 'A2', width: 4961, height: 7016, type: 'print' },
  { id: 'print_a1', label: 'A1', width: 7016, height: 9933, type: 'print' },
  { id: 'digital_square', label: 'Square', width: 1080, height: 1080, type: 'digital' },
  { id: 'digital_portrait', label: 'Portrait', width: 1080, height: 1350, type: 'digital' },
  { id: 'digital_landscape', label: 'Landscape', width: 1920, height: 1080, type: 'digital' },
  { id: 'digital_facebook', label: 'Facebook', width: 1200, height: 628, type: 'digital' },
  { id: 'digital_instagram_post', label: 'Instagram Post', width: 1080, height: 1080, type: 'digital' },
  { id: 'digital_instagram_story', label: 'Instagram Story', width: 1080, height: 1920, type: 'digital' },
  { id: 'digital_tiktok', label: 'TikTok', width: 1080, height: 1920, type: 'digital' },
  { id: 'digital_linkedin', label: 'LinkedIn', width: 1200, height: 627, type: 'digital' },
  { id: 'digital_banner', label: 'Web Banner', width: 728, height: 90, type: 'digital' },
];

export const DESIGN_STYLES = [
  'premium', 'luxury', 'minimal', 'modern', 'corporate', 'elegant',
  'bold', 'cinematic', 'automotive', 'fashion', 'restaurant', 'real_estate',
  'technology', 'industrial', 'creative',
];

export const CAMPAIGN_FORMATS = [
  { id: 'poster', labelKey: 'campaign.fmtPoster' },
  { id: 'flyer', labelKey: 'campaign.fmtFlyer' },
  { id: 'facebook', labelKey: 'campaign.fmtFacebook' },
  { id: 'instagram_post', labelKey: 'campaign.fmtInstagram' },
  { id: 'instagram_story', labelKey: 'campaign.fmtStory' },
  { id: 'tiktok', labelKey: 'campaign.fmtTiktok' },
  { id: 'linkedin', labelKey: 'campaign.fmtLinkedin' },
  { id: 'banner', labelKey: 'campaign.fmtBanner' },
];

export const AI_VARIATION_COMMANDS = [
  'more_premium', 'more_minimal', 'more_professional', 'more_elegant',
  'more_bold', 'regenerate', 'change_headline', 'change_colors',
  'change_image', 'change_layout',
];

export function getCreditsForType(type: string): number {
  const cost = GENERATION_COSTS.find((c) => c.type === type);
  return cost ? cost.credits : 10;
}

export function formatPrice(ft: number): string {
  return new Intl.NumberFormat('hu-HU').format(ft) + ' Ft';
}

export const TEMPLATE_CATEGORIES = [
  'Business', 'Restaurant', 'Real Estate', 'Beauty', 'Fitness',
  'Technology', 'Events', 'Wedding', 'Personal', 'E-commerce', 'Marketing', 'Corporate',
];
