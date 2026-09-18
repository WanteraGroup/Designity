import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type GiftType = "full_unlock" | "plan";

interface GiftRequest {
  action: "gift" | "revoke";
  email?: string;
  giftType?: GiftType;
  planId?: "free" | "starter" | "pro" | "business" | "agency";
  giftId?: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
let serviceRoleKey: string | undefined;
try {
  serviceRoleKey = secretKeysRaw ? JSON.parse(secretKeysRaw)["default"] : undefined;
} catch {
  serviceRoleKey = undefined;
}

    if (!authHeader || !supabaseUrl || !serviceRoleKey) {
      return json({ error: "SERVER_CONFIG_ERROR" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });

    const caller = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });

    const { data: { user }, error: userError } = await caller.auth.getUser();
    if (userError || !user) return json({ error: "NO_SESSION" }, 401);

    const { data: actor } = await admin
      .from("profiles")
      .select("id, role, email")
      .eq("id", user.id)
      .maybeSingle();

    if (!actor || !["owner", "admin"].includes(actor.role)) {
      return json({ error: "FORBIDDEN" }, 403);
    }

    const body = (await req.json()) as GiftRequest;

    if (body.action === "revoke") {
      if (!body.giftId) return json({ error: "MISSING_GIFT_ID" }, 400);

      const { data: gift, error: giftError } = await admin
        .from("admin_gifts")
        .select("*")
        .eq("id", body.giftId)
        .maybeSingle();

      if (giftError || !gift) return json({ error: "GIFT_NOT_FOUND" }, 404);
      if (gift.status === "revoked") return json({ success: true, alreadyRevoked: true });

      if (gift.target_user_id) {
        await admin
          .from("profiles")
          .update({
            plan_id: gift.previous_plan_id || "free",
            credits: gift.previous_credits ?? 10,
            unlimited_access: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", gift.target_user_id);
      }

      await admin
        .from("admin_gifts")
        .update({ status: "revoked", revoked_at: new Date().toISOString() })
        .eq("id", gift.id);

      await admin.from("admin_audit_log").insert({
        actor_user_id: user.id,
        action: "gift_revoked",
        target_email: gift.email,
        target_user_id: gift.target_user_id,
        metadata: { gift_id: gift.id, gift_type: gift.gift_type, plan_id: gift.plan_id },
      });

      return json({ success: true, message: "Gift access revoked." });
    }

    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) return json({ error: "INVALID_EMAIL" }, 400);

    const giftType = body.giftType || "full_unlock";
    if (giftType === "plan" && !body.planId) return json({ error: "PLAN_REQUIRED" }, 400);

    if (existingProfile?.role === "owner") {
      return json({ error: "OWNER_PROTECTED", message: "The OWNER account is protected and cannot be changed by gifting." }, 400);
    }

    if (giftType === "plan") {
      const { data: plan } = await admin
        .from("plans")
        .select("id, name, credits_monthly, is_public")
        .eq("id", body.planId!)
        .maybeSingle();

      if (!plan || !plan.is_public) return json({ error: "INVALID_PLAN" }, 400);
    }

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, plan_id, credits, unlimited_access, role")
      .ilike("email", email)
      .maybeSingle();

    const { data: gift, error: insertError } = await admin
      .from("admin_gifts")
      .insert({
        email,
        target_user_id: existingProfile?.id || null,
        gift_type: giftType,
        plan_id: giftType === "plan" ? body.planId : null,
        previous_plan_id: existingProfile?.plan_id || "free",
        previous_credits: existingProfile?.credits ?? 10,
        status: existingProfile ? "active" : "pending",
        granted_by: user.id,
        activated_at: existingProfile ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (insertError || !gift) {
      console.error("Gift insert error", insertError);
      return json({ error: "GIFT_CREATE_FAILED" }, 500);
    }

    if (existingProfile) {
      if (giftType === "full_unlock") {
        const { error } = await admin
          .from("profiles")
          .update({
            plan_id: "owner",
            credits: 999999,
            unlimited_access: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProfile.id);

        if (error) {
          await admin.from("admin_gifts").delete().eq("id", gift.id);
          return json({ error: "PROFILE_UPDATE_FAILED" }, 500);
        }
      } else {
        const { data: plan } = await admin
          .from("plans")
          .select("id, credits_monthly")
          .eq("id", body.planId!)
          .single();

        const { error } = await admin
          .from("profiles")
          .update({
            plan_id: body.planId,
            credits: Math.max(existingProfile.credits ?? 0, plan?.credits_monthly ?? 0),
            unlimited_access: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProfile.id);

        if (error) {
          await admin.from("admin_gifts").delete().eq("id", gift.id);
          return json({ error: "PROFILE_UPDATE_FAILED" }, 500);
        }
      }
    } else {
      // Supabase sends the standard invitation email. The signup trigger
      // sees the pending admin_gifts row and activates the gift automatically.
      const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { designly_gift_id: gift.id, designly_gift_type: giftType, designly_plan_id: body.planId || null },
      });

      if (inviteError) {
        await admin.from("admin_gifts").delete().eq("id", gift.id);
        console.error("Invite error", inviteError);
        return json({ error: "INVITE_EMAIL_FAILED", message: inviteError.message }, 502);
      }
    }

    await admin.from("admin_audit_log").insert({
      actor_user_id: user.id,
      action: "gift_granted",
      target_email: email,
      target_user_id: existingProfile?.id || null,
      metadata: {
        gift_id: gift.id,
        gift_type: giftType,
        plan_id: giftType === "plan" ? body.planId : null,
        existing_user: !!existingProfile,
        invitation_sent: !existingProfile,
      },
    });

    return json({
      success: true,
      giftId: gift.id,
      existingUser: !!existingProfile,
      emailSent: !existingProfile,
      message: existingProfile
        ? "Access was activated immediately for the existing account."
        : "Invitation email sent. The gift activates when the invited account is created.",
    });
  } catch (error) {
    console.error("admin-gift error", error);
    return json({ error: "INTERNAL_ERROR", message: "Admin gift operation failed." }, 500);
  }
});
