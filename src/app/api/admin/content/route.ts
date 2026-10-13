import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuthorization } from "@/lib/adminAuthCheck";

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

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authResult = await checkAdminAuthorization(req, admin);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.reason || "Accès refusé." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    // Nettoyage de tous les enregistrements de test temporaires
    if (body.cleanupTests) {
      await admin.from("annales").delete().ilike("title", "%probe%");
      await admin.from("annales").delete().ilike("title", "%test%");
      await admin.from("videos").delete().ilike("title", "%probe%");
      await admin.from("videos").delete().ilike("title", "%test%");

      return NextResponse.json({ ok: true, message: "Enregistrements de test supprimés avec succès." });
    }

    // Suppression d'un élément spécifique par ID
    const { table, id } = body;
    if (!table || !id || (table !== "videos" && table !== "annales")) {
      return NextResponse.json({ error: "Table ou identifiant invalide." }, { status: 400 });
    }

    const { error } = await admin.from(table).delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}
