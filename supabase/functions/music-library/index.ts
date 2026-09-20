import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getSecretKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) return undefined;
  try { return JSON.parse(raw)["default"] as string | undefined; } catch { return undefined; }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = getSecretKey();
    if (!authHeader || !supabaseUrl || !serviceKey) return json({ error: "SERVER_CONFIGURATION_ERROR" }, 500);

    const client = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) return json({ error: "UNAUTHORIZED" }, 401);

    const { data, error } = await admin
      .from("music_generations")
      .select("id,title,duration_seconds,storage_path,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(24);

    if (error) return json({ error: "LIBRARY_LOAD_FAILED" }, 500);

    const songs = await Promise.all((data || []).map(async (song) => {
      const { data: signed, error: signedError } = await admin.storage
        .from("designly-music")
        .createSignedUrl(song.storage_path, 24 * 60 * 60);
      return {
        id: song.id,
        title: song.title,
        duration_seconds: song.duration_seconds,
        audio_url: signedError ? null : signed?.signedUrl || null,
        created_at: song.created_at,
      };
    }));

    return json({ success: true, songs });
  } catch (error) {
    return json({
      error: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "A zenei könyvtár nem érhető el.",
    }, 500);
  }
});
