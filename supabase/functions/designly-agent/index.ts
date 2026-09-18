import { createClient } from "npm:@supabase/supabase-js@2.57.4";

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

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: "NO_SESSION" }, 401);

    const body = (await req.json()) as AgentRequest;
    if (!body.brief?.trim()) return json({ error: "INVALID_REQUEST", message: "A design brief is required." }, 400);

    const language = body.language?.trim() || "en";
    const fallbackOutputs = (body.requestedOutputs || []).filter((v) => allowedOutputs.has(v)).slice(0, 20);
    const provider = Deno.env.get("AI_PROVIDER") || "none";
    const apiKey = Deno.env.get("AI_API_KEY");
    const model = Deno.env.get("AI_MODEL") || "gpt-5.6-luna";

    if (provider === "none" || !apiKey) {
      return json({
        error: "PROVIDER_NOT_CONFIGURED",
        providerNotConfigured: true,
        message: "DESIGNLY AI is not configured yet. No generation was attempted and no credits were charged.",
      }, 503);
    }

    if (provider !== "openai") {
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

    // GPT-5.6 models are called through the Responses API.
    // Keep this request server-side so the OpenAI key never reaches the browser.
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
    const content =
      aiData.output_text ||
      aiData.output
        ?.flatMap((item: any) => item.content || [])
        ?.map((item: any) => item.text || "")
        ?.join("") ||
      "";
    const structured = normalizeBrief(extractJson(content), language, fallbackOutputs);

    const text = body.brief.toLowerCase();

    // Preview is intentionally free of DESIGNLY credits, but it still renders
    // a real image so the user can inspect the actual result before approving.
    let previewImageUrl: string | null = null;
    let previewId: string | null = null;

    if (body.mode === "preview") {
      const imageModel = Deno.env.get("AI_IMAGE_MODEL") || "gpt-image-2";
      const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
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
        const { error: uploadError } = await supabase.storage
          .from("designly-generations")
          .upload(path, bytes, { contentType: "image/png", upsert: false });

        if (uploadError) {
          console.error("Preview storage upload failed:", uploadError);
          return json({
            error: "PREVIEW_STORAGE_FAILED",
            message: "The preview was generated but could not be stored. No DESIGNLY credits were charged.",
          }, 502);
        }

        previewImageUrl = supabase.storage.from("designly-generations").getPublicUrl(path).data.publicUrl;
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

    const activeAgents = [
      "master",
      ...(isTikTokShop ? ["tiktok_shop_research", "tiktok_shop_product", "tiktok_shop_listing", "tiktok_shop_creative", "tiktok_shop_video", "tiktok_shop_campaign", "tiktok_shop_health"] : []),
      ...(isMonkeyDesign ? ["monkey_design_director", "monkey_logo", "monkey_brand", "monkey_uiux", "monkey_web", "monkey_social", "monkey_marketing", "monkey_print", "monkey_presentation", "monkey_qa"] : []),
    ];

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
        marketing: structured.requiredOutputs.some((x) => ["flyer", "poster", "brochure", "price_list", "invitation"].includes(x)),
        content: true,
      },
    });
  } catch (error) {
    console.error("designly-agent error", error);
    return json({ error: "GENERATION_FAILED", message: "DESIGNLY could not create the structured design brief." }, 500);
  }
});
