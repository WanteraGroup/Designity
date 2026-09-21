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
  previewMode?: 'ai' | 'fallback';
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
    if (!supabaseUrl) {
      // Surface the real cause instead of a generic network message: without
      // this the request would silently target "undefined/functions/v1/...".
      console.error('DESIGNLY: VITE_SUPABASE_URL is not configured in this build.');
      return {
        success: false,
        error: 'CONFIG_ERROR',
        message: 'A Supabase URL nincs beallitva ehhez a buildhez (VITE_SUPABASE_URL).',
      };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/designly-agent`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const raw = await response.text();
    let result: MasterAgentResult & { error?: string; message?: string } = {} as never;
    try {
      result = raw ? JSON.parse(raw) : ({} as never);
    } catch {
      // A non-JSON body is usually an infrastructure error (gateway/CORS page).
      result = {
        error: 'BAD_RESPONSE',
        message: `A szerver nem JSON valaszt adott (${response.status}).`,
      } as never;
    }

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'GENERATION_FAILED',
        message: result.message || `A szerver ${response.status} hibat adott.`,
        providerNotConfigured: result.providerNotConfigured,
      };
    }

    return result as MasterAgentResult;
  } catch (err) {
    // Keep the real reason visible - the previous version collapsed every
    // failure into one generic message, which hid CORS, DNS and TLS errors.
    const detail = err instanceof Error ? err.message : String(err);
    console.error('DESIGNLY Master Agent request failed:', err);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: `Could not connect to the DESIGNLY Master Agent. (${detail})`,
    };
  }
}
