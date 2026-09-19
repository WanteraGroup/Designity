import { supabase } from './supabase';

export interface HuginnResult {
  ok: boolean;
  reply?: string;
  action?: string | null;
  error?: string;
}

export async function askHuginn(message: string, language: string): Promise<HuginnResult> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) return { ok: false, error: 'NO_SUPABASE_URL' };
  try {
    const { data } = await supabase.auth.getSession();
    const response = await fetch(`${url}/functions/v1/designly-huginn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
      },
      body: JSON.stringify({ message: message.trim(), language }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: result.error || 'HUGINN_UNAVAILABLE' };
    return result as HuginnResult;
  } catch {
    return { ok: false, error: 'NETWORK_ERROR' };
  }
}
