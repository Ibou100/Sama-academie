"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getClientSessionAndRole, safeRedirect } from "@/lib/auth-helpers";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkRoleAndRedirect = async () => {
      try {
        const { user, role } = await getClientSessionAndRole(3000);

        if (!isMounted) return;

        if (!user) {
          safeRedirect("/login", router);
          return;
        }

        if (role === "enseignant") {
          safeRedirect("/dashboard/enseignant", router);
        } else if (role === "parent") {
          safeRedirect("/dashboard/parent", router);
        } else if (role === "admin") {
          safeRedirect("/admin", router);
        } else {
          safeRedirect("/dashboard/eleve", router);
        }
      } catch (err) {
        console.error("Dashboard redirect error:", err);
        if (isMounted) safeRedirect("/login", router);
      }
    };

    checkRoleAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <main className="flex-grow flex flex-col items-center justify-center py-24">
      <div className="w-12 h-12 border-4 border-sama-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-medium text-sm">Chargement de votre espace personnel SAMA ACADÉMIE...</p>
    </main>
  );
}
