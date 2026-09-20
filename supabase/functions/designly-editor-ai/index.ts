import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Device = "desktop" | "tablet" | "mobile";

type DesignState = {
  heroTitle: string;
  heroDescription: string;
  heroButton: string;
  accent: string;
  surface: string;
  text: string;
  heroAlign: "left" | "center" | "right";
  galleryColumns: 2 | 3 | 4;
  celticBorder: boolean;
  atmosphere: "clean" | "mist" | "glow";
};

const designSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    reply: { type: "string" },
    changes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          target: {
            type: "string",
            enum: [
              "heroTitle",
              "heroDescription",
              "heroButton",
              "accent",
              "surface",
              "text",
              "heroAlign",
              "galleryColumns",
              "celticBorder",
              "atmosphere"
            ]
          },
          value: { type: ["string", "boolean", "number"] }
        },
        required: ["target", "value"]
      }
    }
  },
  required: ["reply", "changes"]
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizeChanges(input: unknown): Array<{ target: keyof DesignState; value: string | boolean | number }> {
  if (!Array.isArray(input)) return [];
  const allowed = new Set<keyof DesignState>([
    "heroTitle",
    "heroDescription",
    "heroButton",
    "accent",
    "surface",
    "text",
    "heroAlign",
    "galleryColumns",
    "celticBorder",
    "atmosphere",
  ]);

  return input
    .filter((x): x is { target: keyof DesignState; value: string | boolean | number } =>
      !!x &&
      typeof x === "object" &&
      typeof (x as any).target === "string" &&
      allowed.has((x as any).target) &&
      ["string", "boolean", "number"].includes(typeof (x as any).value)
    )
    .slice(0, 8);
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

function applyChanges(base: DesignState, changes: Array<{ target: keyof DesignState; value: string | boolean | number }>): DesignState {
  const next = { ...base };

  for (const change of changes) {
    switch (change.target) {
      case "heroTitle":
      case "heroDescription":
      case "heroButton":
        if (typeof change.value === "string" && change.value.trim().length <= 240) {
          next[change.target] = change.value.trim();
        }
        break;
      case "accent":
      case "surface":
      case "text":
        if (typeof change.value === "string" && isHexColor(change.value)) {
          next[change.target] = change.value.trim();
        }
        break;
      case "heroAlign":
        if (change.value === "left" || change.value === "center" || change.value === "right") {
          next.heroAlign = change.value;
        }
        break;
      case "galleryColumns":
        if (typeof change.value === "number" && [2, 3, 4].includes(change.value)) {
          next.galleryColumns = change.value as 2 | 3 | 4;
        }
        break;
      case "celticBorder":
        if (typeof change.value === "boolean") next.celticBorder = change.value;
        break;
      case "atmosphere":
        if (change.value === "clean" || change.value === "mist" || change.value === "glow") {
          next.atmosphere = change.value;
        }
        break;
    }
  }

  return next;
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

    const body = await req.json().catch(() => ({}));
    const command = String(body.command || "").trim();
    const mode = body.mode === "preview" ? "preview" : "final";
    const approvedChanges = sanitizeChanges(body.approvedChanges);
    if (!command) return json({ error: "INVALID_REQUEST", message: "AI edit command is required." }, 400);

    const current: DesignState = {
      heroTitle: typeof body.design?.heroTitle === "string" ? body.design.heroTitle : "DESIGNLY STUDIO",
      heroDescription: typeof body.design?.heroDescription === "string" ? body.design.heroDescription : "Create premium websites, brands and campaigns with AI.",
      heroButton: typeof body.design?.heroButton === "string" ? body.design.heroButton : "GET STARTED",
      accent: typeof body.design?.accent === "string" ? body.design.accent : "#D6AA4A",
      surface: typeof body.design?.surface === "string" ? body.design.surface : "#111318",
      text: typeof body.design?.text === "string" ? body.design.text : "#F5F0E6",
      heroAlign: ["left", "center", "right"].includes(body.design?.heroAlign) ? body.design.heroAlign : "center",
      galleryColumns: [2, 3, 4].includes(Number(body.design?.galleryColumns)) ? Number(body.design.galleryColumns) as 2 | 3 | 4 : 3,
      celticBorder: Boolean(body.design?.celticBorder),
      atmosphere: ["clean", "mist", "glow"].includes(body.design?.atmosphere) ? body.design.atmosphere : "glow",
    };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, credits")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return json({ error: "PROFILE_NOT_FOUND", message: "A felhasználói profil nem található." }, 404);
    }

    const editCost = 1;
    if (mode === "final" && profile.role !== "owner" && profile.credits < editCost) {
      return json({
        error: "INSUFFICIENT_CREDITS",
        required: editCost,
        balance: profile.credits,
        message: "Nincs elegendő kredit az AI szerkesztéshez.",
      }, 402);
    }

    const model = Deno.env.get("DESIGNLY_GROQ_MODEL") || "openai/gpt-oss-120b";
    const groqKey = Deno.env.get("GROQ_API_KEY") || Deno.env.get("AI_API_KEY");

    const system = [
      "You are DESIGNLY STUDIO AI Editor.",
      "Return ONLY valid JSON matching the supplied schema.",
      "Your job is to convert a natural-language design request into a small set of safe, deterministic visual edits.",
      "Never generate JavaScript, HTML, SQL, CSS selectors, executable code, or arbitrary commands.",
      "Only use the allowed targets: heroTitle, heroDescription, heroButton, accent, surface, text, heroAlign, galleryColumns, celticBorder, atmosphere.",
      "Prefer the minimum number of changes necessary.",
      "Preserve the existing content unless the user explicitly asks to change it.",
      "Color values must be valid CSS hex values when changing accent, surface, or text.",
      "For heroAlign use only left, center, or right.",
      "For galleryColumns use only 2, 3, or 4.",
      "For celticBorder use true/false.",
      "For atmosphere use clean, mist, or glow.",
      "Keep the final reply concise and describe only the edits you applied."
    ].join("\n");

    let reply = "A módosítás előnézete elkészült.";
    let changes = approvedChanges;
    let nextDesign = applyChanges(current, changes);

    if (mode !== "final" || changes.length === 0) {
      if (!groqKey) {
        return json({
          error: "GROQ_NOT_CONFIGURED",
          providerNotConfigured: true,
          message: "A Groq API kulcs nincs beállítva a DESIGNLY backendben. Az AI szerkesztéshez GROQ_API_KEY szükséges.",
        }, 503);
      }

      const userPayload = JSON.stringify({
        command,
        selectedElement: body.selectedElement || null,
        device: (body.device || "desktop") as Device,
        currentDesign: current,
      });

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userPayload },
          ],
          reasoning_effort: "low",
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "designly_editor_changes",
              strict: true,
              schema: designSchema,
            },
          },
        }),
      });

      if (!response.ok) {
        const providerBody = await response.text().catch(() => "");
        console.error("Groq editor error:", response.status, providerBody);
        return json({
          error: "GROQ_REQUEST_FAILED",
          message: `A Groq AI-kérés sikertelen volt (${response.status}).`,
        }, 502);
      }

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content;
      if (typeof raw !== "string" || !raw.trim()) {
        return json({ error: "EMPTY_AI_RESULT", message: "A Groq nem adott értelmezhető szerkesztési eredményt." }, 502);
      }

      const parsed = JSON.parse(raw);
      changes = sanitizeChanges(parsed.changes);
      nextDesign = applyChanges(current, changes);
      reply = typeof parsed.reply === "string" ? parsed.reply : reply;
    }

    if (mode === "preview") {
      return json({
        ok: true,
        mode,
        provider: "groq",
        model,
        reply,
        changes,
        design: nextDesign,
        usage: null,
      });
    }

    if (profile.role !== "owner") {    const parsed = JSON.parse(raw);
    const changes = sanitizeChanges(parsed.changes);
    const nextDesign = applyChanges(current, changes);


    if (profile.role !== "owner") {
      const { error: deductError } = await supabase.rpc("deduct_credits", {
        p_user_id: user.id,
        p_amount: editCost,
        p_description: `DESIGNLY AI editor: ${command.slice(0, 80)}`,
      });
      if (deductError) {
        console.error("Designly editor credit deduction failed:", deductError);
        return json({ error: "CREDIT_DEDUCTION_FAILED", message: "A kredit levonása nem sikerült; a módosítást nem alkalmaztuk." }, 500);
      }
    }

    return json({
      ok: true,
      provider: "groq",
      model,
      reply: typeof parsed.reply === "string" ? parsed.reply : "A módosításokat alkalmaztam.",
      changes,
      design: nextDesign,
      usage: data.usage || null,
    });
  } catch (error) {
    console.error("designly-editor-ai error:", error);
    return json({
      error: "INTERNAL_ERROR",
      message: "A DESIGNLY AI szerkesztő hibát észlelt.",
    }, 500);
  }
});
