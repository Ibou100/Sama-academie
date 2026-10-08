"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { safeRedirect } from "@/lib/auth-helpers";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <Login />
    </Suspense>
  );
}

function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectMessage = searchParams.get("message");
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      const msg = signInError.message || "";
      if (msg.toLowerCase().includes("email not confirmed")) {
        setError("Votre adresse email n'a pas encore été confirmée. Veuillez vérifier votre boîte mail ou contacter l'administration.");
      } else {
        setError("Email ou mot de passe incorrect.");
      }
      setLoading(false);
      return;
    }

    const userRole = (signInData?.user?.user_metadata?.role as string) || "eleve";

    // Détermination immédiate de l'URL de destination
    let destination = redirectTo;
    if (userRole === "enseignant") {
      destination = "/dashboard/enseignant";
    } else if (userRole === "parent") {
      destination = "/dashboard/parent";
    } else if (userRole === "admin") {
      destination = "/admin";
    } else if (destination === "/dashboard" || destination.startsWith("/dashboard")) {
      destination = "/dashboard/eleve";
    }

    // Auto-synchronisation asynchrone en arrière-plan sans bloquer la navigation de l'utilisateur
    if (signInData?.user) {
      void (async () => {
        try {
          const meta = signInData.user.user_metadata || {};
          const { data: p } = await supabase
            .from("profiles")
            .select("role, experience, price, bio, level, subject")
            .eq("id", signInData.user.id)
            .maybeSingle();

          if (p && (!p.experience || !p.price || !p.bio || !p.level || !p.subject)) {
            const updates: Record<string, any> = {};
            if (!p.experience && meta.experience) updates.experience = meta.experience;
            if (!p.price && meta.price) updates.price = meta.price;
            if (!p.bio && meta.bio) updates.bio = meta.bio;
            if (!p.level && meta.level) updates.level = meta.level;
            if (!p.subject && meta.subject) updates.subject = meta.subject;

            if (Object.keys(updates).length > 0) {
              await supabase.from("profiles").update(updates).eq("id", signInData.user.id);
            }
          }
        } catch (_) {}
      })();
    }

    safeRedirect(destination, router);
  };

  return (
    <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
        
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Bon retour !</h2>
          <p className="mt-2 text-sm text-gray-500">Connectez-vous à votre espace SAMA ACADÉMIE</p>
        </div>

        {/* Message de redirection */}
        {redirectMessage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm p-3 rounded-lg text-center flex items-center gap-2 justify-center">
            <i className="fas fa-lock text-xs"></i> {redirectMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Adresse Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition" 
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-bold text-gray-700">Mot de passe</label>
              <Link href="/forgot-password" className="text-xs font-semibold text-sama-primary hover:underline">Mot de passe oublié ?</Link>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 pr-11 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
              >
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-sama-primary hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl transition shadow-sm mt-4 flex justify-center items-center gap-2"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : "Se connecter"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-6">
          Pas encore de compte ? <Link href="/register" className="font-bold text-sama-primary hover:underline">Inscrivez-vous</Link>
        </div>
      </div>
    </main>
  );
}
