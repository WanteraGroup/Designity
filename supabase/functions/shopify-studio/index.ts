import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getShopDomain() {
  const raw = String(Deno.env.get("SHOPIFY_SHOP") || "").trim();
  if (!raw) throw new Error("SHOPIFY_NOT_CONFIGURED");

  const withoutProtocol = raw.replace(/^https?:\/\//i, "").split("/")[0];
  const shop = withoutProtocol.replace(/\.myshopify\.com$/i, "");

  if (!/^[a-z0-9][a-z0-9-]*$/i.test(shop)) {
    throw new Error("SHOPIFY_INVALID_SHOP");
  }

  return shop;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getShopifyAccessToken() {
  const shop = getShopDomain();
  const clientId = Deno.env.get("SHOPIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SHOPIFY_CLIENT_SECRET");

  if (!clientId || !clientSecret) throw new Error("SHOPIFY_NOT_CONFIGURED");

  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60_000) {
    return cachedAccessToken.token;
  }

  const tokenResponse = await fetch(
    "https://" + shop + ".myshopify.com/admin/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    },
  );

  const tokenBody = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenBody.access_token) {
    console.error("Shopify token request failed", tokenResponse.status, tokenBody?.error || tokenBody?.errors);
    throw new Error("SHOPIFY_AUTH_ERROR");
  }

  const expiresIn = Number(tokenBody.expires_in) || 86_399;
  cachedAccessToken = {
    token: String(tokenBody.access_token),
    expiresAt: Date.now() + Math.max(60_000, expiresIn * 1000),
  };

  return cachedAccessToken.token;
}

async function shopifyGraphql(query: string, variables: Record<string, unknown> = {}) {
  const shop = getShopDomain();
  const token = await getShopifyAccessToken();

  const response = await fetch("https://" + shop + ".myshopify.com/admin/api/2026-07/graphql.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Shopify GraphQL HTTP error", response.status, body);
    throw new Error("SHOPIFY_API_ERROR");
  }
  if (body.errors?.length) {
    console.error("Shopify GraphQL errors", body.errors);
    throw new Error("SHOPIFY_GRAPHQL_ERROR");
  }
  return body.data;
}

async function assertAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("NO_SESSION");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
  let serviceRoleKey: string | undefined;
  try {
    serviceRoleKey = secretKeysRaw ? JSON.parse(secretKeysRaw)["default"] : undefined;
  } catch {
    serviceRoleKey = undefined;
  }
  if (!supabaseUrl || !serviceRoleKey) throw new Error("SERVER_CONFIG_ERROR");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("NO_SESSION");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw new Error("PROFILE_LOOKUP_FAILED");
  if (!profile || !["owner", "admin"].includes(profile.role)) throw new Error("FORBIDDEN");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    await assertAdmin(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "list";

    if (action === "list") {
      const data = await shopifyGraphql(`
        query {
          shop {
            name
            currencyCode
            primaryDomain { url }
          }
          products(first: 50, sortKey: UPDATED_AT, reverse: true) {
            nodes {
              id title handle status productType vendor
              featuredImage { url altText }
              variants(first: 1) { nodes { price inventoryQuantity } }
            }
          }
        }
      `);
      return json({
        shop: {
          name: data.shop.name,
          domain: new URL(data.shop.primaryDomain.url).hostname,
          currencyCode: data.shop.currencyCode || "HUF",
        },
        products: data.products.nodes.map((p: any) => ({
          id: p.id,
          title: p.title,
          handle: p.handle,
          status: p.status,
          productType: p.productType || "",
          vendor: p.vendor || "",
          price: p.variants?.nodes?.[0]?.price || "0",
          inventory: p.variants?.nodes?.[0]?.inventoryQuantity ?? 0,
          imageUrl: p.featuredImage?.url || null,
        })),
      });
    }

    if (action === "create") {
      const product = body.product || {};
      if (!String(product.title || "").trim()) return json({ error: "INVALID_REQUEST", message: "A terméknév kötelező." }, 400);

      const data = await shopifyGraphql(`
        mutation CreateProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
          productCreate(product: $product, media: $media) {
            product { id title handle status productType vendor variants(first: 1) { nodes { price } } }
            userErrors { field message }
          }
        }
      `, {
        product: {
          title: String(product.title).trim(),
          descriptionHtml: String(product.descriptionHtml || ""),
          vendor: String(product.vendor || "DESIGNLY"),
          productType: String(product.productType || ""),
          status: product.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
          tags: ["designly"],
        },
        media: product.imageUrl ? [{
          originalSource: String(product.imageUrl),
          alt: String(product.title).trim(),
          mediaContentType: "IMAGE",
        }] : undefined,
      });

      const result = data.productCreate;
      if (result.userErrors?.length) return json({ error: "SHOPIFY_VALIDATION", message: result.userErrors.map((e: any) => e.message).join("; ") }, 400);

      // Shopify creates the initial variant; set its price after creation.
      const price = Number(product.price || 0);
      if (result.product?.id && Number.isFinite(price) && price >= 0) {
        const variantId = await shopifyGraphql(`
          query ProductVariantId($id: ID!) {
            product(id: $id) { variants(first: 1) { nodes { id } } }
          }
        `, { id: result.product.id });
        const id = variantId.product?.variants?.nodes?.[0]?.id;
        if (id) {
          const updated = await shopifyGraphql(`
            mutation UpdateVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
              productVariantsBulkUpdate(productId: $productId, variants: $variants) {
                productVariants { id price }
                userErrors { field message }
              }
            }
          `, { productId: result.product.id, variants: [{ id, price: price.toFixed(2) }] });
          const errors = updated.productVariantsBulkUpdate?.userErrors || [];
          if (errors.length) return json({ error: "SHOPIFY_VARIANT_UPDATE", message: errors.map((e: any) => e.message).join("; ") }, 400);
        }
      }

      return json({ success: true, product: result.product });
    }

    return json({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    const code = error instanceof Error ? error.message : "INTERNAL_ERROR";
    if (code === "NO_SESSION") return json({ error: code, message: "Bejelentkezés szükséges." }, 401);
    if (code === "FORBIDDEN") return json({ error: code, message: "Csak admin vagy owner kezelheti a Shopify modult." }, 403);
    if (code === "SHOPIFY_NOT_CONFIGURED") return json({ error: code, message: "A Shopify szerveroldali kapcsolat még nincs beállítva. A SHOPIFY_SHOP, SHOPIFY_CLIENT_ID és SHOPIFY_CLIENT_SECRET Supabase secret szükséges." }, 503);
    if (code === "PROFILE_LOOKUP_FAILED") return json({ error: code, message: "A felhasználói jogosultság ellenőrzése sikertelen." }, 500);
    if (code === "SERVER_CONFIG_ERROR") return json({ error: code, message: "A Supabase szerver konfiguráció hiányos." }, 500);
    console.error("shopify-studio error", error);
    return json({ error: code, message: "A Shopify művelet sikertelen." }, 502);
  }
});
