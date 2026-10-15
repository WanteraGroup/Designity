import { systemPromptFor, type AgentName } from '@/lib/ai-prompts';

/**
 * Client for the v2 agent functions.
 *
 * Every call goes through a Supabase Edge Function: the provider key lives in
 * the function's secret store and never reaches the bundle. The client sends
 * the agent name and its payload, and gets structured JSON back.
 */

export interface AgentError {
  error: string;
  /** True when the failure is a credit shortfall rather than a provider fault. */
  insufficientCredits?: boolean;
  creditsRequired?: number;
}

export interface GenerateResult {
  /** The design document the renderer consumes. Shape per agent. */
  document: Record<string, unknown>;
  creditsCharged: number;
  durationMs: number;
}

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callFunction<T>(
  name: string,
  payload: Record<string, unknown>,
  accessToken: string | undefined,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken ?? ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify(payload),
    signal,
  });

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const err: AgentError = {
      error: (body.error as string) ?? `Request failed (${res.status})`,
      insufficientCredits: body.insufficient_credits === true,
      creditsRequired: body.credits_required as number | undefined,
    };
    throw Object.assign(new Error(err.error), err);
  }

  return body as T;
}

/**
 * Agent call with one retry on a transport fault. A 4xx is a real answer and
 * is never retried; only a dropped connection or a 5xx is.
 */
async function callWithRetry<T>(
  name: string,
  payload: Record<string, unknown>,
  accessToken: string | undefined,
  signal?: AbortSignal,
): Promise<T> {
  try {
    return await callFunction<T>(name, payload, accessToken, signal);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 0;
    if (status >= 400 && status < 500) throw e;
    return callFunction<T>(name, payload, accessToken, signal);
  }
}

export const ai = {
  /** Turn a free-form brief into a structured design plan. */
  polish(brief: string, language: string, accessToken?: string, signal?: AbortSignal) {
    return callWithRetry<GenerateResult>('designly-agent', { agent: 'polish', brief, language }, accessToken, signal);
  },

  /** Build the website document from a plan. */
  buildSite(plan: Record<string, unknown>, accessToken?: string, signal?: AbortSignal) {
    return callWithRetry<GenerateResult>('designly-agent', { agent: 'site', plan }, accessToken, signal);
  },

  /** Apply a natural-language refinement to an existing document. */
  edit(
    document: Record<string, unknown>,
    instruction: string,
    language: string,
    accessToken?: string,
    signal?: AbortSignal,
  ) {
    return callWithRetry<GenerateResult>(
      'designly-editor-ai',
      { document, instruction, language },
      accessToken,
      signal,
    );
  },

  /** Exposed so tests and previews can read the exact wording sent. */
  systemPromptFor,
};
