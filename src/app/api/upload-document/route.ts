import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    // Limite de taille : 25 Mo
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Le document est trop volumineux. La taille maximale autorisée est de 25 Mo." },
        { status: 400 }
      );
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Configuration serveur Supabase manquante." }, { status: 500 });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const originalName = file.name || "document";
    const fileExt = originalName.split(".").pop()?.toLowerCase() || "pdf";
    const cleanBaseName = originalName
      .replace(/\.[^/.]+$/, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 40);

    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${cleanBaseName}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    let publicUrl = "";
    let uploadSuccess = false;

    // 1. Tenter d'assurer l'existence du bucket 'course_documents' si clé admin
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await supabase.storage.createBucket("course_documents", {
          public: true,
          fileSizeLimit: 26214400,
        });
      } catch {
        // Ignorer si déjà existant
      }
    }

    // 2. Tenter le téléversement dans les buckets configurés
    const candidateBuckets = ["course_documents", "annales_pdf", "avatars"];
    for (const bucket of candidateBuckets) {
      try {
        const { error } = await supabase.storage
          .from(bucket)
          .upload(uniqueFileName, buffer, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          });

        if (!error) {
          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uniqueFileName);
          if (urlData?.publicUrl) {
            publicUrl = urlData.publicUrl;
            uploadSuccess = true;
            break;
          }
        }
      } catch {
        // Continuer vers le bucket suivant
      }
    }

    // 3. Fallback de résilience : si aucun bucket Storage n'a répondu
    // (ex: permissions strictes sans bucket créé), et si le fichier est <= 3.8 Mo,
    // on renvoie un Data URI standard et immédiatement ouvrable par le navigateur.
    if (!uploadSuccess) {
      if (buffer.length <= 3.8 * 1024 * 1024) {
        const mime = file.type || "application/pdf";
        const base64 = buffer.toString("base64");
        publicUrl = `data:${mime};base64,${base64}`;
        uploadSuccess = true;
      } else {
        return NextResponse.json(
          {
            error:
              "Impossible de stocker le fichier dans Supabase Storage. Veuillez exécuter le script SQL de configuration du bucket ou réduire la taille du fichier sous 3.5 Mo.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      fileUrl: publicUrl,
      fileName: originalName,
      fileSize: file.size,
      fileType: file.type || fileExt,
    });
  } catch (err: any) {
    console.error("Erreur api/upload-document:", err);
    return NextResponse.json(
      { error: err?.message || "Erreur interne lors du téléversement du document." },
      { status: 500 }
    );
  }
}
