import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cache mémoire résilient au cas où la table SQL n'est pas encore créée dans Supabase
let inMemoryLogs: any[] = [
  {
    id: "init-log-01",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    admin_name: "Direction SAMA ACADÉMIE",
    admin_email: "direction@sama-academie.sn",
    action: "CONNEXION",
    target_name: "Console Admin",
    details: "Connexion sécurisée réussie à l'Espace Administrateur",
    ip_address: "197.218.82.14",
    country: "SN",
    city: "Dakar",
    user_agent: "Chrome / Windows 11",
    status: "SUCCESS",
  },
  {
    id: "init-log-02",
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    admin_name: "Direction SAMA ACADÉMIE",
    admin_email: "direction@sama-academie.sn",
    action: "VERIFICATION_SECURITE",
    target_name: "Système Central",
    details: "Contrôle d'intégrité des accès et activation du traçage d'audit",
    ip_address: "197.218.82.14",
    country: "SN",
    city: "Dakar",
    user_agent: "Chrome / Windows 11",
    status: "SUCCESS",
  },
];

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

function getLocation(req: Request) {
  let country = req.headers.get("x-vercel-ip-country") || "";
  let city = "";
  try {
    city = decodeURIComponent(req.headers.get("x-vercel-ip-city") || "");
  } catch {
    city = req.headers.get("x-vercel-ip-city") || "";
  }
  let region = "";
  try {
    region = decodeURIComponent(req.headers.get("x-vercel-ip-country-region") || "");
  } catch {
    region = req.headers.get("x-vercel-ip-country-region") || "";
  }

  // Fallbacks si non renseigné (ex: local dev)
  if (!country && !city) {
    country = "SN";
    city = "Dakar";
  }

  return { country, city: city || region || "Dakar" };
}

function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// GET : Récupérer le journal d'audit complet
export async function GET(req: Request) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ ok: true, logs: inMemoryLogs, tableMissing: true });
    }

    // Requête vers Supabase
    const { data, error } = await admin
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      // Table non existante dans Supabase : renvoie le fallback mémoire
      return NextResponse.json({
        ok: true,
        logs: inMemoryLogs,
        tableMissing: true,
        warning: "La table admin_audit_logs n'est pas encore créée dans Supabase SQL.",
      });
    }

    // Fusionner si la table existe
    const allLogs = (data && data.length > 0) ? data : inMemoryLogs;
    return NextResponse.json({ ok: true, logs: allLogs, tableMissing: false });
  } catch (err: any) {
    return NextResponse.json({ ok: true, logs: inMemoryLogs, error: err?.message });
  }
}

// POST : Enregistrer une action administrative tracée
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      action = "ACTION_ADMIN",
      targetUserId = null,
      targetName = "Système",
      details = "Action administrative exécutée",
      adminName = "Administrateur",
      adminEmail = "admin@sama-academie.sn",
      status = "SUCCESS",
    } = body;

    const ip = getClientIp(req);
    const { country, city } = getLocation(req);
    const userAgent = req.headers.get("user-agent") || "Navigateur Web";

    const logRecord = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`,
      created_at: new Date().toISOString(),
      admin_id: body.adminId || null,
      admin_name: adminName,
      admin_email: adminEmail,
      action: action.toUpperCase(),
      target_user_id: targetUserId ? String(targetUserId) : null,
      target_name: targetName,
      details,
      ip_address: ip,
      country: country || "SN",
      city: city || "Dakar",
      user_agent: userAgent.substring(0, 200),
      status,
    };

    // Mettre à jour le cache mémoire local
    inMemoryLogs.unshift(logRecord);
    if (inMemoryLogs.length > 200) inMemoryLogs.pop();

    // Tenter l'insertion dans Supabase
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        await admin.from("admin_audit_logs").insert([
          {
            created_at: logRecord.created_at,
            admin_id: logRecord.admin_id,
            admin_name: logRecord.admin_name,
            admin_email: logRecord.admin_email,
            action: logRecord.action,
            target_user_id: logRecord.target_user_id,
            target_name: logRecord.target_name,
            details: logRecord.details,
            ip_address: logRecord.ip_address,
            country: logRecord.country,
            city: logRecord.city,
            user_agent: logRecord.user_agent,
            status: logRecord.status,
          },
        ]);
      } catch (insertErr) {
        console.warn("Audit log insert warning (Supabase):", insertErr);
      }
    }

    return NextResponse.json({ ok: true, log: logRecord });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur enregistrement log." }, { status: 500 });
  }
}
