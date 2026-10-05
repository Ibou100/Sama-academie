"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) {
        if (err.message.toLowerCase().includes("rate") || err.status === 429) {
          setError("Trop de demandes. Patientez quelques minutes avant de réessayer.");
        } else {
          setError("Impossible d'envoyer l'email pour le moment. Réessayez dans quelques instants.");
        }
      } else {
        // Message identique que le compte existe ou non (pas de fuite d'information)
        setSent(true);
      }
    } catch {
      setError("Problème de connexion. Vérifiez votre réseau et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 bg-blue-100 text-sama-primary rounded-full flex items-center justify-center mx-auto text-2xl mb-3">
            <i className="fas fa-key"></i>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Mot de passe oublié ?</h2>
          <p className="mt-2 text-sm text-gray-500">
            Valable pour les comptes Élève, Parent et Enseignant. Entrez l&apos;email de votre compte, nous vous envoyons un lien pour choisir un nouveau mot de passe.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="bg-green-50 border border-green-200 text-green-800 text-sm p-4 rounded-xl">
              Si un compte existe avec <strong>{email}</strong>, un email contenant le lien de réinitialisation vient d&apos;être envoyé. Pensez à vérifier vos courriers indésirables (spam).
            </div>
            <Link href="/login" className="block w-full bg-sama-primary text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl text-center">{error}</div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Adresse Email</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@sama.sn"
                  className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full bg-sama-primary text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition disabled:opacity-60"
              >
                {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="font-semibold text-sama-primary hover:underline">Retour à la connexion</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
