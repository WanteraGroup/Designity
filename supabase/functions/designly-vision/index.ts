import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "NO_SESSION" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const secret = Deno.env.get("SUPABASE_SECRET_KEYS");
    let serviceRoleKey: string | undefined;
    try { serviceRoleKey = secret ? JSON.parse(secret).default : undefined; } catch {}
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "SERVER_CONFIG_ERROR" }, 500);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "NO_SESSION" }, 401);

    const body = await req.json().catch(() => ({}));
    const imageUrl = String(body.imageUrl || "").trim();
    const prompt = String(body.prompt || "Analyze this design image for layout, colors, typography, composition and improvement opportunities.").trim();
    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
      return json({ error: "INVALID_IMAGE_URL" }, 400);
    }

    const groqKey = Deno.env.get("GROQ_API_KEY") || Deno.env.get("AI_API_KEY");
    if (!groqKey) return json({ error: "GROQ_NOT_CONFIGURED", providerNotConfigured: true }, 503);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("DESIGNLY_VISION_MODEL") || "qwen/qwen3.6-27b",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        }],
        temperature: 0.2,
        max_completion_tokens: 1800,
      }),
    });

    if (!response.ok) return json({ error: "VISION_FAILED", message: `Groq Vision returned ${response.status}.` }, 502);
    const data = await response.json();
    return json({
      ok: true,
      provider: "groq",
      model: data.model,
      analysis: data.choices?.[0]?.message?.content || "",
    });
  } catch (error) {
    console.error("designly-vision", error);
    return json({ error: "INTERNAL_ERROR" }, 500);
  }
});
