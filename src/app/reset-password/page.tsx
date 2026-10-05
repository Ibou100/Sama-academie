"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Le lien de l'email crée une session de récupération (événement PASSWORD_RECOVERY)
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
        setChecked(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const t = setTimeout(() => setChecked(true), 2500);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message.toLowerCase().includes("different")
          ? "Le nouveau mot de passe doit être différent de l'ancien."
          : "Impossible de modifier le mot de passe. Le lien a peut-être expiré, refaites une demande.");
      } else {
        await supabase.auth.signOut();
        setDone(true);
      }
    } catch {
      setError("Problème de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-900">Nouveau mot de passe</h2>
        </div>

        {done ? (
          <div className="space-y-4 text-center">
            <div className="bg-green-50 border border-green-200 text-green-800 text-sm p-4 rounded-xl">
              Votre mot de passe a été modifié avec succès. Vous pouvez vous connecter.
            </div>
            <Link href="/login" className="block w-full bg-sama-primary text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition">
              Me connecter
            </Link>
          </div>
        ) : !ready ? (
          checked ? (
            <div className="space-y-4 text-center">
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl">
                Ce lien est invalide ou a expiré. Veuillez refaire une demande de réinitialisation.
              </div>
              <Link href="/forgot-password" className="block w-full bg-sama-primary text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition">
                Refaire une demande
              </Link>
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500">Vérification du lien...</p>
          )
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl text-center">{error}</div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 pr-11 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                  />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                    <i className={`fas ${show ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Confirmer le mot de passe</label>
                <input
                  type={show ? "text" : "password"} required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full bg-sama-primary text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition disabled:opacity-60"
              >
                {loading ? "Enregistrement..." : "Enregistrer le nouveau mot de passe"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
