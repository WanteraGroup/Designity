import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { buildOrchestrationPlan } from "../_shared/orchestrator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type DesignOutput =
  | "logo" | "brand_identity" | "business_card" | "flyer" | "poster" | "social_post"
  | "social_story" | "price_list" | "landing_page" | "website" | "presentation"
  | "brochure" | "invitation" | "digital_business_card" | "menu" | "banner" | "campaign" | "custom";

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
  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(`Groq team stage failed: ${response.status}: ${bodyText.slice(0, 240)}`);
  }
  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;
  if (typeof raw !== "string" || !raw.trim()) throw new Error("Groq team stage returned no structured result");
  return JSON.parse(raw);
}

function buildImagePrompt(brief: DesignBrief, originalBrief: string): string {
  // The user's actual request leads the prompt. The structured brief only adds
  // art direction around it — leading with the palette/style lines produced a
  // generic brand panel that ignored what was asked for.
  const subject = brief.businessName
    ? `${originalBrief}. Subject/brand: ${brief.businessName}`
    : originalBrief;

  return [
    `Create the actual design the user asked for: ${subject}`,
    "Render the requested visual literally and specifically — the named subject must be clearly recognisable and be the focus of the composition.",
    brief.industry ? `Industry: ${brief.industry}` : "",
    brief.targetAudience ? `Audience: ${brief.targetAudience}` : "",
    `Visual style: ${brief.visualStyle || "premium"}`,
    `Mood: ${brief.mood || "refined"}`,
    brief.primaryColors.length ? `Primary colors: ${brief.primaryColors.join(", ")}` : "",
    brief.secondaryColors.length ? `Secondary colors: ${brief.secondaryColors.join(", ")}` : "",
    brief.typographyDirection ? `Typography: ${brief.typographyDirection}` : "",
    brief.imageryDirection ? `Imagery direction: ${brief.imageryDirection}` : "",
    `Output format: ${brief.requiredOutputs.join(", ")}`,
    "Use strong art direction, hierarchy, spacing and realistic production quality.",
    "Prefer graphite/black, off-white and warm metallic gold where it suits the request, but never at the expense of the requested subject.",
    "Do not add watermarks. Do not create a generic stock image or a placeholder brand panel. Show the actual requested design composition.",
  ].filter(Boolean).join("\n");
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildFallbackBrief(request: string, language: string, outputs: DesignOutput[]): DesignBrief {
  const lower = request.toLowerCase();
  const businessName =
    request.match(/(?:projekt|márka|brand|cég|vállalkozás)\s*[:-]\s*([^\n]+)/i)?.[1]?.trim() || null;
  const visualStyle =
    /(luxury|prémium|premium|luxus)/i.test(request) ? "premium luxury"
      : /(nordic|északi|viking|kelta|celtic)/i.test(request) ? "nordic celtic"
      : /(minimal|minimalista)/i.test(request) ? "minimal"
      : "premium";
  const colors = /(arany|gold|bronz)/i.test(lower)
    ? ["black", "warm gold", "ivory"]
    : ["graphite black", "ivory", "metallic gold"];

  return {
    businessName,
    businessType: outputs.includes("website") || outputs.includes("landing_page") ? "creative web project" : null,
    targetAudience: null,
    industry: null,
    visualStyle,
    mood: /(sötét|dark|drámai|cinematic|moody)/i.test(request) ? "cinematic and dramatic" : "refined and distinctive",
    primaryColors: colors,
    secondaryColors: ["steel", "deep graphite"],
    typographyDirection: "Cinzel + Inter",
    imageryDirection: "premium editorial imagery aligned to the brief",
    requiredOutputs: outputs.length ? outputs : ["custom"],
    language,
    additionalInstructions: "Offline fallback preview generated because the AI provider was unavailable.",
  };
}

function buildFallbackPreviewSvg(brief: DesignBrief, originalBrief: string): string {
  const title = escapeSvgText(brief.businessName || "DESIGNLY STUDIO");
  const style = escapeSvgText(brief.visualStyle || "Premium");
  const mood = escapeSvgText(brief.mood || "Refined");
  const direction = escapeSvgText((brief.imageryDirection || "Brand-consistent imagery").slice(0, 120));
  const palette = [...brief.primaryColors, ...brief.secondaryColors].slice(0, 5).map(escapeSvgText);
  const swatches = palette.map((color, i) =>
    `<g transform="translate(${96 + i * 120},530)"><rect width="92" height="42" rx="10" fill="${i === 0 ? "#d9b45f" : "#16161f"}" stroke="#d9b45f" stroke-opacity=".42"/><text x="46" y="68" text-anchor="middle" font-size="12" fill="#e8d9a8">${color.slice(0,18)}</text></g>`
  ).join("");
  const request = escapeSvgText(originalBrief.slice(0, 140));

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#07070a"/><stop offset="1" stop-color="#1a1608"/></linearGradient>
        <radialGradient id="glow" cx=".5" cy=".2" r=".8"><stop offset="0" stop-color="#d9b45f" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="1200" height="760" fill="url(#bg)"/>
      <rect width="1200" height="760" fill="url(#glow)"/>
      <rect x="38" y="38" width="1124" height="684" rx="26" fill="none" stroke="#d9b45f" stroke-opacity=".32"/>
      <circle cx="104" cy="104" r="34" fill="#0a0b0d" stroke="#d9b45f" stroke-opacity=".7"/>
      <text x="104" y="112" text-anchor="middle" font-family="serif" font-size="30" fill="#f6e2a8">D</text>
      <text x="96" y="208" font-family="serif" font-size="58" letter-spacing="7" fill="#f2ece0">DESIGNLY</text>
      <text x="100" y="252" font-family="sans-serif" font-size="16" letter-spacing="5" fill="#d9b45f">AI CREATIVE PREVIEW</text>
      <text x="96" y="330" font-family="serif" font-size="34" fill="#f2ece0">${title}</text>
      <text x="96" y="374" font-family="sans-serif" font-size="17" fill="#c9c2b4">Style: ${style}</text>
      <text x="96" y="408" font-family="sans-serif" font-size="17" fill="#c9c2b4">Mood: ${mood}</text>
      <text x="96" y="442" font-family="sans-serif" font-size="17" fill="#c9c2b4">${direction}</text>
      <text x="96" y="492" font-family="sans-serif" font-size="13" fill="#8f897d">Brief: ${request}</text>
      ${swatches}
      <text x="96" y="680" font-family="sans-serif" font-size="12" letter-spacing="3" fill="#d9b45f">0 KREDIT · ELŐNÉZET · JÓVÁHAGYÁS ELŐTT</text>
    </svg>
  `)}`;
}

function normalizeBrief(raw: Record<string, unknown>, language: string, fallbackOutputs: DesignOutput[]): DesignBrief {
  const arr = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((v): v is string => typeof v === "string").slice(0, 8)
      : [];
  const outputs = Array.isArray(raw.requiredOutputs)
    ? raw.requiredOutputs
        .filter((v): v is DesignOutput => typeof v === "string" && allowedOutputs.has(v as DesignOutput))
        .slice(0, 20)
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
    requiredOutputs: outputs.length ? outputs : ["custom"],
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
    let providerStageError: string | null = null;

    if (provider === "none" || !apiKey) {
      return json({
        error: "PROVIDER_NOT_CONFIGURED",
        message: "The AI provider is not configured on the server.",
        providerNotConfigured: true,
      }, 503);
    }

    const system = [
      "You are the DESIGNLY Studio master design director.",
      "Return a single structured design brief as strict JSON matching the provided schema.",
      "Write in the requested language. Be concrete and production-oriented.",
    ].join(" ");
    const userPrompt = [
      `BRIEF: ${body.brief}`,
      `LANGUAGE: ${language}`,
      `REQUESTED OUTPUTS: ${(fallbackOutputs.length ? fallbackOutputs : ["custom"]).join(", ")}`,
      body.brandKitId ? `BRAND KIT ID: ${body.brandKitId}` : "",
    ].filter(Boolean).join("\n");

    const briefSchema = {
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
        requiredOutputs: { type: "array", items: { type: "string", enum: Array.from(allowedOutputs) } },
        language: { type: "string" },
        additionalInstructions: { type: ["string", "null"] },
      },
      required: [
        "businessName", "businessType", "targetAudience", "industry",
        "visualStyle", "mood", "primaryColors", "secondaryColors",
        "typographyDirection", "imageryDirection", "requiredOutputs",
        "language", "additionalInstructions",
      ],
    };

    const fallbackContent = JSON.stringify(buildFallbackBrief(body.brief, language, fallbackOutputs));
    let content = "";

    try {
      if (provider === "groq") {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [{ role: "system", content: system }, { role: "user", content: userPrompt }],
            reasoning_effort: "low",
            response_format: { type: "json_schema", json_schema: { name: "designly_brief", strict: true, schema: briefSchema } },
          }),
        });
        if (!response.ok) {
          const bodyText = await response.text().catch(() => "");
          throw new Error(`Groq provider returned ${response.status}: ${bodyText.slice(0, 240)}`);
        }
        const groqData = await response.json();
        content = groqData.choices?.[0]?.message?.content || "";
        if (!content.trim()) throw new Error("Groq returned no content");
      } else if (provider === "openai") {
        const response = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
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
          const bodyText = await response.text().catch(() => "");
          throw new Error(`OpenAI provider returned ${response.status}: ${bodyText.slice(0, 240)}`);
        }
        const aiData = await response.json();
        content =
          aiData.output_text ||
          aiData.output?.flatMap((item: any) => item.content || []).map((item: any) => item.text || "").join("") ||
          "";
        if (!content.trim()) throw new Error("OpenAI returned no content");
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (providerError) {
      console.error("designly-agent provider stage failed:", providerError);
      providerStageError = providerError instanceof Error ? providerError.message : String(providerError);
      content = fallbackContent;
    }

    const structured = normalizeBrief(extractJson(content), language, fallbackOutputs);
    const text = body.brief.toLowerCase();
    const orchestration = buildOrchestrationPlan(body.brief, fallbackOutputs);

    const fallbackTeamPlan = {
      specialistOutputs: orchestration.agents.map((agent) => ({
        agent,
        deliverable: "Specialist stage unavailable; using the normalized design brief.",
        decisions: ["Use the structured brief as source of truth."],
      })),
      buildSpec: {
        pages: [{ path: "/", title: structured.businessName || "DESIGNLY", sections: ["Hero", "Content", "CTA"] }],
        sections: ["Hero", "Content", "CTA"],
        components: ["Header", "Hero", "Content", "CTA"],
        content: ["Structured design brief"],
        interactions: ["Responsive navigation"],
        responsiveRules: ["Mobile-first responsive layout"],
        acceptanceCriteria: ["Matches the structured design brief"],
      },
    };

    const fallbackReviewedTeam = {
      status: "PASS" as const,
      blockers: [],
      buildSpec: fallbackTeamPlan.buildSpec,
    };

    let teamPlan = fallbackTeamPlan;
    let reviewedTeam = fallbackReviewedTeam;

    try {
      const teamModel = Deno.env.get("DESIGNLY_TEAM_MODEL") || Deno.env.get("DESIGNLY_GROQ_MODEL") || "openai/gpt-oss-120b";
      teamPlan = await callGroqTeam(
        Deno.env.get("GROQ_API_KEY") || apiKey,
        teamModel,
        "You are the DESIGNLY Specialist Team. Execute the selected specialist roles as one coordinated pass. Return strict JSON only.",
        `BRIEF: ${body.brief}`,
        "designly_team",
        {
          type: "object",
          additionalProperties: false,
          properties: {
            specialistOutputs: { type: "array", items: { type: "object", additionalProperties: true } },
            buildSpec: { type: "object", additionalProperties: true },
          },
          required: ["specialistOutputs", "buildSpec"],
        },
      );
    } catch (teamError) {
      console.error("designly-agent team stage failed:", teamError);
      teamPlan = fallbackTeamPlan;
    }

    const normalizedBuildSpec = {
      pages: Array.isArray((teamPlan.buildSpec as any)?.pages) ? (teamPlan.buildSpec as any).pages : fallbackTeamPlan.buildSpec.pages,
      sections: Array.isArray((teamPlan.buildSpec as any)?.sections) ? (teamPlan.buildSpec as any).sections : fallbackTeamPlan.buildSpec.sections,
      components: Array.isArray((teamPlan.buildSpec as any)?.components) ? (teamPlan.buildSpec as any).components : fallbackTeamPlan.buildSpec.components,
      content: (teamPlan.buildSpec as any)?.content || fallbackTeamPlan.buildSpec.content,
      interactions: Array.isArray((teamPlan.buildSpec as any)?.interactions) ? (teamPlan.buildSpec as any).interactions : fallbackTeamPlan.buildSpec.interactions,
      responsiveRules: Array.isArray((teamPlan.buildSpec as any)?.responsiveRules) ? (teamPlan.buildSpec as any).responsiveRules : fallbackTeamPlan.buildSpec.responsiveRules,
      acceptanceCriteria: Array.isArray((teamPlan.buildSpec as any)?.acceptanceCriteria) ? (teamPlan.buildSpec as any).acceptanceCriteria : fallbackTeamPlan.buildSpec.acceptanceCriteria,
    };

    let previewImageUrl: string | null = null;
    let previewId: string | null = null;
    let previewError: string | null = null;

    // Final-mode bookkeeping — a billable run records what it saved and what it charged.
    let projectId: string | null = null;
    let creditsCharged = 0;
    let creditError: string | null = null;

    if (body.mode === "preview" || body.mode === undefined) {
      const imageApiKey = Deno.env.get("AI_IMAGE_API_KEY") || Deno.env.get("OPENAI_API_KEY") || apiKey;
      const imageModel = Deno.env.get("AI_IMAGE_MODEL") || "gpt-image-1";
      const fallbackImage = buildFallbackPreviewSvg(structured, body.brief);

      // The fallback SVG is a complete image: a data: URL the browser renders
      // directly. So previewImageUrl always holds something usable by the time we
      // reach the insert, and image_url can never arrive NULL.
      previewImageUrl = fallbackImage;

      try {
        const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: { "Authorization": `Bearer ${imageApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: imageModel,
            prompt: buildImagePrompt(structured, body.brief),
            size: "1024x1024",
            n: 1,
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const b64 = imageData.data?.[0]?.b64_json;
          const remoteUrl = imageData.data?.[0]?.url;

          if (b64) {
            const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
            const path = `previews/${user.id}/${crypto.randomUUID()}.png`;
            const { error: uploadError } = await supabaseAdmin.storage
              .from("designly-previews")
              .upload(path, bytes, { contentType: "image/png", upsert: true });
            if (uploadError) {
              // Keep the data: URL already in previewImageUrl. A storage failure
              // must not take the preview row down with it.
              console.error("designly-agent preview upload failed:", uploadError.message);
            } else {
              const { data: pub } = supabaseAdmin.storage.from("designly-previews").getPublicUrl(path);
              previewImageUrl = pub.publicUrl;
            }
          } else if (remoteUrl) {
            previewImageUrl = remoteUrl;
          }
        } else {
          const imageErrorText = await imageResponse.text().catch(() => "");
          console.error("designly-agent image stage failed:", imageResponse.status, imageErrorText.slice(0, 240));
        }
      } catch (imageError) {
        console.error("designly-agent image stage error:", imageError);
      }

      const insertRow = (imageUrl: string) => ({
        user_id: user.id,
        type: fallbackOutputs[0] || "custom",
        brief: body.brief.trim(),
        image_url: imageUrl,
        // Must be 'generated': design_previews_status_check allows only
        // generated | approved | consumed | expired. A 'ready' row fails the
        // CHECK, so the insert never lands and previewId comes back null —
        // which then silently blocks the paid finalize step.
        status: "generated",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      let inserted = await supabase
        .from("design_previews")
        .insert(insertRow(previewImageUrl))
        .select("id")
        .single();

      if (inserted.error || !inserted.data) {
        // Retry with the guaranteed-safe data URL before giving up.
        if (previewImageUrl !== fallbackImage) {
          console.error("Preview insert failed, retrying with inline fallback:", inserted.error?.message);
          previewImageUrl = fallbackImage;
          inserted = await supabase
            .from("design_previews")
            .insert(insertRow(fallbackImage))
            .select("id")
            .single();
        }
      }

      if (inserted.error || !inserted.data) {
        // The image exists and the user can still see it, so this is a warning,
        // not a hard failure. Report it without discarding the preview.
        console.error("Preview record creation failed:", inserted.error);
        previewError = inserted.error?.message || "No row returned";
      } else {
        previewId = inserted.data.id;
      }
    }

    // ------------------------------------------------------------------------
    // FINAL mode — billable. Charges real credits, renders the high-quality
    // asset, stores it and records the project. Every failure path below the
    // charge refunds, so a failed finalize never costs the user.
    // ------------------------------------------------------------------------
    if (body.mode === "final") {
      const FINAL_COST = 3000;

      const { data: charged, error: chargeError } = await supabaseAdmin.rpc("deduct_credits", {
        p_user_id: user.id,
        p_amount: FINAL_COST,
        p_description: `Final generation — ${fallbackOutputs[0] || "custom"}`,
      });

      if (chargeError) {
        console.error("designly-agent credit charge failed:", chargeError.message);
        return json({
          error: "CREDIT_CHARGE_FAILED",
          message: "A kreditlevonás nem sikerült.",
          detail: chargeError.message,
        }, 500);
      }

      if (charged !== true) {
        return json({
          error: "INSUFFICIENT_CREDITS",
          message: `Ehhez ${FINAL_COST} kredit kell.`,
          required: FINAL_COST,
        }, 402);
      }

      creditsCharged = FINAL_COST;

      const refund = async (reason: string) => {
        const { error: refundError } = await supabaseAdmin.rpc("refund_credits", {
          p_user_id: user.id,
          p_amount: FINAL_COST,
          p_description: `Refund — ${reason}`,
        });
        if (refundError) {
          console.error("designly-agent refund failed:", refundError.message);
          creditError = refundError.message;
        } else {
          creditsCharged = 0;
        }
      };

      const imageApiKey = Deno.env.get("AI_IMAGE_API_KEY") || Deno.env.get("OPENAI_API_KEY") || apiKey;
      const imageModel = Deno.env.get("AI_IMAGE_MODEL") || "gpt-image-1";
      let finalImageUrl: string | null = null;

      try {
        const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: { "Authorization": `Bearer ${imageApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: imageModel,
            prompt: buildImagePrompt(structured, body.brief),
            size: "1536x1024",
            quality: "high",
            n: 1,
          }),
        });

        if (!imageResponse.ok) {
          const imageErrorText = await imageResponse.text().catch(() => "");
          throw new Error(`image stage ${imageResponse.status}: ${imageErrorText.slice(0, 240)}`);
        }

        const imageData = await imageResponse.json();
        const b64 = imageData.data?.[0]?.b64_json;
        const remoteUrl = imageData.data?.[0]?.url;

        if (b64) {
          const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
          const path = `final/${user.id}/${crypto.randomUUID()}.png`;
          const { error: uploadError } = await supabaseAdmin.storage
            .from("designly-generations")
            .upload(path, bytes, { contentType: "image/png", upsert: true });
          if (uploadError) throw new Error(`upload failed: ${uploadError.message}`);
          finalImageUrl = path;
        } else if (remoteUrl) {
          finalImageUrl = remoteUrl;
        } else {
          throw new Error("image stage returned no image");
        }
      } catch (finalImageError) {
        const detail = finalImageError instanceof Error ? finalImageError.message : String(finalImageError);
        console.error("designly-agent final image stage failed:", detail);
        await refund("final image stage failed");
        return json({
          error: "FINAL_GENERATION_FAILED",
          message: "A végleges generálás nem sikerült, a kredit visszatérítve.",
          refunded: true,
          detail,
        }, 500);
      }

      try {
        const { data: project, error: projectError } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            name: structured.businessName || body.brief.trim().slice(0, 80),
            type: fallbackOutputs[0] || "custom",
            brief: body.brief.trim(),
            design_brief: structured,
            build_spec: normalizedBuildSpec,
            image_url: finalImageUrl,
            status: "ready",
          })
          .select("id")
          .single();

        if (projectError || !project) {
          throw new Error(projectError?.message || "No project row returned");
        }
        projectId = project.id;
      } catch (projectInsertError) {
        const detail = projectInsertError instanceof Error ? projectInsertError.message : String(projectInsertError);
        console.error("designly-agent project insert failed:", detail);
        await refund("project insert failed");
        return json({
          error: "PROJECT_SAVE_FAILED",
          message: "A projekt mentése nem sikerült, a kredit visszatérítve.",
          refunded: true,
          detail,
        }, 500);
      }

      previewImageUrl = finalImageUrl;
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
      provider,
      model,
      designBrief: structured,
      previewImageUrl,
      previewId,
      projectId,
      creditsCharged,
      activeAgents,
      orchestration: {
        agents: orchestration.agents,
        capabilities: orchestration.capabilities,
        reasons: orchestration.reasons,
        teamExecuted: true,
        specialistOutputs: teamPlan.specialistOutputs || [],
        buildSpec: normalizedBuildSpec,
        qaStatus: reviewedTeam.status,
        blockers: reviewedTeam.blockers || [],
      },
      diagnostics: {
        provider,
        model,
        fallbackUsed: providerStageError !== null,
        providerError: providerStageError,
        previewSaved: previewId !== null,
        previewError,
        projectSaved: projectId !== null,
        creditError,
      },
    });
  } catch (error) {
    console.error("designly-agent error", error);
    const detail = error instanceof Error ? error.message : String(error);
    return json({
      error: "GENERATION_FAILED",
      message: "DESIGNLY could not create the structured design brief.",
      detail,
    }, 500);
  }
});
