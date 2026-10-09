import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuthorization } from "@/lib/adminAuthCheck";

// API Administration Sécurisée : Gestion de toutes les demandes d'encadrement (Bypass RLS)
export async function GET(req: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceKey || !url) {
      return NextResponse.json(
        { error: "La clé SUPABASE_SERVICE_ROLE_KEY est absente sur le serveur." },
        { status: 500 }
      );
    }

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // 1. Vérification des droits administrateur (Session JWT ou Master Passcode)
    const authResult = await checkAdminAuthorization(req, admin);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.reason || "Accès réservé aux administrateurs." }, { status: 403 });
    }

    // 2. Récupération de TOUTES les demandes d'encadrement avec profils élève et enseignant
    let requests: any[] = [];
    const { data: fullReqs, error: joinErr } = await admin
      .from("tutoring_requests")
      .select(`
        *,
        student:profiles!student_id(id, first_name, last_name, phone, email, region, level, avatar_url),
        teacher:profiles!teacher_id(id, first_name, last_name, phone, email, subject, price, avatar_url)
      `)
      .order("created_at", { ascending: false });

    if (!joinErr && fullReqs) {
      requests = fullReqs;
    } else {
      // Fallback simple si jointure échoue
      const { data: simpleReqs } = await admin
        .from("tutoring_requests")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (simpleReqs && simpleReqs.length > 0) {
        // Hydrater manuellement les profils
        const userIds = Array.from(new Set([
          ...simpleReqs.map((r: any) => r.student_id),
          ...simpleReqs.map((r: any) => r.teacher_id),
        ].filter(Boolean)));

        const { data: profs } = await admin
          .from("profiles")
          .select("id, first_name, last_name, phone, email, region, level, subject, price, avatar_url")
          .in("id", userIds);

        const profMap = new Map((profs || []).map((p: any) => [p.id, p]));

        requests = simpleReqs.map((r: any) => ({
          ...r,
          student: profMap.get(r.student_id) || null,
          teacher: profMap.get(r.teacher_id) || null,
        }));
      }
    }

    return NextResponse.json({ ok: true, requests });
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

    const { requestId, updates } = await req.json().catch(() => ({}));
    if (!requestId || !updates) {
      return NextResponse.json({ error: "Identifiant ou modifications manquants." }, { status: 400 });
    }

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // 1. Vérification des droits administrateur
    const authResult = await checkAdminAuthorization(req, admin);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.reason || "Accès réservé aux administrateurs." }, { status: 403 });
    }

    // 2. Mise à jour de la demande
    const { data, error } = await admin
      .from("tutoring_requests")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select(`
        *,
        student:profiles!student_id(id, first_name, last_name, phone, email, region, level, avatar_url),
        teacher:profiles!teacher_id(id, first_name, last_name, phone, email, subject, price, avatar_url)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 3. Traçabilité dans l'audit
    const { recordServerAudit } = await import("@/lib/serverAudit");
    await recordServerAudit(req, admin, {
      adminId: authResult.adminId,
      adminEmail: authResult.adminEmail,
      action: updates.status === "accepted" ? "VALIDATION_CONTRAT" : updates.status === "declined" ? "REJET_DEMANDE" : "MODIF_CONTRAT",
      targetUserId: data?.student_id || requestId,
      targetName: `${data?.student?.first_name || ""} ${data?.student?.last_name || ""}`.trim() || "Demande encadrement",
      details: `Mise à jour demande ID ${requestId} : status=${updates.status || "inchangé"}, prof=${data?.teacher?.first_name || updates.teacher_id || "inchangé"}`,
    });

    return NextResponse.json({ ok: true, request: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur." }, { status: 500 });
  }
}
