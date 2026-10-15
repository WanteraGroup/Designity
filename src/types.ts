export type AppRole = 'owner' | 'admin' | 'user';

export type PlanId =
  | 'free'
  | 'starter'
  | 'pro'
  | 'business'
  | 'agency'
  | 'ultimate'
  | 'owner';

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

/**
 * The sixteen types the `projects.type` CHECK constraint accepts. These two
 * must stay in step: a type the client offers but the schema rejects fails at
 * insert time, which is exactly how Wave 1 drifted.
 */
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

export type CreditTransactionType =
  | 'generation'
  | 'subscription'
  | 'purchase'
  | 'refund'
  | 'admin_grant'
  | 'campaign';

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: CreditTransactionType;
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
  type: ProjectType | 'custom';
  /** Null for the twelve launch entries, which ship without artwork. */
  thumbnail_url: string | null;
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
  phone: string | null;
  created_at: string;
}
