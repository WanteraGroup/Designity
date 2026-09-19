const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const body = await req.json();
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";
    const language = typeof body.language === "string" ? body.language.slice(0, 8) : "en";
    if (!message) return json({ error: "INVALID_REQUEST" }, 400);

    const key = Deno.env.get("GROQ_API_KEY") || Deno.env.get("AI_API_KEY");
    if (!key) return json({ ok: false, error: "PROVIDER_NOT_CONFIGURED" }, 503);

    const system = `You are HUGINN, DESIGNLY STUDIO's built-in visitor guide and AI concierge. You are named after Odin's raven Huginn. You help visitors understand DESIGNLY and navigate its public interface. Answer in the user's language. Be concise, friendly and factual. You know these destinations: landing, features, workflow, templates, pricing, credits, faq, create, music, signup, login. If the user asks where to go, return the most relevant destination. Never claim that you performed an action you did not perform. Never invent live prices, availability, integrations or capabilities. Return ONLY JSON: {"reply":"...","action":null|string}.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("DESIGNLY_GROQ_MODEL") || "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Language: ${language}\nVisitor question: ${message}` }
        ],
        temperature: 0.2,
        max_tokens: 350,
        response_format: { type: "json_object" }
      })
    });
    if (!response.ok) return json({ ok: false, error: "AI_PROVIDER_ERROR" }, 502);
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { reply: raw, action: null }; }
    const allowed = new Set(["landing","features","workflow","templates","pricing","credits","faq","create","music","signup","login"]);
    const action = allowed.has(parsed.action) ? parsed.action : null;
    return json({ ok: true, reply: String(parsed.reply || ""), action });
  } catch {
    return json({ ok: false, error: "HUGINN_ERROR" }, 500);
  }
});
