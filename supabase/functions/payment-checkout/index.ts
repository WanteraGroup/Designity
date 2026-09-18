import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CheckoutRequest {
  itemType: "subscription" | "credit_package";
  itemId: string;
}

// ─────────────────────────────────────────────────────────
// PaymentProvider interface
//
// Future providers (RevolutProvider, WiseProvider) implement
// this interface. Checkout logic never needs to change.
//
// Two modes:
//   "payment_link" — redirects to a static link URL, no API key
//   "api"           — calls provider API, requires API key
// ─────────────────────────────────────────────────────────
interface PaymentProvider {
  name: string;
  mode: "payment_link" | "api";
  isConfigured: boolean;
  createCheckoutSession(params: {
    amount: number;
    currency: string;
    description: string;
    paymentId: string;
    origin: string;
  }): Promise<{ checkoutUrl: string | null; providerPaymentId: string | null }>;
}

// ─────────────────────────────────────────────────────────
// PaymentLinkProvider
// Works with any provider (Revolut, Wise, or generic) by
// redirecting to a pre-configured payment link URL.
// No API key required. The link URL is set via PAYMENT_LINK.
// ─────────────────────────────────────────────────────────
function createPaymentLinkProvider(providerName: string, linkUrl: string | null): PaymentProvider {
  return {
    name: providerName,
    mode: "payment_link",
    isConfigured: !!linkUrl,
    async createCheckoutSession({ paymentId, origin }) {
      if (!linkUrl) return { checkoutUrl: null, providerPaymentId: null };
      const url = new URL(linkUrl);
      url.searchParams.set("ref", paymentId);
      url.searchParams.set("success_url", `${origin}/checkout?status=initiated&payment=${paymentId}`);
      url.searchParams.set("cancel_url", `${origin}/checkout?status=cancelled&payment=${paymentId}`);
      return { checkoutUrl: url.toString(), providerPaymentId: null };
    },
  };
}

// ─────────────────────────────────────────────────────────
// RevolutApiProvider — future API integration
// Requires PAYMENT_API_KEY. Not used in MVP.
// ─────────────────────────────────────────────────────────
function createRevolutApiProvider(apiKey: string | null): PaymentProvider {
  return {
    name: "revolut",
    mode: "api",
    isConfigured: !!apiKey,
    async createCheckoutSession({ amount, currency, description, paymentId, origin }) {
      if (!apiKey) return { checkoutUrl: null, providerPaymentId: null };
      const response = await fetch("https://merchant.revolut.com/api/orders", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Revolut-Api-Version": "2024-09-01",
        },
        body: JSON.stringify({
          amount: amount * 100,
          currency,
          description,
          merchant_order_ext_ref: paymentId,
          success_url: `${origin}/checkout?status=initiated&payment=${paymentId}`,
          failure_url: `${origin}/checkout?status=failed&payment=${paymentId}`,
          cancellation_url: `${origin}/checkout?status=cancelled&payment=${paymentId}`,
        }),
      });
      if (!response.ok) throw new Error(`Revolut API returned ${response.status}`);
      const data = await response.json();
      return { checkoutUrl: data.checkout_url, providerPaymentId: data.id };
    },
  };
}

// ─────────────────────────────────────────────────────────
// WiseApiProvider — future API integration
// Requires PAYMENT_API_KEY. Not used in MVP.
// ─────────────────────────────────────────────────────────
function createWiseApiProvider(apiKey: string | null): PaymentProvider {
  return {
    name: "wise",
    mode: "api",
    isConfigured: !!apiKey,
    async createCheckoutSession({ amount, currency, description, paymentId, origin }) {
      if (!apiKey) return { checkoutUrl: null, providerPaymentId: null };
      const response = await fetch("https://api.wise.com/payment-links", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency,
          description,
          reference: paymentId,
          success_url: `${origin}/checkout?status=initiated&payment=${paymentId}`,
          failure_url: `${origin}/checkout?status=failed&payment=${paymentId}`,
        }),
      });
      if (!response.ok) throw new Error(`Wise API returned ${response.status}`);
      const data = await response.json();
      return { checkoutUrl: data.url || data.payment_link, providerPaymentId: data.id };
    },
  };
}

