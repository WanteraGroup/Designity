import { supabase } from './supabase';

export interface VisionResult {
  ok: boolean;
  provider?: string;
  model?: string;
  analysis?: string;
  error?: string;
  message?: string;
}

export async function analyzeDesignImage(imageUrl: string, prompt?: string): Promise<VisionResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, error: 'NO_SESSION', message: 'Be kell jelentkezni.' };

  const base = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${base}/functions/v1/designly-vision`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, prompt }),
  });
  return await response.json().catch(() => ({ ok: false, error: 'INVALID_RESPONSE' }));
}

export async function transcribeDesignlyVoice(file: Blob, filename = 'voice.webm'): Promise<{ ok: boolean; text?: string; error?: string; message?: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, error: 'NO_SESSION', message: 'Be kell jelentkezni.' };

  const form = new FormData();
  form.append('file', file, filename);

  const base = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${base}/functions/v1/designly-voice`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  return await response.json().catch(() => ({ ok: false, error: 'INVALID_RESPONSE' }));
}
