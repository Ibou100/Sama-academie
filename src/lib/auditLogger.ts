import { supabase } from "./supabase";

export interface LogActionParams {
  action: string;
  targetUserId?: string;
  targetName?: string;
  details: string;
  adminName?: string;
  adminEmail?: string;
  adminId?: string;
  status?: "SUCCESS" | "FAILED" | "WARNING";
}

/**
 * Enregistre une action administrative dans le journal d'audit
 * Non-bloquant : ne bloque jamais l'interface utilisateur.
 */
export async function logAdminAction(params: LogActionParams): Promise<void> {
  try {
    // Récupérer les infos de l'admin actuellement connecté si non fournies
    let adminName = params.adminName;
    let adminEmail = params.adminEmail;
    let adminId = params.adminId;

    if (!adminEmail) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          adminEmail = user.email || "admin@sama-academie.sn";
          adminId = user.id;
          const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("id", user.id).maybeSingle();
          if (profile) {
            adminName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || adminEmail;
          }
        }
      } catch (_) {}
    }

    if (!adminName) adminName = adminEmail || "Administrateur Direction";
    if (!adminEmail) adminEmail = "admin@sama-academie.sn";

    // Appel à l'API backend pour enregistrer les métadonnées réseau (IP, géolocalisation, user-agent)
    fetch("/api/admin/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: params.action,
        targetUserId: params.targetUserId,
        targetName: params.targetName || "Système",
        details: params.details,
        adminName,
        adminEmail,
        adminId,
        status: params.status || "SUCCESS",
      }),
    }).catch((err) => {
      console.warn("Échec silencieux log audit:", err);
    });
  } catch (err) {
    console.warn("Échec log audit:", err);
  }
}
