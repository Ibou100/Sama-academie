import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// API Administration Sécurisée : Gestion avancée des utilisateurs
// Permet la modification de rôle, de statut, et la suppression définitive.
export async function DELETE(req: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceKey || !url) {
      return NextResponse.json(
        { error: "La clé SUPABASE_SERVICE_ROLE_KEY est absente sur le serveur." },
        { status: 500 }
      );
    }

    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Identifiant utilisateur manquant." }, { status: 400 });

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // 1. Vérification des droits administrateur de l'appelant
    const { data: caller, error: callerErr } = await admin.auth.getUser(token);
    if (callerErr || !caller?.user) return NextResponse.json({ error: "Session invalide." }, { status: 401 });

    const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", caller.user.id).maybeSingle();
    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
    }

    // Protection : L'admin ne peut pas se supprimer lui-même
    if (caller.user.id === userId) {
      return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte administrateur." }, { status: 400 });
    }

    // 2. Nettoyage des données associées
    try {
      await admin.from("tutoring_messages").delete().eq("sender_id", userId);
      await admin.from("tutoring_requests").delete().or(`student_id.eq.${userId},teacher_id.eq.${userId}`);
      await admin.from("virtual_classes").delete().eq("teacher_id", userId);
      await admin.from("meeting_messages").delete().eq("user_id", userId);
    } catch (_) {}

    // 3. Suppression dans profiles
    await admin.from("profiles").delete().eq("id", userId);

    // 4. Suppression définitive dans Supabase Auth
    const { error: authDeleteErr } = await admin.auth.admin.deleteUser(userId);
    if (authDeleteErr) {
      console.warn("Auth delete warning:", authDeleteErr.message);
    }

    // Traçabilité serveur
    const { recordServerAudit } = await import("@/lib/serverAudit");
    await recordServerAudit(req, admin, {
      adminId: caller.user.id,
      adminEmail: caller.user.email,
      action: "SUPPRESSION_UTILISATEUR",
      targetUserId: userId,
      details: `Suppression définitive du compte utilisateur (ID: ${userId}) par ${caller.user.email}`,
    });

    return NextResponse.json({ ok: true, message: "Utilisateur supprimé avec succès." });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceKey || !url) {
      return NextResponse.json(
        { error: "La clé SUPABASE_SERVICE_ROLE_KEY est absente sur le serveur." },
        { status: 500 }
      );
    }

    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const { userId, updates } = await req.json();
    if (!userId || !updates) return NextResponse.json({ error: "Données incomplètes." }, { status: 400 });

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // Vérification des droits administrateur
    const { data: caller, error: callerErr } = await admin.auth.getUser(token);
    if (callerErr || !caller?.user) return NextResponse.json({ error: "Session invalide." }, { status: 401 });

    const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", caller.user.id).maybeSingle();
    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
    }

    // Mise à jour du profil
    const { error: updateErr } = await admin.from("profiles").update(updates).eq("id", userId);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

    // Synchronisation métadonnées auth si le rôle a changé
    if (updates.role) {
      try {
        await admin.auth.admin.updateUserById(userId, {
          user_metadata: { role: updates.role }
        });
      } catch (_) {}
    }

    // Traçabilité serveur
    const { recordServerAudit } = await import("@/lib/serverAudit");
    const summaryUpdates = Object.entries(updates).map(([k, v]) => `${k}: ${v}`).join(", ");
    await recordServerAudit(req, admin, {
      adminId: caller.user.id,
      adminEmail: caller.user.email,
      action: updates.role ? "MODIF_ROLE_UTILISATEUR" : "MODIF_PROFIL_UTILISATEUR",
      targetUserId: userId,
      details: `Modification utilisateur ID ${userId} : ${summaryUpdates}`,
    });

    return NextResponse.json({ ok: true, message: "Utilisateur mis à jour avec succès." });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur." }, { status: 500 });
  }
}
