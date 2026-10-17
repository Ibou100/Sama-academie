import { SupabaseClient } from "@supabase/supabase-js";

export interface AdminAuthResult {
  authorized: boolean;
  adminId?: string;
  adminEmail?: string;
  adminName?: string;
  reason?: string;
}

/**
 * Vérifie l'autorisation d'un appel API d'administration :
 * 1. Soit via le Master Passcode (ex: sama2026 envoyé dans 'x-admin-passcode')
 * 2. Soit via un jeton de session Supabase officiel d'un utilisateur ayant role === 'admin'
 */
export async function checkAdminAuthorization(
  req: Request,
  adminClient: SupabaseClient
): Promise<AdminAuthResult> {
  // 1. Vérification par Passcode Master Direction (stricte et sans faille)
  const passcode = req.headers.get("x-admin-passcode");
  const envMasterCode = process.env.ADMIN_MASTER_PASSCODE;
  const validPasscodes = ["sama2026"];
  if (envMasterCode) validPasscodes.push(envMasterCode);

  if (passcode && validPasscodes.includes(passcode.trim())) {
    return {
      authorized: true,
      adminId: "master-direction",
      adminEmail: "direction@sama-academie.sn",
      adminName: "Direction Générale",
    };
  }

  // 2. Vérification par jeton JWT Supabase
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (token) {
    try {
      const { data: caller, error } = await adminClient.auth.getUser(token);
      if (!error && caller?.user) {
        const { data: profile } = await adminClient
          .from("profiles")
          .select("first_name, last_name, role")
          .eq("id", caller.user.id)
          .maybeSingle();

        if (profile?.role === "admin") {
          return {
            authorized: true,
            adminId: caller.user.id,
            adminEmail: caller.user.email || "admin@sama-academie.sn",
            adminName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || caller.user.email || "Admin",
          };
        }
      }
    } catch (_) {}
  }

  return {
    authorized: false,
    reason: "Session non autorisée. Veuillez vous connecter avec un compte admin ou renseigner le code secret.",
  };
}
