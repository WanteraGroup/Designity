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

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: GenerationRequest = await req.json();
    const { type, brief, brandKitId, style, format, projectId, campaignId } = body;

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
      .select("id, role, credits, plan_id")
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

    // Check if AI provider is configured
    const aiProvider = Deno.env.get("AI_PROVIDER") || "none";
    const aiApiKey = Deno.env.get("AI_API_KEY");

    if (aiProvider === "none" || !aiApiKey) {
      // Provider not configured — record the job as failed, refund credits
      // But first, do NOT deduct credits since we can't generate
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
    if (profile.role !== "owner") {
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
        provider: aiProvider,
        credits_cost: profile.role === "owner" ? 0 : creditCost,
      })
      .select()
      .single();

    if (jobError) {
      // Refund credits if job creation failed
      if (profile.role !== "owner") {
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

    // Call the AI provider
    let generationResult: Record<string, unknown> = {};
    let generationFailed = false;

    try {
      switch (aiProvider) {
        case "openai": {
          // Final DESIGNLY output is a real image. The free Master Agent
          // creates the design direction; this paid step renders it.
          const imagePrompt = buildImagePrompt(type, brief, style, format);
          const imageModel = Deno.env.get("AI_IMAGE_MODEL") || "gpt-image-2";
          const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${aiApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: imageModel,
              prompt: imagePrompt,
              size: "1024x1024",
            }),
          });

          if (!imageResponse.ok) {
            const providerBody = await imageResponse.text();
            throw new Error(`AI image provider returned ${imageResponse.status}: ${providerBody.slice(0, 500)}`);
          }

          const imageData = await imageResponse.json();
          const b64 = imageData.data?.[0]?.b64_json;
          const remoteUrl = imageData.data?.[0]?.url;

          if (!b64 && !remoteUrl) {
            throw new Error("AI image provider returned no image data.");
          }

          let imageUrl = remoteUrl as string | undefined;

          // Persist base64 renders in Supabase Storage when the provider
          // returns base64 JSON. If storage is unavailable, return a data
          // URL so the current session can still display the result.
          if (b64) {
            const bytes = Uint8Array.from(atob(b64), (char) => char.charCodeAt(0));
            const filePath = `${user.id}/${projectId || job.id}.png`;
            const { error: uploadError } = await supabase.storage
              .from("designly-generations")
              .upload(filePath, bytes, {
                contentType: "image/png",
                upsert: true,
              });

            if (uploadError) {
              imageUrl = `data:image/png;base64,${b64}`;
            } else {
              const { data: publicData } = supabase.storage
                .from("designly-generations")
                .getPublicUrl(filePath);
              imageUrl = publicData.publicUrl;
            }
          }

          generationResult = {
            imageUrl,
            imageModel,
            provider: "openai",
            type,
            generatedAt: new Date().toISOString(),
            designDirection: parseDesignDirection(
              `Rendered final ${type} design from the approved DESIGNLY brief.`,
              type,
              style
            ),
          };
          break;
        }
        default:
          throw new Error(`Unknown AI provider: ${aiProvider}`);
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
      if (profile.role !== "owner") {
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
      creditsUsed: profile.role === "owner" ? 0 : creditCost,
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
\n
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
  return parts.join("\n");
}
\nfunction parseDesignDirection(content: string, type: string, style?: string): Record<string, unknown> {
  return {
    type,
    style: style || "premium",
    content,
    generatedAt: new Date().toISOString(),
  };
}
