import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerationRequest {
  mode?: "final";
  type: string;
  brief: string;
  brandKitId?: string | null;
  style?: string;
  format?: string;
  projectId?: string;
  campaignId?: string;
  previewId?: string;
}

/**
 * AI Generation Edge Function
 *
 * This function provides a server-side AI provider abstraction.
 * It deducts credits atomically, calls the configured AI provider,
 * and records the generation job. If the provider is not configured,
 * it returns a structured "not configured" response — never fakes success.
 *
 * Supported providers (via AI_PROVIDER env var):
 * - "none" (default): returns provider-not-configured
 * - "openai": calls OpenAI API
 * - Future providers can be added in the provider switch
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
    let supabaseKey: string | undefined;
    try {
      supabaseKey = secretKeysRaw ? JSON.parse(secretKeysRaw)["default"] : undefined;
    } catch {
      supabaseKey = undefined;
    }
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    // Separate service client for Storage uploads; the user-scoped client
    // intentionally keeps the caller's JWT for RLS-protected database work.
    const storageClient = createClient(supabaseUrl, supabaseKey);

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: GenerationRequest = await req.json();
    const { type, brief, brandKitId, style, format, projectId, campaignId, previewId } = body;

    // Paid generation endpoint is intentionally final-only.
    // Free previews are handled by designly-agent and never deduct credits here.
    if (body.mode && body.mode !== "final") {
      return new Response(JSON.stringify({ error: "INVALID_GENERATION_MODE", message: "Preview generation must use the free DESIGNLY Master Agent." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!type || !brief) {
      return new Response(JSON.stringify({ error: "Missing type or brief" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load the user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, credits, plan_id, unlimited_access")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine credit cost from system_settings
    const { data: costSetting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "generation_costs")
      .maybeSingle();

    const costs = costSetting?.value || {};
    const creditCost = (costs as Record<string, number>)[type] ?? 10;

    // An approved preview is already the finished visual, so finalization
    // does not require another AI provider call. Provider configuration is
    // only required for legacy generations that have no approved preview.
    const aiProvider = Deno.env.get("AI_PROVIDER") || (Deno.env.get("GROQ_API_KEY") ? "groq" : "none");
    const aiApiKey = Deno.env.get("AI_API_KEY") || Deno.env.get("GROQ_API_KEY");

    if (!previewId && (aiProvider === "none" || !aiApiKey)) {
      return new Response(JSON.stringify({
        error: "AI_PROVIDER_NOT_CONFIGURED",
        message: "AI generation is not yet configured. Please contact support.",
        providerNotConfigured: true,
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct credits (atomic, server-side)
    const unlimited = profile.role === "owner" || profile.unlimited_access === true;

    if (!unlimited) {
      if (profile.credits < creditCost) {
        return new Response(JSON.stringify({
          error: "INSUFFICIENT_CREDITS",
          message: "You do not have enough credits for this generation.",
          required: creditCost,
          balance: profile.credits,
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: deductError } = await supabase.rpc("deduct_credits", {
        p_user_id: user.id,
        p_amount: creditCost,
        p_description: `Generation: ${type}`,
      });

      if (deductError) {
        return new Response(JSON.stringify({ error: "Credit deduction failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Record the generation job
    const { data: job, error: jobError } = await supabase
      .from("ai_generation_jobs")
      .insert({
        user_id: user.id,
        project_id: projectId || null,
        campaign_id: campaignId || null,
        type,
        status: "processing",
        provider: previewId && aiProvider === "none" ? "approved-preview" : aiProvider,
        credits_cost: unlimited ? 0 : creditCost,
      })
      .select()
      .single();

    if (jobError) {
      // Refund credits if job creation failed
      if (!unlimited) {
        await supabase.rpc("refund_credits", {
          p_user_id: user.id,
          p_amount: creditCost,
          p_description: `Refund: job creation failed for ${type}`,
        });
      }
      return new Response(JSON.stringify({ error: "Failed to create generation job" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The preview is generated before approval and costs 0 DESIGNLY credits.
    // After the user explicitly approves it, this endpoint only charges and
    // promotes that exact preview to a final project. It does not regenerate
    // a different image after the user has approved the visible result.
    let generationResult: Record<string, unknown> = {};
    let generationFailed = false;

    try {
      if (previewId) {
        const { data: previewRow, error: previewError } = await supabase
          .from("design_previews")
          .select("id, user_id, type, brief, image_url, status, expires_at")
          .eq("id", previewId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (previewError || !previewRow) {
          throw new Error("Approved preview was not found.");
        }
        if (previewRow.status !== "generated") {
          throw new Error("This preview has already been approved or consumed.");
        }
        if (new Date(previewRow.expires_at).getTime() < Date.now()) {
          await supabase.from("design_previews").update({ status: "expired" }).eq("id", previewId);
          throw new Error("This preview has expired. Please create a new preview.");
        }

        const { data: claimedPreview, error: claimError } = await supabase
          .from("design_previews")
          .update({ status: "approved", approved_at: new Date().toISOString() })
          .eq("id", previewId)
          .eq("user_id", user.id)
          .eq("status", "generated")
          .select("id, image_url, brief, type")
          .maybeSingle();

        if (claimError || !claimedPreview) {
          throw new Error("This preview could not be approved. Please try again.");
        }

        generationResult = {
          imageUrl: claimedPreview.image_url,
          previewId: claimedPreview.id,
          provider: aiProvider === "none" ? "approved-preview" : aiProvider,
          type: claimedPreview.type || type,
          generatedAt: new Date().toISOString(),
          designDirection: parseDesignDirection(
            "Finalized from the exact approved DESIGNLY visual preview.",
            type,
            style
          ),
        };
      } else {
        throw new Error("An approved visual preview is required before final generation.");
      }
    } catch (err) {
      generationFailed = true;
      generationResult = { error: err instanceof Error ? err.message : String(err) };
    }

    // Update the job
    await supabase
      .from("ai_generation_jobs")
      .update({
        status: generationFailed ? "failed" : "completed",
        result: generationResult,
        error: generationFailed ? String(generationResult.error) : null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    if (generationFailed) {
      // Refund credits on failure
      if (!unlimited) {
        await supabase.rpc("refund_credits", {
          p_user_id: user.id,
          p_amount: creditCost,
          p_description: `Refund: AI generation failed for ${type}`,
        });
      }

      return new Response(JSON.stringify({
        error: "GENERATION_FAILED",
        message: "AI generation failed. Your credits have been restored.",
        jobId: job.id,
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!generationFailed && previewId) {
      await supabase
        .from("design_previews")
        .update({ status: "consumed", consumed_at: new Date().toISOString() })
        .eq("id", previewId)
        .eq("user_id", user.id)
        .eq("status", "approved");
    }

    // Update project status if projectId was provided
    if (projectId) {
      await supabase
        .from("projects")
        .update({
          status: "completed",
          config: generationResult,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);
    }

    return new Response(JSON.stringify({
      success: true,
      jobId: job.id,
      result: generationResult,
      creditsUsed: unlimited ? 0 : creditCost,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildImagePrompt(type: string, brief: string, style?: string, format?: string): string {
  const parts = [
    "Create a polished, production-ready visual design for DESIGNLY STUDIO.",
    `Design type: ${type}`,
    `Client brief: ${brief}`,
    style ? `Style: ${style}` : "",
    format ? `Format: ${format}` : "",
    "Use a premium art-directed composition, strong hierarchy, refined typography, balanced spacing, realistic materials where appropriate, and a professional commercial finish.",
    "Prefer a dark luxury palette with graphite, off-white and warm metallic gold when compatible with the brief.",
    "Avoid watermarks, mock browser frames, random UI chrome, distorted anatomy, and generic stock-photo composition.",
    "Return the actual finished visual, not a description of the design.",
  ].filter(Boolean);
  return parts.join("");
}
function parseDesignDirection(content: string, type: string, style?: string): Record<string, unknown> {
  return {
    type,
    style: style || "premium",
    content,
    generatedAt: new Date().toISOString(),
  };
}