// ─────────────────────────────────────────────────────────
// Provider registry
//
// Resolves the active provider from environment variables:
//   PAYMENT_PROVIDER  — "revolut", "wise", or "manual_or_link" (default)
//   PAYMENT_MODE      — "payment_link" (default) or "api"
//   PAYMENT_LINK      — URL for payment-link mode (no API key needed)
//   PAYMENT_API_KEY   — API key for api mode (not required for MVP)
//
// Examples:
//   PAYMENT_PROVIDER=revolut
//   PAYMENT_MODE=payment_link
//   PAYMENT_LINK=https://pay.revolut.com/xyz
//
//   PAYMENT_PROVIDER=wise
//   PAYMENT_MODE=payment_link
//   PAYMENT_LINK=https://wise.com/pay/me/abc
// ─────────────────────────────────────────────────────────
function getActiveProvider(): PaymentProvider {
  const providerName = Deno.env.get("PAYMENT_PROVIDER") || "manual_or_link";
  const mode = Deno.env.get("PAYMENT_MODE") || "payment_link";
  const apiKey = Deno.env.get("PAYMENT_API_KEY") || null;
  const linkUrl = Deno.env.get("PAYMENT_LINK") || null;

  // In payment_link mode, any provider uses the link URL — no API key needed
  if (mode === "payment_link") {
    return createPaymentLinkProvider(providerName, linkUrl);
  }

  // In api mode, use the provider's API (requires API key)
  switch (providerName) {
    case "revolut": return createRevolutApiProvider(apiKey);
    case "wise": return createWiseApiProvider(apiKey);
    default: return createPaymentLinkProvider(providerName, linkUrl);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
let supabaseKey: string | undefined;
try {
  supabaseKey = secretKeysRaw ? JSON.parse(secretKeysRaw)["default"] : undefined;
} catch {
  supabaseKey = undefined;
}
if (!supabaseKey) throw new Error("SUPABASE_SECRET_KEYS is not configured");
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── GET: query payment status ──
    if (req.method === "GET") {
      const url = new URL(req.url);
      const paymentId = url.searchParams.get("paymentId");
      if (!paymentId) {
        return new Response(JSON.stringify({ error: "Missing paymentId" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: payment, error: payError } = await supabase
        .from("payments")
        .select("id, status, amount, currency, type, provider, created_at")
        .eq("id", paymentId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (payError || !payment) {
        return new Response(JSON.stringify({ error: "Payment not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          type: payment.type,
          provider: payment.provider,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── POST: create checkout session ──
    // OWNER never pays
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "owner") {
      return new Response(JSON.stringify({
        error: "OWNER_NO_PAYMENT",
        message: "OWNER accounts have unlimited access. No payment needed.",
      }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: CheckoutRequest = await req.json();
    const { itemType, itemId } = body;

    if (!itemType || !itemId) {
      return new Response(JSON.stringify({ error: "Missing itemType or itemId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const provider = getActiveProvider();

    if (!provider.isConfigured) {
      return new Response(JSON.stringify({
        error: "PAYMENT_PROVIDER_NOT_CONFIGURED",
        message: "Online payment is not configured yet. Please contact us to complete your purchase.",
        providerNotConfigured: true,
        providerName: provider.name,
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up the item price
    let amount = 0;
    let currency = "HUF";
    let description = "";

    if (itemType === "subscription") {
      const { data: plan } = await supabase
        .from("plans")
        .select("name, price_monthly, credits_monthly")
        .eq("id", itemId)
        .maybeSingle();
      if (!plan) {
        return new Response(JSON.stringify({ error: "Plan not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      amount = plan.price_monthly;
      description = `Subscription: ${plan.name}`;
    } else if (itemType === "credit_package") {
      if (customCreditCount !== null) {
        amount = customCreditPrice(customCreditCount);
        description = `Custom credit package: ${customCreditCount} credits`;
      } else {
        const { data: pkg } = await supabase
          .from("credit_packages")
          .select("label, price, credits")
          .eq("id", itemId)
          .maybeSingle();
        if (!pkg) {
          return new Response(JSON.stringify({ error: "Credit package not found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        amount = pkg.price;
        description = `Credit package: ${pkg.label}`;
      }
    }

    // Custom credit purchases: 1-10000 credits.
    const customCreditMatch = itemType === "credit_package" ? itemId.match(/^custom_(\d+)$/) : null;
    const customCreditCount = customCreditMatch ? Math.max(1, Math.min(10000, Number(customCreditMatch[1]))) : null;
    const customCreditPrice = (credits: number) => {
      const tier = Math.floor(credits / 100);
      const unitPrice = Math.max(10, 21 - tier);
      return credits * unitPrice;
    };

    // Record a pending payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        amount,
        currency,
        type: itemType,
        status: "pending",
        provider: provider.name,
      })
      .select()
      .single();

    if (paymentError) {
      return new Response(JSON.stringify({ error: "Failed to create payment record" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create checkout session via the provider
    let checkoutUrl: string | null = null;
    let providerPaymentId: string | null = null;

    try {
      const result = await provider.createCheckoutSession({
        amount,
        currency,
        description,
        paymentId: payment.id,
        origin: req.headers.get("origin") || "",
      });
      checkoutUrl = result.checkoutUrl;
      providerPaymentId = result.providerPaymentId;

      if (providerPaymentId) {
        await supabase
          .from("payments")
          .update({ provider_payment_id: providerPaymentId })
          .eq("id", payment.id);
      }
    } catch (err) {
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("id", payment.id);

      return new Response(JSON.stringify({
        error: "CHECKOUT_FAILED",
        message: "Failed to create checkout session. Please try again.",
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      paymentId: payment.id,
      checkoutUrl,
      provider: provider.name,
      mode: provider.mode,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred during checkout.",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
