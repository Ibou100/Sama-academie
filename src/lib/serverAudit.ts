import { SupabaseClient } from "@supabase/supabase-js";

export interface ServerLogParams {
  adminId?: string;
  adminEmail?: string;
  adminName?: string;
  action: string;
  targetUserId?: string;
  targetName?: string;
  details: string;
  status?: string;
}

export async function recordServerAudit(
  req: Request,
  supabaseAdmin: SupabaseClient,
  params: ServerLogParams
) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "127.0.0.1";
    
    let country = req.headers.get("x-vercel-ip-country") || "SN";
    let city = "";
    try {
      city = decodeURIComponent(req.headers.get("x-vercel-ip-city") || "Dakar");
    } catch {
      city = "Dakar";
    }

    const userAgent = (req.headers.get("user-agent") || "Navigateur Web").substring(0, 200);

    await supabaseAdmin.from("admin_audit_logs").insert([
      {
        created_at: new Date().toISOString(),
        admin_id: params.adminId || null,
        admin_name: params.adminName || "Administrateur",
        admin_email: params.adminEmail || "admin@sama-academie.sn",
        action: params.action.toUpperCase(),
        target_user_id: params.targetUserId ? String(params.targetUserId) : null,
        target_name: params.targetName || "Système",
        details: params.details,
        ip_address: ip,
        country: country || "SN",
        city: city || "Dakar",
        user_agent: userAgent,
        status: params.status || "SUCCESS",
      },
    ]);
  } catch (err) {
    // Non-bloquant si la table n'existe pas encore
    console.warn("Audit server log notice:", err);
  }
}
