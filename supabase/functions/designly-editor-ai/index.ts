// designly-editor-ai — the in-place refinement agent.
//
// Takes the current document plus a natural-language instruction and returns
// the smallest diff that satisfies it. The client applies the diff; this
// function never returns a whole new document, so a refinement cannot
// restructure a page the user did not ask to restructure.
//
// Charged at the ai_edit rate (1 credit), refunded on provider failure.

import {
  adminClient,
  callProvider,
  creditCost,
  json,
  loadProfile,
  preflight,
  resolveUserId,
} from '../_shared/agent.ts';
import { systemPromptFor } from '../_shared/prompts.ts';

interface Body {
  document?: Record<string, unknown>;
  instruction?: string;
  language?: string;
}

/**
 * The diff is only as safe as the paths it names, so the shape is checked
 * here: a path must be a dotted string, and the list is capped. The client
 * re-checks every path against the document it holds before writing.
 */
function normaliseEdits(raw: unknown): { path: string; value: unknown }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is { path: string; value: unknown } =>
      !!e && typeof e === 'object' && typeof (e as { path?: unknown }).path === 'string',
    )
    .map((e) => ({ path: e.path, value: e.value }))
    .slice(0, 8);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabase = adminClient();
  const { userId, error: authError } = await resolveUserId(req, supabase);
  if (authError) return json({ error: 'Invalid session' }, 401);
  if (!userId) return json({ error: 'Sign in to edit a design' }, 401);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const instruction = (body.instruction ?? '').trim();
  if (!instruction) return json({ error: 'An instruction is required' }, 400);
  if (instruction.length > 1000) {
    return json({ error: 'That instruction is too long — keep it under 1000 characters' }, 400);
  }
  if (!body.document || typeof body.document !== 'object') {
    return json({ error: 'A document is required' }, 400);
  }

  const started = Date.now();

  try {
    const profile = await loadProfile(supabase, userId);
    if (!profile) return json({ error: 'Profile not found' }, 404);

    const cost = await creditCost(supabase, 'ai_edit');
    const unlimited = profile.role === 'owner' || profile.unlimited_access;

    if (!unlimited) {
      const { data: charged, error: chargeError } = await supabase.rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: cost,
        p_description: 'AI edit',
      });

      if (chargeError) {
        return json({ error: `Could not reserve credits: ${chargeError.message}` }, 500);
      }
      if (charged !== true) {
        return json(
          {
            error: 'Not enough credits for this edit',
            insufficient_credits: true,
            credits_required: cost,
          },
          402,
        );
      }
    }

    try {
      const language = (body.language ?? 'hu').slice(0, 5);
      const result = await callProvider(
        systemPromptFor('editor'),
        [
          `Reply language: ${language}`,
          '',
          'Current design document:',
          JSON.stringify(body.document),
          '',
          `Requested change: ${instruction}`,
        ].join('\n'),
        { temperature: 0.3, maxTokens: 2048 },
      );

      return json({
        document: {
          reply: typeof result.reply === 'string' ? result.reply : '',
          edits: normaliseEdits(result.edits),
        },
        creditsCharged: unlimited ? 0 : cost,
        durationMs: Date.now() - started,
      });
    } catch (providerError) {
      if (!unlimited) {
        await supabase.rpc('refund_credits', {
          p_user_id: userId,
          p_amount: cost,
          p_description: 'Refund: failed AI edit',
        });
      }
      throw providerError;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('designly-editor-ai failed', message);
    return json({ error: message }, 500);
  }
});
