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

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "FILE_REQUIRED" }, 400);

    const groqKey = Deno.env.get("GROQ_API_KEY") || Deno.env.get("AI_API_KEY");
    if (!groqKey) return json({ error: "GROQ_NOT_CONFIGURED", providerNotConfigured: true }, 503);

    const upload = new FormData();
    upload.append("file", file, file.name || "voice.webm");
    upload.append("model", Deno.env.get("DESIGNLY_STT_MODEL") || "whisper-large-v3-turbo");
    upload.append("response_format", "json");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}` },
      body: upload,
    });
    if (!response.ok) return json({ error: "TRANSCRIPTION_FAILED", message: `Groq Whisper returned ${response.status}.` }, 502);

    const data = await response.json();
    return json({ ok: true, provider: "groq", text: data.text || "" });
  } catch (error) {
    console.error("designly-voice", error);
    return json({ error: "INTERNAL_ERROR" }, 500);
  }
});
