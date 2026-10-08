import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuthorization } from "@/lib/adminAuthCheck";

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

    const { userId } = await req.json().catch(() => ({}));
    if (!userId) return NextResponse.json({ error: "Identifiant utilisateur manquant." }, { status: 400 });

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // 1. Vérification des droits administrateur (Session ou Passcode)
    const authResult = await checkAdminAuthorization(req, admin);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.reason || "Accès réservé aux administrateurs." }, { status: 403 });
    }

    // Protection : L'admin ne peut pas se supprimer lui-même
    if (authResult.adminId === userId) {
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
      adminId: authResult.adminId,
      adminEmail: authResult.adminEmail,
      action: "SUPPRESSION_UTILISATEUR",
      targetUserId: userId,
      details: `Suppression définitive du compte utilisateur (ID: ${userId}) par ${authResult.adminEmail}`,
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

    const { userId, updates } = await req.json().catch(() => ({}));
    if (!userId || !updates) return NextResponse.json({ error: "Données incomplètes." }, { status: 400 });

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // Vérification des droits administrateur (Session ou Passcode)
    const authResult = await checkAdminAuthorization(req, admin);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.reason || "Accès réservé aux administrateurs." }, { status: 403 });
    }

    // Mise à jour du profil dans public.profiles
    const { error: updateErr } = await admin.from("profiles").update(updates).eq("id", userId);
    if (updateErr) {
      if (updateErr.message.includes("profiles_role_check")) {
        return NextResponse.json(
          {
            error: "La base de données Supabase limite les rôles aux profils classiques (eleve, parent, enseignant). Exécutez le script SQL 'ALTER TABLE profiles DROP CONSTRAINT profiles_role_check' dans Supabase pour autoriser 'admin'.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // Synchronisation métadonnées auth (rôle, vérification, matières...)
    try {
      const metaUpdates: Record<string, any> = {};
      if (typeof updates.role !== "undefined") metaUpdates.role = updates.role;
      if (typeof updates.verified !== "undefined") metaUpdates.verified = updates.verified;
      if (typeof updates.subject !== "undefined") metaUpdates.subject = updates.subject;
      if (typeof updates.level !== "undefined") metaUpdates.level = updates.level;
      if (typeof updates.price !== "undefined") metaUpdates.price = updates.price;
      if (typeof updates.experience !== "undefined") metaUpdates.experience = updates.experience;
      if (typeof updates.phone !== "undefined") metaUpdates.phone = updates.phone;
      if (typeof updates.region !== "undefined") metaUpdates.region = updates.region;

      if (Object.keys(metaUpdates).length > 0) {
        await admin.auth.admin.updateUserById(userId, {
          user_metadata: metaUpdates,
        });
      }
    } catch (_) {}

    // Traçabilité serveur
    const { recordServerAudit } = await import("@/lib/serverAudit");
    const summaryUpdates = Object.entries(updates).map(([k, v]) => `${k}: ${v}`).join(", ");
    await recordServerAudit(req, admin, {
      adminId: authResult.adminId,
      adminEmail: authResult.adminEmail,
      action: updates.role ? "MODIF_ROLE_UTILISATEUR" : "MODIF_PROFIL_UTILISATEUR",
      targetUserId: userId,
      details: `Modification utilisateur ID ${userId} : ${summaryUpdates}`,
    });

    return NextResponse.json({ ok: true, message: "Utilisateur mis à jour avec succès." });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceKey || !url) {
      return NextResponse.json(
        { error: "La clé SUPABASE_SERVICE_ROLE_KEY est absente sur le serveur." },
        { status: 500 }
      );
    }

    const payload = await req.json().catch(() => ({}));
    const {
      email,
      password,
      first_name,
      last_name,
      role = "enseignant",
      phone = "",
      region = "Dakar",
      level = "",
      subject = "",
      experience = "",
      price = "",
      bio = "",
      verified = true,
    } = payload;

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: "Veuillez renseigner le prénom, le nom, l'email et le mot de passe." },
        { status: 400 }
      );
    }

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // 1. Vérification des droits administrateur (Session ou Passcode)
    const authResult = await checkAdminAuthorization(req, admin);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.reason || "Accès réservé aux administrateurs." }, { status: 403 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Création de l'utilisateur dans Supabase Auth avec email_confirm: true (immédiatement actif)
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        role,
        phone: phone.trim(),
        region,
        level,
        subject: role === "enseignant" ? subject : null,
        experience: role === "enseignant" ? experience : null,
        price: role === "enseignant" ? price : null,
        bio: bio.trim(),
        verified: !!verified,
      },
    });

    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 3. Upsert direct dans public.profiles avec toutes les métadonnées
    const profilePayload = {
      id: userId,
      email: normalizedEmail,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      role,
      phone: phone.trim(),
      region,
      level: level || null,
      subject: role === "enseignant" ? (subject || null) : null,
      experience: role === "enseignant" ? (experience || null) : null,
      price: role === "enseignant" ? (price || null) : null,
      bio: bio.trim() || null,
      verified: !!verified,
    };

    const { error: profileErr } = await admin.from("profiles").upsert(profilePayload);
    if (profileErr) {
      console.warn("Profile upsert warning:", profileErr.message);
    }

    // Traçabilité serveur
    const { recordServerAudit } = await import("@/lib/serverAudit");
    await recordServerAudit(req, admin, {
      adminId: authResult.adminId,
      adminEmail: authResult.adminEmail,
      action: "CREATION_UTILISATEUR_ADMIN",
      targetUserId: userId,
      details: `Création du compte ${role} (${normalizedEmail}) par ${authResult.adminEmail}`,
    });

    return NextResponse.json({
      ok: true,
      user: profilePayload,
      message: `Compte ${role} créé avec succès et immédiatement activé !`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur." }, { status: 500 });
  }
}

