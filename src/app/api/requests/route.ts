import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Endpoint pour soumettre une demande d'encadrement en toute fiabilité (Bypass RLS sur l'insert)
export async function POST(req: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceKey || !url) {
      return NextResponse.json(
        { error: "Configuration serveur incomplète." },
        { status: 500 }
      );
    }

    const payload = await req.json().catch(() => ({}));
    const { studentId, teacherId, message } = payload;

    if (!studentId || !teacherId) {
      return NextResponse.json(
        { error: "Identifiant élève et enseignant requis." },
        { status: 400 }
      );
    }

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // Contrôle d'autorisation : si un token est fourni, s'assurer que l'expéditeur est bien studentId (ou admin)
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (token) {
      try {
        const { data: userCaller } = await admin.auth.getUser(token);
        if (userCaller?.user && userCaller.user.id !== studentId) {
          const { data: p } = await admin.from("profiles").select("role").eq("id", userCaller.user.id).maybeSingle();
          if (p?.role !== "admin") {
            return NextResponse.json({ error: "Action non autorisée au nom d'un autre profil." }, { status: 403 });
          }
        }
      } catch (_) {}
    }

    // Insertion directe et garantie dans tutoring_requests
    const { data, error } = await admin
      .from("tutoring_requests")
      .insert([
        {
          student_id: studentId,
          teacher_id: teacherId,
          message: message ? message.trim() : null,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, request: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur." }, { status: 500 });
  }
}
