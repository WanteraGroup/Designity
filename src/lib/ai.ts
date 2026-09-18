import { supabase } from './supabase';

export interface GenerationParams {
  /** Final generation only. Preview requests are handled by designly-agent and never reach this endpoint. */
  mode?: 'final';
  type: string;
  brief: string;
  brandKitId?: string | null;
  style?: string;
  format?: string;
  projectId?: string;
  campaignId?: string;
  previewId?: string;
}

export interface GenerationResult {
  success: boolean;
  jobId?: string;
  result?: Record<string, unknown>;
  creditsUsed?: number;
  error?: string;
  errorCode?: string;
  message?: string;
  providerNotConfigured?: boolean;
  required?: number;
  balance?: number;
}

/**
 * Calls the server-side AI generation edge function.
 * Credits are deducted server-side — never trusted from the client.
 * If the AI provider is not configured, returns a structured error.
 */
export async function generateDesign(params: GenerationParams): Promise<GenerationResult> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      return { success: false, error: 'No session', errorCode: 'NO_SESSION' };
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/ai-generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'GENERATION_FAILED',
        errorCode: data.error,
        message: data.message,
        providerNotConfigured: data.providerNotConfigured,
        required: data.required,
        balance: data.balance,
      };
    }

    return {
      success: true,
      jobId: data.jobId,
      result: data.result,
      creditsUsed: data.creditsUsed,
    };
  } catch (err) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Could not connect to the generation service.',
    };
  }
}

export interface CheckoutParams {
  itemType: 'subscription' | 'credit_package';
  itemId: string;
}

export interface CheckoutResult {
  success: boolean;
  paymentId?: string;
  checkoutUrl?: string;
  provider?: string;
  error?: string;
  message?: string;
  providerNotConfigured?: boolean;
}

/**
 * Calls the server-side payment checkout edge function.
 * The server resolves the active provider — the client never
 * needs to know which provider is configured.
 * Returns a checkout URL if a provider is configured, or a
 * structured "not configured" response if not.
 */
export async function createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      return { success: false, error: 'No session' };
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/payment-checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'CHECKOUT_FAILED',
        message: data.message,
        providerNotConfigured: data.providerNotConfigured,
      };
    }

    return {
      success: true,
      paymentId: data.paymentId,
      checkoutUrl: data.checkoutUrl,
      provider: data.provider,
    };
  } catch (err) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Could not connect to the payment service.',
    };
  }
}

export interface PaymentStatusResult {
  success: boolean;
  status?: 'pending' | 'succeeded' | 'failed';
  amount?: number;
  currency?: string;
  type?: string;
  provider?: string;
  error?: string;
}

/**
 * Queries the server for the current status of a payment.
 * Used after redirect from a payment-link flow to check
 * whether payment has been confirmed server-side.
 */
export async function getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      return { success: false, error: 'No session' };
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/payment-checkout?paymentId=${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'PAYMENT_NOT_FOUND' };
    }

    return {
      success: true,
      status: data.payment?.status,
      amount: data.payment?.amount,
      currency: data.payment?.currency,
      type: data.payment?.type,
      provider: data.payment?.provider,
    };
  } catch (err) {
    return { success: false, error: 'NETWORK_ERROR' };
  }
}
