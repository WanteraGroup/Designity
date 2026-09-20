import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
  try {
    return JSON.parse(raw)["default"] as string | undefined;
  } catch {
    return undefined;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = getSecretKey();
    const falKey = Deno.env.get("FAL_KEY");

    if (!authHeader || !supabaseUrl || !serviceKey) return json({ error: "SERVER_CONFIGURATION_ERROR" }, 500);
    if (!falKey) return json({
      error: "MUSIC_PROVIDER_NOT_CONFIGURED",
      message: "Az AI Music szolgáltató nincs konfigurálva. A Supabase Secrets között FAL_KEY szükséges.",
    }, 503);

    const userClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "UNAUTHORIZED" }, 401);

    const body = await req.json();
    const title = String(body.title || "DESIGNLY AI Song").trim().slice(0, 120);
    const lyrics = String(body.lyrics || "").trim().slice(0, 12000);
    const genre = String(body.genre || "modern pop").trim().slice(0, 300);
    const mood = String(body.mood || "emotional, cinematic, uplifting").trim().slice(0, 500);
    const vocal = String(body.vocal || "warm lead vocal").trim().slice(0, 300);
    const duration = Math.max(60, Math.min(300, Math.round(Number(body.duration) || 60)));
    const mode = body.mode === "preview" ? "preview" : "final";

    if (!lyrics) return json({ error: "MISSING_LYRICS", message: "Dalszöveg szükséges." }, 400);

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, role, credits, unlimited_access")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) return json({ error: "PROFILE_NOT_FOUND" }, 404);

    const baseCostSetting = await admin
      .from("system_settings")
      .select("value")
      .eq("key", "generation_costs")
      .maybeSingle();

    const costs = (baseCostSetting.data?.value || {}) as Record<string, number>;
    const perMinute = Number(costs.music) > 0 ? Number(costs.music) : 100;
    const creditCost = Math.ceil(duration / 60) * perMinute;
    const unlimited = profile.role === "owner" || profile.unlimited_access === true;

    if (mode === "final" && !unlimited && Number(profile.credits) < creditCost) {
      return json({
        error: "INSUFFICIENT_CREDITS",
        message: "Nincs elegendő kredit ehhez a dalhoz.",
        required: creditCost,
        balance: profile.credits,
      }, 402);
    }

    if (mode === "final" && !unlimited) {
      const { error: deductError } = await admin.rpc("deduct_credits", {
        p_user_id: user.id,
        p_amount: creditCost,
        p_description: "AI Music: " + title,
      });
      if (deductError) return json({ error: "CREDIT_DEDUCTION_FAILED" }, 500);
    }

    const prompt = [
      "Create a complete original song.",
      "Genre: " + genre + ".",
      "Mood: " + mood + ".",
      "Vocals: " + vocal + ".",
      "Arrangement: professional commercial production, clear intro, verses, strong chorus, bridge and satisfying ending.",
      "Use the supplied lyrics exactly as the lyrical source; do not replace them with unrelated lyrics.",
      "Do not imitate a named living artist or copyrighted recording.",
    ].join(" ");

    try {
      const providerResponse = await fetch("https://fal.run/minimax/music-3", {
        method: "POST",
        headers: {
          Authorization: "Key " + falKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          lyrics,
          duration,
          num_inference_steps: 30,
          guidance_scale: 1.7,
        }),
      });

      const providerText = await providerResponse.text();
      if (!providerResponse.ok) {
        throw new Error("Music provider error: " + providerResponse.status + " " + providerText.slice(0, 500));
      }

      const providerData = JSON.parse(providerText);
      const sourceUrl = providerData?.audio?.url;
      if (!sourceUrl) throw new Error("Music provider returned no audio URL.");

      const audioResponse = await fetch(sourceUrl);
      if (!audioResponse.ok) throw new Error("Generated audio could not be downloaded.");

      const audioBuffer = await audioResponse.arrayBuffer();
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").slice(0, 60) || "song";
      if (mode === "preview") {
        return json({
          success: true,
          preview: true,
          audioUrl: sourceUrl,
          duration: Math.round(Number(providerData.duration) || duration),
          creditsUsed: 0,
          message: "A zenei előnézet ingyenes. Kredit csak véglegesítéskor kerül levonásra.",
        });
      }

      const path = user.id + "/" + crypto.randomUUID() + "-" + safeTitle + ".wav";

      const { error: uploadError } = await admin.storage
        .from("designly-music")
        .upload(path, audioBuffer, {
          contentType: "audio/wav",
          cacheControl: "31536000",
          upsert: false,
        });

      if (uploadError) throw new Error("Audio storage upload failed: " + uploadError.message);

      const { data: signedAudio, error: signedAudioError } = await admin.storage
        .from("designly-music")
        .createSignedUrl(path, 24 * 60 * 60);
      if (signedAudioError || !signedAudio?.signedUrl) {
        throw new Error("Audio signed URL creation failed.");
      }
      const audioUrl = signedAudio.signedUrl;

      const { error: rowError } = await admin.from("music_generations").insert({
        user_id: user.id,
        title,
        lyrics,
        genre,
        mood,
        vocal,
        duration_seconds: Math.round(Number(providerData.duration) || duration),
        credits_cost: unlimited ? 0 : creditCost,
        audio_url: audioUrl,
        storage_path: path,
        provider: "minimax/music-3",
        seed: providerData.seed ?? null,
      });

      if (rowError) throw new Error("Music record failed: " + rowError.message);

      return json({
        success: true,
        audioUrl,
        duration: Math.round(Number(providerData.duration) || duration),
        creditsUsed: unlimited ? 0 : creditCost,
        provider: "minimax/music-3",
      });
    } catch (generationError) {
      if (mode === "final" && !unlimited) {
        await admin.rpc("refund_credits", {
          p_user_id: user.id,
          p_amount: creditCost,
          p_description: "Refund: AI Music generation failed",
        });
      }
      return json({
        error: "MUSIC_GENERATION_FAILED",
        message: generationError instanceof Error ? generationError.message : "A zene generálása sikertelen.",
      }, 500);
    }
  } catch (error) {
    return json({
      error: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "Váratlan szerverhiba.",
    }, 500);
  }
});
