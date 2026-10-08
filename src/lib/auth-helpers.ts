import { supabase } from "@/lib/supabase";

export interface SafeAuthResult {
  user: any | null;
  role: "enseignant" | "eleve" | "parent" | "admin" | null;
  profile: any | null;
}

/**
 * Récupère instantanément la session et le rôle de l'utilisateur.
 * Conçu pour éliminer définitivement les chargements infinis :
 * - Lecture directe de la session locale (localStorage/cookies, quasi-instantanée).
 * - Timeout strict sur la requête de profil pour ne jamais bloquer l'UI.
 * - Réconciliation automatique entre public.profiles et user_metadata.
 */
export async function getClientSessionAndRole(timeoutMs = 3000): Promise<SafeAuthResult> {
  try {
    // 1. Session locale immédiate depuis la mémoire/localStorage
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user || null;

    if (!user) {
      return { user: null, role: null, profile: null };
    }

    // 2. Requête du profil avec timeout de sécurité
    const profilePromise = supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error("Profile timeout") }), timeoutMs)
    );

    const { data: profile } = await Promise.race([profilePromise, timeoutPromise]);

    const role =
      (profile?.role as "enseignant" | "eleve" | "parent" | "admin") ||
      (user.user_metadata?.role as "enseignant" | "eleve" | "parent" | "admin") ||
      "eleve";

    return { user, role, profile };
  } catch (err) {
    console.warn("getClientSessionAndRole warning:", err);
    return { user: null, role: null, profile: null };
  }
}

/**
 * Redirection sécurisée et immédiate.
 * Privilégie un remplacement d'URL dur (window.location.replace)
 * pour éviter les transitions client bloquées par le routeur Next.js.
 */
export function safeRedirect(targetUrl: string, router?: any) {
  if (typeof window !== "undefined") {
    window.location.replace(targetUrl);
  } else if (router && typeof router.replace === "function") {
    router.replace(targetUrl);
  }
}
