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
  orchestration?: {
    agents: string[];
    capabilities: string[];
    reasons: Record<string, string>;
    teamExecuted: boolean;
    specialistOutputs: Array<{ agent: string; deliverable: string; decisions: string[] }>;
    buildSpec: {
      pages: Array<{ path: string; title: string; sections: string[] }>;
      sections: Array<{ id: string; type: string; title: string; content?: string }>;
      components: Array<{ name: string; purpose: string }>;
      content: Record<string, unknown>;
      interactions: string[];
      responsiveRules: string[];
      acceptanceCriteria: string[];
    };
    qaStatus: 'PASS' | 'BLOCK';
    blockers: string[];
  };
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

/** Envelope shape the function returns on failure. */
type ErrorEnvelope = { error?: string; message?: string; providerNotConfigured?: boolean };

/**
 * Calls the server-side DESIGNLY Master Agent.
 * The browser never receives the AI provider secret.
 * Brief/preview orchestration is free; paid final generation remains behind ai-generate.
 *
 * Every failure path reports which layer broke - config, transport, response
 * format or the service itself - so a failure names its own cause instead of
 * collapsing into one generic "could not connect" line.
 */
export async function runDesignlyMasterAgent(params: {
  brief: string;
  brandKitId?: string | null;
  language?: string;
  requestedOutputs?: DesignOutput[];
  mode?: 'brief' | 'preview' | 'final';
}): Promise<MasterAgentResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { success: false, error: 'NO_SESSION', message: 'Nincs bejelentkezett munkamenet.' };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!supabaseUrl) {
    console.error('DESIGNLY: VITE_SUPABASE_URL is not configured in this build.');
    return {
      success: false,
      error: 'CONFIG_ERROR',
      message: 'A Supabase URL nincs beallitva ebben a buildben (VITE_SUPABASE_URL).',
    };
  }

  const endpoint = `${supabaseUrl}/functions/v1/designly-agent`;
  const startedAt = Date.now();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const elapsed = Date.now() - startedAt;
    const raw = await response.text();

    // Parse defensively: a gateway or CORS error page is not JSON, and a valid
    // JSON body is not necessarily an object.
    let parsed: unknown = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        return {
          success: false,
          error: 'BAD_RESPONSE',
          message: `A szerver nem JSON valaszt adott (${response.status}, ${elapsed}ms).`,
        };
      }
    }

    const envelope: ErrorEnvelope =
      parsed && typeof parsed === 'object' ? (parsed as ErrorEnvelope) : {};

    if (!response.ok) {
      return {
        success: false,
        error: envelope.error || `HTTP_${response.status}`,
        message:
          envelope.message ||
          `A Master Agent ${response.status} statuszkoddal valaszolt (${elapsed}ms).`,
        providerNotConfigured: envelope.providerNotConfigured,
      };
    }

    if (!parsed || typeof parsed !== 'object') {
      return {
        success: false,
        error: 'BAD_RESPONSE',
        message: `A szerver ures vagy ervenytelen valaszt adott (${response.status}, ${elapsed}ms).`,
      };
    }

    return { ...(parsed as MasterAgentResult), success: true };
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    const detail = err instanceof Error ? err.message : String(err);
    console.error('DESIGNLY: Master Agent request failed:', err, { endpoint, elapsed });
    return {
      success: false,
      error: 'FETCH_ERROR',
      message: `Could not connect to the DESIGNLY Master Agent. (${detail} - POST ${endpoint} after ${elapsed}ms)`,
    };
  }
}
