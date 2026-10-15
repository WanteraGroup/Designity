// designly-agent — the planning and site-building agent.
//
// Two agents share this function because they share a charge model and a
// provider call; only the system prompt and the credit type differ.
//
//   agent: "polish"  brief  -> design plan        charged at the plan's type
//   agent: "site"    plan   -> site document      charged at the plan's type
//
// Credits are reserved before the provider call and released on failure, so a
// provider timeout cannot bill the user for a page that was never built.

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
  agent?: 'polish' | 'site';
  brief?: string;
  language?: string;
  plan?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const agent = body.agent ?? 'polish';
  if (agent !== 'polish' && agent !== 'site') {
    return json({ error: `Unknown agent "${agent}" for this function` }, 400);
  }

  const supabase = adminClient();

  // Anonymous callers are allowed one thing only: polishing a brief into a
  // plan, so the landing page can preview a result before signup. Anything
  // that produces a document for saving requires a session.
  const { userId, error: authError } = await resolveUserId(req, supabase);
  if (authError) return json({ error: 'Invalid session' }, 401);
  if (!userId && agent !== 'polish') {
    return json({ error: 'Sign in to build a page' }, 401);
  }

  const started = Date.now();

  try {
    if (agent === 'polish') {
      const brief = (body.brief ?? '').trim();
      if (!brief) return json({ error: 'A brief is required' }, 400);
      if (brief.length > 4000) {
        return json({ error: 'That brief is too long — keep it under 4000 characters' }, 400);
      }

      const language = (body.language ?? 'hu').slice(0, 5);
      const document = await callProvider(
        systemPromptFor('polish'),
        `Language for all user-facing text: ${language}\n\nBrief:\n${brief}`,
        { temperature: 0.6 },
      );

      return json({
        document,
        creditsCharged: 0,
        durationMs: Date.now() - started,
      });
    }

    // agent === 'site'
    const profile = await loadProfile(supabase, userId!);
    if (!profile) return json({ error: 'Profile not found' }, 404);

    const plan = body.plan;
    if (!plan || typeof plan !== 'object') {
      return json({ error: 'A plan is required to build a page' }, 400);
    }

    const type = (plan.project_type as string) ?? 'website';
    const cost = await creditCost(supabase, type);
    const unlimited = profile.role === 'owner' || profile.unlimited_access;

    // Reserve. deduct_credits locks the row and returns false on a shortfall,
    // so two concurrent builds cannot both spend the same balance.
    if (!unlimited) {
      const { data: charged, error: chargeError } = await supabase.rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: cost,
        p_description: `Generation: ${type}`,
      });

      if (chargeError) {
        return json({ error: `Could not reserve credits: ${chargeError.message}` }, 500);
      }
      if (charged !== true) {
        return json(
          {
            error: 'Not enough credits for this generation',
            insufficient_credits: true,
            credits_required: cost,
          },
          402,
        );
      }
    }

    try {
      const document = await callProvider(
        systemPromptFor('site'),
        `Build the website for this plan:\n\n${JSON.stringify(plan, null, 2)}`,
        { temperature: 0.7, maxTokens: 8192 },
      );

      return json({
        document,
        creditsCharged: unlimited ? 0 : cost,
        durationMs: Date.now() - started,
      });
    } catch (providerError) {
      // Release what was reserved. A failed generation is not billable.
      if (!unlimited) {
        await supabase.rpc('refund_credits', {
          p_user_id: userId,
          p_amount: cost,
          p_description: `Refund: failed ${type} generation`,
        });
      }
      throw providerError;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('designly-agent failed', message);
    return json({ error: message }, 500);
  }
});
