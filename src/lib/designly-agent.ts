import { supabase } from './supabase';

export type DesignOutput =
  | 'logo' | 'brand_identity' | 'business_card' | 'flyer' | 'poster'
  | 'social_post' | 'social_story' | 'price_list' | 'landing_page'
  | 'website' | 'presentation' | 'brochure' | 'invitation' | 'digital_business_card' | 'menu' | 'banner' | 'campaign' | 'custom';

export interface DesignBrief {
  businessName: string | null;
  businessType: string | null;
  targetAudience: string | null;
  industry: string | null;
  visualStyle: string | null;
  mood: string | null;
  primaryColors: string[];
  secondaryColors: string[];
  typographyDirection: string | null;
  imageryDirection: string | null;
  requiredOutputs: DesignOutput[];
  language: string;
  additionalInstructions: string | null;
}

export interface MasterAgentResult {
  success: boolean;
  mode?: 'brief' | 'preview' | 'final';
  preview?: boolean;
  creditsUsed?: number;
  previewId?: string | null;
  previewImageUrl?: string | null;
  activeAgents?: string[];
  designBrief?: DesignBrief;
  orchestration?: { agents: string[]; capabilities: string[]; reasons: Record<string, string>; teamExecuted: boolean; specialistOutputs: Array<{ agent: string; deliverable: string; decisions: string[] }>; buildSpec: { pages: Array<{ path: string; title: string; sections: string[] }>; sections: Array<{ id: string; type: string; title: string; content?: string }>; components: Array<{ name: string; purpose: string }>; content: Record<string, unknown>; interactions: string[]; responsiveRules: string[]; acceptanceCriteria: string[] }; qaStatus: 'PASS' | 'BLOCK'; blockers: string[]; };
  specialistPlan?: {
    brand: boolean;
    web: boolean;
    social: boolean;
    marketing: boolean;
    content: boolean;
  };
  error?: string;
  message?: string;
  providerNotConfigured?: boolean;
}

/**
 * Calls the server-side DESIGNLY Master Agent.
 * The browser never receives the AI provider secret.
 * Brief/preview orchestration is free; paid final generation remains behind ai-generate.
 */
export async function runDesignlyMasterAgent(params: {
  brief: string;
  brandKitId?: string | null;
  language?: string;
  requestedOutputs?: DesignOutput[];
  mode?: 'brief' | 'preview' | 'final';
}): Promise<MasterAgentResult> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { success: false, error: 'NO_SESSION' };

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/designly-agent`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const result = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'GENERATION_FAILED',
        message: result.message,
        providerNotConfigured: result.providerNotConfigured,
      };
    }

    return result as MasterAgentResult;
  } catch {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Could not connect to the DESIGNLY Master Agent.',
    };
  }
}
