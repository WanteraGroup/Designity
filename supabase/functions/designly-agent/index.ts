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
  | "digital_business_card";

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
  "brochure", "invitation", "digital_business_card",
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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
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

    const system = `You are the DESIGNLY STUDIO Master Design Agent. Convert a natural-language design request into a precise structured design brief. You do not generate images. You do not access arbitrary databases. You must preserve the user's language. If a Brand Kit is supplied, respect it instead of inventing conflicting brand rules. Return ONLY valid JSON with these keys: businessName, businessType, targetAudience, industry, visualStyle, mood, primaryColors, secondaryColors, typographyDirection, imageryDirection, requiredOutputs, language, additionalInstructions. requiredOutputs must use only these values: ${Array.from(allowedOutputs).join(", ")}.`;
    const userPrompt = `User language: ${language}\nRequested outputs: ${JSON.stringify(fallbackOutputs)}\nExisting Brand Kit: ${brandContext}\nDesign request: ${body.brief.trim()}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 1400,
      }),
    });

    if (!response.ok) return json({ error: "GENERATION_FAILED", message: `AI provider returned ${response.status}.` }, 502);

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    const structured = normalizeBrief(extractJson(content), language, fallbackOutputs);

    return json({
      success: true,
      mode: body.mode || "brief",
      preview: true,
      creditsUsed: 0,
      designBrief: structured,
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
