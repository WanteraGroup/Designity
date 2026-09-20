import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Revolut-Request-Timestamp, Revolut-Signature",
};

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getServiceKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) return undefined;
  try { return JSON.parse(raw)["default"] as string | undefined; } catch { return undefined; }
}

function hex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyRevolutSignature(rawBody: string, timestamp: string, header: string, secret: string) {
  const timestampMs = Number(timestamp);
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) return false;

  const versions = header
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .filter(Boolean);

  if (!versions.length) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const payload = "v1." + timestamp + "." + rawBody;
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expected = hex(digest);

  return versions.some((candidate) => candidate.length === expected.length && candidate === expected);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const secret = Deno.env.get("REVOLUT_WEBHOOK_SECRET");
    const timestamp = req.headers.get("Revolut-Request-Timestamp");
    const signature = req.headers.get("Revolut-Signature");
    if (!secret || !timestamp || !signature) return json({ error: "WEBHOOK_NOT_CONFIGURED" }, 503);

    const rawBody = await req.text();
    if (!(await verifyRevolutSignature(rawBody, timestamp, signature, secret))) {
      return json({ error: "INVALID_SIGNATURE" }, 401);
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      order_id?: string;
      merchant_order_ext_ref?: string;
    };

    const event = String(payload.event || "");
    const orderId = String(payload.order_id || "");
    const paymentId = String(payload.merchant_order_ext_ref || "");

    if (!event || !orderId || !paymentId) return json({ error: "INVALID_WEBHOOK_PAYLOAD" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = getServiceKey();
    if (!supabaseUrl || !serviceKey) return json({ error: "SERVER_CONFIGURATION_ERROR" }, 500);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .select("id,user_id,amount,currency,type,metadata,status")
      .eq("id", paymentId)
      .maybeSingle();

    if (paymentError || !payment) return json({ error: "PAYMENT_NOT_FOUND" }, 404);

    const metadata = {
      ...((payment.metadata || {}) as Record<string, unknown>),
      payment_id: payment.id,
      itemType: payment.metadata?.itemType || payment.type,
      provider_event: payload,
    };

    const { error: rpcError } = await admin.rpc("record_payment_event", {
      p_provider: "revolut",
      p_event_type: event,
      p_provider_event_id: orderId,
      p_user_id: payment.user_id,
      p_amount: payment.amount,
      p_currency: payment.currency,
      p_metadata: metadata,
    });

    if (rpcError) {
      console.error("record_payment_event failed:", rpcError);
      return json({ error: "PAYMENT_FULFILLMENT_FAILED" }, 500);
    }

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (error) {
    console.error("payment-webhook error:", error);
    return json({ error: "INTERNAL_ERROR" }, 500);
  }
});
