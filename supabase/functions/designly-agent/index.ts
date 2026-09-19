import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { buildOrchestrationPlan } from "../_shared/orchestrator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type DesignOutput =
  | "logo"
  | "brand_identity"
  | "business_card"
  | "flyer"
  | "poster"
  | "social_post"
  | "social_story"
  | "price_list"
  | "landing_page"
  | "website"
  | "presentation"
  | "brochure"
  | "invitation"
  | "digital_business_card"
  | "menu"
  | "banner"
  | "campaign"
  | "custom";

interface DesignBrief {
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

interface AgentRequest {
  brief: string;
  brandKitId?: string | null;
  language?: string;
  requestedOutputs?: DesignOutput[];
  mode?: "brief" | "preview" | "final";
}

const allowedOutputs = new Set<DesignOutput>([
  "logo", "brand_identity", "business_card", "flyer", "poster", "social_post",
  "social_story", "price_list", "landing_page", "website", "presentation",
  "brochure", "invitation", "digital_business_card", "menu", "banner", "campaign", "custom",
]);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractJson(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const candidate = fenced || text.match(/\{[\s\S]*\}/)?.[0];
  if (!candidate) throw new Error("AI returned no structured JSON");
  return JSON.parse(candidate);
}

async function callGroqTeam(groqKey: string, model: string, system: string, user: string, schemaName: string, schema: Record<string, unknown>) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      reasoning_effort: "low",
      response_format: { type: "json_schema", json_schema: { name: schemaName, strict: true, schema } },
    }),
  });
  if (!response.ok) throw new Error(`Groq team stage failed: ${response.status}`);
  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;
  if (typeof raw !== "string" || !raw.trim()) throw new Error("Groq team stage returned no structured result");
  return JSON.parse(raw);
}

function buildImagePrompt(brief: DesignBrief, originalBrief: string): string {
  return [
    "Create a polished visual preview for DESIGNLY STUDIO based on the approved design direction below.",
    "This is a preview of the actual final design, not a text description.",
    `Original request: ${originalBrief}`,
    `Business: ${brief.businessName || "not specified"}`,
    `Industry: ${brief.industry || brief.businessType || "not specified"}`,
    `Visual style: ${brief.visualStyle || "premium"}`,
    `Mood: ${brief.mood || "refined"}`,
    `Primary colors: ${brief.primaryColors.join(", ")}`,
    `Secondary colors: ${brief.secondaryColors.join(", ")}`,
    `Typography: ${brief.typographyDirection || "premium modern"}`,
    `Imagery: ${brief.imageryDirection || "brand-consistent"}`,
    `Output: ${brief.requiredOutputs.join(", ")}`,
    "Use strong art direction, hierarchy, spacing, premium typography and realistic production quality.",
    "Prefer graphite/black, off-white and warm metallic gold when compatible with the brief.",
    "Do not add watermarks. Do not create a generic stock image. Show the actual design composition."
  ].join("\n");
}

