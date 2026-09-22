// Shared helpers for the v2 agent functions.
//
// The provider key lives only in this directory's environment: nothing here is
// ever imported by the client bundle.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function preflight(): Response {
  return new Response('ok', { headers: corsHeaders });
}

/** Service-role client. Bypasses RLS — every use is deliberate. */
export function adminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Supabase service credentials are not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

/** The caller's user id, or null for an anonymous request. */
export async function resolveUserId(
  req: Request,
  supabase: SupabaseClient,
): Promise<{ userId: string | null; error: string | null }> {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return { userId: null, error: null };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { userId: null, error: error?.message ?? 'invalid token' };
  return { userId: data.user.id, error: null };
}

export interface ProfileRow {
  id: string;
  role: 'owner' | 'admin' | 'user';
  credits: number;
  unlimited_access: boolean;
  plan_id: string;
}

export async function loadProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, role, credits, unlimited_access, plan_id')
    .eq('id', userId)
    .maybeSingle();
  return (data as ProfileRow) ?? null;
}

/** Per-type credit cost, read from system_settings with a code fallback. */
export async function creditCost(
  supabase: SupabaseClient,
  type: string,
): Promise<number> {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'generation_costs')
    .maybeSingle();

  const table = (data?.value ?? {}) as Record<string, number>;
  return table[type] ?? table.custom ?? 10;
}

/**
 * Provider call. Groq keeps UTF-8 intake, which matters because every brief
 * here arrives in Hungarian and "ő" and "ű" survive whatever the transport
 * does. The response is parsed as JSON with the fences stripped, since models
 * ignore "no code fences" often enough that a strict parse is not reliable.
 */
export async function callProvider(
  systemPrompt: string,
  userMessage: string,
  opts: { model?: string; temperature?: number; maxTokens?: number } = {},
): Promise<Record<string, unknown>> {
  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) throw new Error('GROQ_API_KEY is not set on this function');

  const model =
    opts.model ?? Deno.env.get('DESIGNLY_GROQ_MODEL') ?? 'openai/gpt-oss-120b';

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
      // JSON Object Mode: tool use and Structured Outputs are separate modes
      // in this API, so the compound path uses this instead.
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Provider error ${res.status}: ${detail.slice(0, 300)}`);
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = payload.choices?.[0]?.message?.content ?? '';
  return parseJsonLoose(raw);
}

/** Strips a ```json fence, then a leading/trailing brace trim, then parses. */
export function parseJsonLoose(raw: string): Record<string, unknown> {
  let text = raw.trim();

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    }
    throw new Error('Model did not return JSON');
  }
}
