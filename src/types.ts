export type AppRole = 'owner' | 'admin' | 'user';

export type PlanId = 'free' | 'starter' | 'pro' | 'business' | 'agency' | 'ultimate' | 'owner';

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  creditsMonthly: number;
  projectLimit: number;
  features: string[];
  highlighted?: boolean;
  isOwner?: boolean;
}

export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  label: string;
}

export interface GenerationCost {
  type: ProjectType;
  label: string;
  credits: number;
}

export type ProjectType =
  | 'website'
  | 'landing'
  | 'logo'
  | 'brand'
  | 'business_card'
  | 'invitation'
  | 'flyer'
  | 'social'
  | 'brochure'
  | 'menu'
  | 'presentation'
  | 'poster'
  | 'advertisement'
  | 'banner'
  | 'pricelist'
  | 'campaign'
  | 'custom';

export type ProjectStatus = 'draft' | 'generating' | 'completed' | 'failed';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  brief: string;
  brand_kit_id: string | null;
  preview_url: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BrandKit {
  id: string;
  user_id: string;
  name: string;
  industry: string;
  colors: string[];
  fonts: { heading: string; body: string };
  tone: string;
  logo_url: string | null;
  style_keywords: string[];
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'generation' | 'subscription' | 'purchase' | 'refund' | 'admin_grant' | 'campaign';
  description: string;
  balance_after: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: PlanId;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  type: 'subscription' | 'credit_package';
  status: 'pending' | 'succeeded' | 'failed';
  provider: string;
  provider_payment_id: string | null;
  created_at: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  type: ProjectType;
  thumbnail_url: string;
  premium: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  role: AppRole;
  plan_id: PlanId;
  credits: number;
  unlimited_access: boolean;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface AdFormat {
  id: string;
  label: string;
  width: number;
  height: number;
  type: 'print' | 'digital';
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  brief: string;
  brand_kit_id: string | null;
  style: string;
  status: ProjectStatus;
  formats: string[];
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CampaignItem {
  id: string;
  campaign_id: string;
  user_id: string;
  format: string;
  project_id: string | null;
  name: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  preview_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface AiGenerationJob {
  id: string;
  user_id: string;
  project_id: string | null;
  campaign_id: string | null;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider: string;
  credits_cost: number;
  result: Record<string, unknown>;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}
