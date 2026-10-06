import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Réinitialisation du mot de passe par un ADMIN (utile quand l'utilisateur n'a pas d'email valide).
// Nécessite la variable d'environnement serveur SUPABASE_SERVICE_ROLE_KEY (jamais exposée au navigateur).
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

    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const { userId, newPassword } = await req.json();
    if (!userId || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json({ error: "Mot de passe invalide (6 caractères minimum)." }, { status: 400 });
    }

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // 1. Qui appelle ?
    const { data: caller, error: callerErr } = await admin.auth.getUser(token);
    if (callerErr || !caller?.user) return NextResponse.json({ error: "Session invalide." }, { status: 401 });

    // 2. L'appelant doit être administrateur
    const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", caller.user.id).maybeSingle();
    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
    }

    // 3. Mise à jour du mot de passe
    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Traçabilité serveur : audit de l'action
    const { data: targetProfile } = await admin.from("profiles").select("first_name, last_name, email").eq("id", userId).maybeSingle();
    const targetName = targetProfile ? `${targetProfile.first_name} ${targetProfile.last_name}` : userId;

    const { recordServerAudit } = await import("@/lib/serverAudit");
    await recordServerAudit(req, admin, {
      adminId: caller.user.id,
      adminEmail: caller.user.email,
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
