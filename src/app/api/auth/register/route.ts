import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inscription publique sécurisée et immédiate
// Active automatiquement le compte (email_confirm: true) pour éviter le blocage d'email
// et enregistre l'intégralité des informations pédagogiques dans public.profiles.
export async function POST(req: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceKey || !url) {
      return NextResponse.json(
        { error: "Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY manquante)." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      email,
      password,
      first_name,
      last_name,
      role = "eleve",
      phone = "",
      region = "Dakar",
      level = "",
      subject = null,
      experience = null,
      price = null,
      bio = null,
      verified = false,
    } = body;

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: "Prénom, nom, email et mot de passe sont obligatoires." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Création du compte dans Supabase Auth avec email auto-confirmé
    const isTeacher = role === "enseignant";
    const initialVerified = isTeacher ? false : true;

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
        subject: isTeacher ? subject : null,
        experience: isTeacher ? experience : null,
        price: isTeacher ? price : null,
        bio: bio || null,
        verified: initialVerified,
      },
    });

    if (authErr) {
      const msg = authErr.message || "";
      if (
        msg.toLowerCase().includes("already registered") ||
        msg.toLowerCase().includes("already in use") ||
        msg.toLowerCase().includes("user already exists")
      ) {
        return NextResponse.json(
          { error: "Cette adresse email est déjà enregistrée. Veuillez vous connecter." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: authErr.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Enregistrement direct et complet dans la table public.profiles
    const profilePayload = {
      id: userId,
      email: normalizedEmail,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      role,
      phone: phone.trim(),
      region,
      level,
      subject: isTeacher ? subject : null,
      experience: isTeacher ? experience : null,
      price: isTeacher ? price : null,
      bio: bio || null,
      verified: initialVerified,
    };

    const { error: profileErr } = await admin.from("profiles").upsert(profilePayload);
    if (profileErr) {
      console.warn("Erreur upsert profile register:", profileErr.message);
    }

    return NextResponse.json({
      ok: true,
      user: profilePayload,
      message: isTeacher
        ? "Dossier enseignant enregistré avec succès. En attente de validation administrative."
        : "Compte créé avec succès !",
    });
  } catch (err: any) {
    console.error("Register API error:", err);
    return NextResponse.json({ error: err?.message || "Erreur serveur." }, { status: 500 });
  }
}
