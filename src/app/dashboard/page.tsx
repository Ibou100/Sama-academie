"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login?redirect=/dashboard");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const role = profile?.role || user.user_metadata?.role;

        if (role === "enseignant") {
          router.replace("/dashboard/enseignant");
        } else if (role === "parent") {
          router.replace("/dashboard/parent");
        } else if (role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/dashboard/eleve");
        }
      } catch (err) {
        console.error("Dashboard redirect error:", err);
        router.replace("/login");
      }
    };

    checkRoleAndRedirect();
  }, [router]);

  return (
    <main className="flex-grow flex flex-col items-center justify-center py-24">
      <div className="w-12 h-12 border-4 border-sama-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-medium text-sm">Chargement de votre espace personnel SAMA ACADÉMIE...</p>
    </main>
  );
}
