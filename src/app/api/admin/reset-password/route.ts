import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuthorization } from "@/lib/adminAuthCheck";

// Réinitialisation du mot de passe par un ADMIN
// Accepte soit une session Supabase active ayant role=admin, soit le Master Passcode direction.
export async function POST(req: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceKey || !url) {
      return NextResponse.json(
        { error: "Fonction non configurée : la clé SUPABASE_SERVICE_ROLE_KEY est absente sur le serveur." },
        { status: 500 }
      );
    }

    const { userId, newPassword } = await req.json().catch(() => ({}));
    if (!userId || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json({ error: "Mot de passe invalide (6 caractères minimum)." }, { status: 400 });
    }

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // 1. Vérification des autorisations admin
    const authResult = await checkAdminAuthorization(req, admin);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.reason || "Accès réservé aux administrateurs." }, { status: 403 });
    }

    // 2. Mise à jour du mot de passe dans Supabase Auth
    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // 3. Traçabilité serveur : audit de l'action
    const { data: targetProfile } = await admin.from("profiles").select("first_name, last_name, email").eq("id", userId).maybeSingle();
    const targetName = targetProfile ? `${targetProfile.first_name} ${targetProfile.last_name}` : userId;

    const { recordServerAudit } = await import("@/lib/serverAudit");
    await recordServerAudit(req, admin, {
      adminId: authResult.adminId,
      adminEmail: authResult.adminEmail,
      action: "RESET_MOT_DE_PASSE",
      targetUserId: userId,
      targetName: targetName || "Utilisateur",
      details: `Réinitialisation forcée du mot de passe pour ${targetName} (${targetProfile?.email || "sans email"})`,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur." }, { status: 500 });
  }
}
