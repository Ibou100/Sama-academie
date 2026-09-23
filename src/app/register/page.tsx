"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const SENEGAL_REGIONS = [
  "Dakar", "Thiès", "Saint-Louis", "Diourbel", 
  "Ziguinchor", "Kaolack", "Louga", "Fatick", 
  "Kolda", "Matam", "Kaffrine", "Kédougou", 
  "Sédhiou", "Tambacounda"
];

const SUBJECTS = [
  "Mathématiques", "SVT", "Physique-Chimie", 
  "Français", "Anglais", "Philosophie", "Histoire-Géographie"
];

export default function Register() {
  const [role, setRole] = useState("eleve");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("Dakar");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Spécifique
  const [level, setLevel] = useState("Collège (6e à 3e)");
  const [subject, setSubject] = useState("Mathématiques");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (!phone) {
      setError("Le numéro de téléphone est obligatoire.");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
          email: email, // NOUVEAU : Sauvegarde de l'email pour les notifications
          phone: phone,
          region: region,
          level: role === "eleve" ? level : null,
          subject: role === "enseignant" ? subject : null,
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">
            <i className="fas fa-check"></i>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Inscription réussie !</h2>
          <p className="text-gray-500">
            Votre compte a bien été créé. Vous pouvez maintenant vous connecter.
          </p>
          <Link href="/login" className="block w-full bg-sama-primary text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition">
            Aller à la connexion
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">

        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Rejoignez-nous</h2>
          <p className="mt-2 text-sm text-gray-500">Créez votre compte SAMA ACADÉMIE</p>
        </div>

        {/* Sélecteur de rôle */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {["eleve", "enseignant", "parent"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition capitalize ${
                role === r ? "bg-white text-sama-primary shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {r === "eleve" ? "Élève" : r === "enseignant" ? "Enseignant" : "Parent"}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleRegister}>
          {/* Prénom / Nom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Prénom</label>
              <input
                type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nom</label>
              <input
                type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
              />
            </div>
          </div>

          {/* Email / Téléphone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Téléphone (WhatsApp)</label>
              <input
                type="tel" required placeholder="+221..." value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
              />
            </div>
          </div>

          {/* Région */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Région de résidence</label>
            <select
              value={region} onChange={(e) => setRegion(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
            >
              {SENEGAL_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Niveau (Élève) */}
          {role === "eleve" && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Niveau scolaire</label>
              <select
                value={level} onChange={(e) => setLevel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
              >
                <option>Primaire</option>
                <option>Collège (6e à 3e)</option>
                <option>Lycée (Seconde à Terminale)</option>
                <option>Université</option>
              </select>
            </div>
          )}

          {/* Matière (Enseignant) */}
          {role === "enseignant" && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Matière enseignée</label>
              <select
                value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
              >
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Mots de passe */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 pr-11 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Confirmer</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full border rounded-lg p-3 pr-11 bg-gray-50 outline-none focus:bg-white transition ${
                    confirmPassword && confirmPassword !== password ? "border-red-400 focus:border-red-400" : confirmPassword && confirmPassword === password ? "border-green-400 focus:border-green-400" : "border-gray-300 focus:border-sama-primary"
                  }`}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-sama-primary hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl transition shadow-sm mt-4 flex justify-center items-center gap-2"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : "Créer mon compte"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ? <Link href="/login" className="font-bold text-sama-primary hover:underline">Connectez-vous</Link>
        </div>
      </div>
    </main>
  );
}