function normalizeBrief(raw: Record<string, unknown>, language: string, fallbackOutputs: DesignOutput[]): DesignBrief {
  const arr = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === "string").slice(0, 8) : [];
  const outputs = Array.isArray(raw.requiredOutputs)
    ? raw.requiredOutputs.filter((v): v is DesignOutput => typeof v === "string" && allowedOutputs.has(v as DesignOutput)).slice(0, 20)
    : fallbackOutputs;

  return {
    businessName: typeof raw.businessName === "string" ? raw.businessName : null,
    businessType: typeof raw.businessType === "string" ? raw.businessType : null,
    targetAudience: typeof raw.targetAudience === "string" ? raw.targetAudience : null,
    industry: typeof raw.industry === "string" ? raw.industry : null,
    visualStyle: typeof raw.visualStyle === "string" ? raw.visualStyle : null,
    mood: typeof raw.mood === "string" ? raw.mood : null,
    primaryColors: arr(raw.primaryColors),
    secondaryColors: arr(raw.secondaryColors),
    typographyDirection: typeof raw.typographyDirection === "string" ? raw.typographyDirection : null,
    imageryDirection: typeof raw.imageryDirection === "string" ? raw.imageryDirection : null,
    requiredOutputs: outputs,
    language,
    additionalInstructions: typeof raw.additionalInstructions === "string" ? raw.additionalInstructions : null,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "NO_SESSION" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
    let serviceRoleKey: string | undefined;
    try {
      serviceRoleKey = secretKeysRaw ? JSON.parse(secretKeysRaw)["default"] : undefined;
    } catch {
      serviceRoleKey = undefined;
    }
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "SERVER_CONFIG_ERROR" }, 500);

    // Keep the user-scoped client for auth and RLS-protected database access.
    // Use a separate service-role client for Storage operations because the
    // user Authorization header would otherwise override the service-role
    // identity and trigger Storage RLS policies during server-side uploads.
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: "NO_SESSION" }, 401);

    const body = (await req.json()) as AgentRequest;
    if (!body.brief?.trim()) return json({ error: "INVALID_REQUEST", message: "A design brief is required." }, 400);

    const language = body.language?.trim() || "en";
    const fallbackOutputs = (body.requestedOutputs || []).filter((v) => allowedOutputs.has(v)).slice(0, 20);
    const provider = Deno.env.get("AI_PROVIDER") || (Deno.env.get("GROQ_API_KEY") ? "groq" : "none");
    const apiKey = Deno.env.get("AI_API_KEY") || Deno.env.get("GROQ_API_KEY");
    const model = Deno.env.get("AI_MODEL") || Deno.env.get("DESIGNLY_GROQ_MODEL") || "openai/gpt-oss-120b";

    if (provider === "none" || !apiKey) {
      return json({
        error: "PROVIDER_NOT_CONFIGURED",
        providerNotConfigured: true,
        message: "DESIGNLY AI is not configured yet. No generation was attempted and no credits were charged.",
      }, 503);
    }

    if (provider !== "openai" && provider !== "groq") {
      return json({ error: "UNSUPPORTED_PROVIDER", message: `Provider '${provider}' is not supported by the current DESIGNLY agent adapter.` }, 400);
    }

    let brandContext = "No existing Brand Kit was selected.";
    if (body.brandKitId) {
      const { data: brand, error: brandError } = await supabase
        .from("brands")
        .select("id, name, logo_url, primary_color, secondary_color, accent_color, font_heading, font_body, style, description")
        .eq("id", body.brandKitId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (brandError) return json({ error: "BRAND_KIT_LOOKUP_FAILED" }, 500);
      if (!brand) return json({ error: "INVALID_REQUEST", message: "The selected Brand Kit does not belong to the authenticated user." }, 403);
      brandContext = JSON.stringify(brand);
    }

    const system = `You are the DESIGNLY STUDIO Master Design Agent coordinating a specialist team in one cost-efficient AI pass. Internally apply these roles: Brand Agent (identity, logo, colors, typography), Web Agent (UX, landing pages, websites, responsive structure), Social Agent (posts, stories, platform variants), Marketing Agent (flyers, posters, brochures, menus, price lists, invitations, campaigns), Content Agent (headlines, CTA and content hierarchy), and Template Agent (template matching and metadata). Do not make separate provider calls for these roles unless explicitly implemented later; return one coherent result. Convert the natural-language request into a precise structured design brief. You do not generate images. You do not access arbitrary databases. Preserve the user's language. If a Brand Kit is supplied, respect it instead of inventing conflicting brand rules. Return ONLY valid JSON with these keys: businessName, businessType, targetAudience, industry, visualStyle, mood, primaryColors, secondaryColors, typographyDirection, imageryDirection, requiredOutputs, language, additionalInstructions. requiredOutputs must use only these values: ${Array.from(allowedOutputs).join(", ")}.`;
    const userPrompt = `User language: ${language}
Requested outputs: ${JSON.stringify(fallbackOutputs)}
Existing Brand Kit: ${brandContext}
Design request: ${body.brief.trim()}

If this is a TikTok Shop request, internally apply these specialist roles as appropriate: Research, Product, Listing, Creative, Video, Campaign, and Shop Health. Do not claim live TikTok Shop data or perform actions in TikTok Seller Center unless a real integration is connected and authorized.
If this is a Monkey Design Studio request, internally apply: Design Director, Logo, Brand, UI/UX, Web, Social, Marketing, Print, Presentation, and Visual QA. Keep all outputs aligned with the supplied Brand Kit.
Return one coherent structured result.`;

    // Provider adapter: Groq uses the OpenAI-compatible Chat Completions API.
    // OpenAI remains supported for backwards compatibility.
    let content = "";

    if (provider === "groq") {
      const groqKey = Deno.env.get("GROQ_API_KEY") || apiKey;
      if (!groqKey) {
        return json({
          error: "PROVIDER_NOT_CONFIGURED",
          providerNotConfigured: true,
          message: "GROQ_API_KEY is not configured. No credits were charged.",
        }, 503);
      }

      const groqModel = Deno.env.get("AI_MODEL") || Deno.env.get("DESIGNLY_GROQ_MODEL") || "openai/gpt-oss-120b";
      const isCompound = groqModel === "groq/compound" || groqModel === "groq/compound-mini";
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userPrompt },
          ],
          ...(isCompound ? {} : { reasoning_effort: "low" }),
          response_format: isCompound
            ? { type: "json_object" }
            : {
                type: "json_schema",
                json_schema: {
                  name: "designly_design_brief",
                  strict: true,
                  schema: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      businessName: { type: ["string", "null"] },
                      businessType: { type: ["string", "null"] },
                      targetAudience: { type: ["string", "null"] },
                      industry: { type: ["string", "null"] },
                      visualStyle: { type: ["string", "null"] },
                      mood: { type: ["string", "null"] },
                      primaryColors: { type: "array", items: { type: "string" } },
                      secondaryColors: { type: "array", items: { type: "string" } },
                      typographyDirection: { type: ["string", "null"] },
                      imageryDirection: { type: ["string", "null"] },
                      requiredOutputs: {
                        type: "array",
                        items: { type: "string", enum: Array.from(allowedOutputs) },
                      },
                      language: { type: "string" },
                      additionalInstructions: { type: ["string", "null"] },
                    },
                    required: [
                      "businessName", "businessType", "targetAudience", "industry",
                      "visualStyle", "mood", "primaryColors", "secondaryColors",
                      "typographyDirection", "imageryDirection", "requiredOutputs",
                      "language", "additionalInstructions",
                    ],
                  },
                },
              },        }),
      });

      if (!response.ok) {
        const providerBody = await response.text().catch(() => "");
        console.error("Groq Responses error:", response.status, providerBody);
        return json({
          error: "GENERATION_FAILED",
          message: `Groq AI provider returned ${response.status}.`,
        }, 502);
      }

      const groqData = await response.json();
      content = groqData.choices?.[0]?.message?.content || "";
    } else if (provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: [
            { role: "system", content: [{ type: "input_text", text: system }] },
            { role: "user", content: [{ type: "input_text", text: userPrompt }] },
          ],
          max_output_tokens: 1400,
        }),
      });

      if (!response.ok) {
        const providerBody = await response.text().catch(() => "");
        console.error("OpenAI Responses API error:", response.status, providerBody);
        return json({
          error: "GENERATION_FAILED",
          message: `AI provider returned ${response.status}. Check the DESIGNLY AI model/API configuration.`,
        }, 502);
      }

      const aiData = await response.json();
      content =
        aiData.output_text ||
        aiData.output
          ?.flatMap((item: any) => item.content || [])
          ?.map((item: any) => item.text || "")
          ?.join("") ||
        "";
    } else {
      return json({
        error: "UNSUPPORTED_PROVIDER",
        message: `Provider '${provider}' is not supported by the current DESIGNLY agent adapter.`,
      }, 400);
    }

    const structured = normalizeBrief(extractJson(content), language, fallbackOutputs);

    // TEAM BUILD: the selected specialists now execute against the structured brief.
    // This is a real multi-stage provider workflow, not only a label in the UI.
    const teamModel = Deno.env.get("DESIGNLY_TEAM_MODEL") || Deno.env.get("DESIGNLY_GROQ_MODEL") || "openai/gpt-oss-120b";
    const teamPlan = await callGroqTeam(
      Deno.env.get("GROQ_API_KEY") || apiKey,
      teamModel,
      "You are the DESIGNLY Specialist Team. Execute the selected specialist roles as one coordinated pass. Produce actionable, concrete outputs. Never claim external actions were performed. Return only JSON.",
      JSON.stringify({
        brief: structured,
        selectedAgents: orchestration.agents,
        responsibilities: orchestration.reasons,
        instruction: "For each selected specialist, produce its deliverable. Then produce one integrated build specification. Keep assumptions explicit."
      }),
      "designly_specialist_team",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          specialistOutputs: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                agent: { type: "string" },
                deliverable: { type: "string" },
                decisions: { type: "array", items: { type: "string" } },
              },
              required: ["agent", "deliverable", "decisions"],
            },
          },
          buildSpec: {
            type: "object",
            additionalProperties: false,
            properties: {
              pages: { type: "array", items: { type: "string" } },
              sections: { type: "array", items: { type: "string" } },
              components: { type: "array", items: { type: "string" } },
              content: { type: "array", items: { type: "string" } },
              interactions: { type: "array", items: { type: "string" } },
              responsiveRules: { type: "array", items: { type: "string" } },
              acceptanceCriteria: { type: "array", items: { type: "string" } },
            },
            required: ["pages", "sections", "components", "content", "interactions", "responsiveRules", "acceptanceCriteria"],
          },
        },
        required: ["specialistOutputs", "buildSpec"],
      }
    );

    const reviewedTeam = await callGroqTeam(
      Deno.env.get("GROQ_API_KEY") || apiKey,
      teamModel,
      "You are the DESIGNLY QA/Builder gate. Review the proposed specialist output for contradictions, missing essentials, unsafe arbitrary-code requests, and buildability. Return a corrected build specification only. Do not claim anything was deployed.",
      JSON.stringify({ brief: structured, selectedAgents: orchestration.agents, proposal: teamPlan }),
      "designly_build_gate",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          status: { type: "string", enum: ["PASS", "BLOCK"] },
          blockers: { type: "array", items: { type: "string" } },
          buildSpec: {
            type: "object",
            additionalProperties: false,
            properties: {
              pages: { type: "array", items: { type: "string" } },
              sections: { type: "array", items: { type: "string" } },
              components: { type: "array", items: { type: "string" } },
              content: { type: "array", items: { type: "string" } },
              interactions: { type: "array", items: { type: "string" } },
              responsiveRules: { type: "array", items: { type: "string" } },
              acceptanceCriteria: { type: "array", items: { type: "string" } },
            },
            required: ["pages", "sections", "components", "content", "interactions", "responsiveRules", "acceptanceCriteria"],
          },
        },
        required: ["status", "blockers", "buildSpec"],
      }
    );

    const text = body.brief.toLowerCase();
    const orchestration = buildOrchestrationPlan(body.brief, fallbackOutputs);

    // Preview is intentionally free of DESIGNLY credits, but it still renders
    // a real image so the user can inspect the actual result before approving.
    let previewImageUrl: string | null = null;
    let previewId: string | null = null;

    if (body.mode === "preview") {
      const imageModel = Deno.env.get("AI_IMAGE_MODEL") || "gpt-image-2";
      const imageApiKey = Deno.env.get("AI_IMAGE_API_KEY") || Deno.env.get("OPENAI_API_KEY") || (provider === "openai" ? apiKey : undefined);
      if (!imageApiKey) {
        return json({
          error: "PREVIEW_IMAGE_PROVIDER_NOT_CONFIGURED",
          providerNotConfigured: true,
          message: "A visual image provider is required for free DESIGNLY previews. Set AI_IMAGE_API_KEY/OPENAI_API_KEY; Groq handles the design reasoning.",
        }, 503);
      }
      const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${imageApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: imageModel,
          prompt: buildImagePrompt(structured, body.brief.trim()),
          size: "1024x1024",
        }),
      });

      if (!imageResponse.ok) {
        const providerBody = await imageResponse.text().catch(() => "");
        console.error("OpenAI image preview error:", imageResponse.status, providerBody);
        return json({
          error: "PREVIEW_GENERATION_FAILED",
          message: "The visual preview could not be generated. No DESIGNLY credits were charged.",
        }, 502);
      }

      const imageData = await imageResponse.json();
      const b64 = imageData.data?.[0]?.b64_json;
      const remoteUrl = imageData.data?.[0]?.url as string | undefined;

      if (!b64 && !remoteUrl) {
        return json({
          error: "PREVIEW_GENERATION_FAILED",
          message: "The AI provider returned no preview image. No DESIGNLY credits were charged.",
        }, 502);
      }

      previewImageUrl = remoteUrl || null;

      if (b64) {
        const bytes = Uint8Array.from(atob(b64), (char) => char.charCodeAt(0));
        const path = `${user.id}/preview-${crypto.randomUUID()}.png`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from("designly-generations")
          .upload(path, bytes, { contentType: "image/png", upsert: false });

        if (uploadError) {
          console.error("Preview storage upload failed:", uploadError);
          return json({
            error: "PREVIEW_STORAGE_FAILED",
            message: "The preview was generated but could not be stored. No DESIGNLY credits were charged.",
          }, 502);
        }

        const { data: signedPreview, error: signedPreviewError } = await supabaseAdmin.storage
          .from("designly-generations")
          .createSignedUrl(path, 7 * 24 * 60 * 60);

        if (signedPreviewError || !signedPreview?.signedUrl) {
          console.error("Preview signed URL creation failed:", signedPreviewError);
          return json({
            error: "PREVIEW_STORAGE_FAILED",
            message: "The preview was generated but its protected viewing URL could not be created. No DESIGNLY credits were charged.",
          }, 502);
        }

        // The bucket is private. The browser receives only a time-limited signed URL.
        // Direct public object URLs are intentionally never exposed.
        previewImageUrl = signedPreview.signedUrl;
      }

      const { data: previewRow, error: previewInsertError } = await supabase
        .from("design_previews")
        .insert({
          user_id: user.id,
          type: fallbackOutputs[0] || "custom",
          brief: body.brief.trim(),
          image_url: previewImageUrl,
        })
        .select("id")
        .single();

      if (previewInsertError || !previewRow) {
        console.error("Preview record creation failed:", previewInsertError);
        return json({
          error: "PREVIEW_RECORD_FAILED",
          message: "The preview was generated but could not be registered. No DESIGNLY credits were charged.",
        }, 500);
      }

      previewId = previewRow.id;
    }

    const isTikTokShop = /(tiktok|shop|seller|termékfeltölt|product listing|affiliate|creator|gmv)/i.test(text);
    const isMonkeyDesign = /(monkey design|logo|arculat|brand|ui|ux|weboldal|landing|social|plakát|flyer|brosúra|prezentáció|névjegy)/i.test(text);

    const legacySpecialists = [
      ...(isTikTokShop ? ["tiktok_shop_research", "tiktok_shop_product", "tiktok_shop_listing", "tiktok_shop_creative", "tiktok_shop_video", "tiktok_shop_campaign", "tiktok_shop_health"] : []),
      ...(isMonkeyDesign ? ["monkey_design_director", "monkey_logo", "monkey_brand", "monkey_uiux", "monkey_web", "monkey_social", "monkey_marketing", "monkey_print", "monkey_presentation", "monkey_qa"] : []),
    ];
    const activeAgents = ["master", ...orchestration.agents, ...legacySpecialists.filter((id) => !orchestration.agents.includes(id))];

    return json({
      success: true,
      mode: body.mode || "brief",
      preview: true,
      creditsUsed: 0,
      previewId,
      previewImageUrl,
      designBrief: structured,
      activeAgents,
      specialistPlan: {
        brand: structured.requiredOutputs.some((x) => ["logo", "brand_identity"].includes(x)),
        web: structured.requiredOutputs.some((x) => ["landing_page", "website"].includes(x)),
        social: structured.requiredOutputs.some((x) => ["social_post", "social_story"].includes(x)),
        marketing: structured.requiredOutputs.some((x) => ["flyer", "poster", "brochure", "price_list", "invitation", "campaign"].includes(x)),
        content: true,
        video: orchestration.agents.includes("video"),
        tiktokShop: orchestration.agents.includes("tiktok-shop"),
        voice: orchestration.agents.includes("voice"),
        translation: orchestration.agents.includes("translator"),
        procurement: orchestration.agents.includes("procurement"),
        recruitment: orchestration.agents.includes("recruitment"),
        socialPublishing: orchestration.agents.includes("social-publisher"),
        business: orchestration.agents.includes("vyron"),
        sales: orchestration.agents.includes("sales"),
      },
      orchestration: {
        agents: orchestration.agents,
        capabilities: orchestration.capabilities,
        reasons: orchestration.reasons,
        teamExecuted: true,
        specialistOutputs: teamPlan.specialistOutputs || [],
        buildSpec: reviewedTeam.buildSpec,
        qaStatus: reviewedTeam.status,
        blockers: reviewedTeam.blockers || [],
      },
    });
  } catch (error) {
    console.error("designly-agent error", error);
    return json({ error: "GENERATION_FAILED", message: "DESIGNLY could not create the structured design brief." }, 500);
  }
});
