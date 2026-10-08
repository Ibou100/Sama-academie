"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  is_premium: boolean;
  avatar_url: string | null;
  level: string | null;
  phone: string | null;
  region: string | null;
  quarter: string | null;
  subject: string | null;
  experience: string | null;
  price: string | null;
  bio: string | null;
  verified?: boolean;
};

const SENEGAL_REGIONS = [
  "Dakar", "Thiès", "Saint-Louis", "Diourbel", 
  "Ziguinchor", "Kaolack", "Louga", "Fatick", 
  "Kolda", "Matam", "Kaffrine", "Kédougou", 
  "Sédhiou", "Tambacounda"
];

const ROLE_LABELS: Record<string, string> = {
  eleve: "Élève",
  enseignant: "Enseignant",
  parent: "Parent",
  admin: "Administrateur",
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function getAvatarBg(firstName: string) {
  const colors = ["bg-pink-400", "bg-blue-400", "bg-green-400", "bg-purple-400", "bg-orange-400", "bg-teal-400"];
  const index = (firstName?.charCodeAt(0) ?? 0) % colors.length;
  return colors[index];
}

export default function Profil() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Profile>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setEmail(user.email ?? "");

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!error && data) {
        let currentProfile = data;

        // Auto-guérison & Synchronisation :
        // Si les champs clés d'inscription sont absents dans public.profiles mais présents dans user.user_metadata,
        // on les persiste immédiatement dans la base pour que le profil et l'administration soient complets.
        const meta = user.user_metadata || {};
        const syncUpdates: Record<string, any> = {};
        if (!currentProfile.experience && meta.experience) syncUpdates.experience = meta.experience;
        if (!currentProfile.price && meta.price) syncUpdates.price = meta.price;
        if (!currentProfile.bio && meta.bio) syncUpdates.bio = meta.bio;
        if (!currentProfile.level && meta.level) syncUpdates.level = meta.level;
        if (!currentProfile.subject && meta.subject) syncUpdates.subject = meta.subject;
        if (!currentProfile.phone && meta.phone) syncUpdates.phone = meta.phone;
        if (!currentProfile.region && meta.region) syncUpdates.region = meta.region;

        if (Object.keys(syncUpdates).length > 0) {
          const { data: synced, error: syncErr } = await supabase
            .from("profiles")
            .update(syncUpdates)
            .eq("id", user.id)
            .select()
            .maybeSingle();

          if (!syncErr && synced) {
            currentProfile = synced;
          } else {
            currentProfile = { ...currentProfile, ...syncUpdates };
          }
        }

        setProfile(currentProfile);
        setFormData(currentProfile);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    
    const fileExt = file.name.split(".").pop();
    const filePath = `${profile.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatarUrl = urlData.publicUrl;
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", profile.id);
      setProfile({ ...profile, avatar_url: avatarUrl });
      setFormData({ ...formData, avatar_url: avatarUrl });
      showSuccess("Photo de profil mise à jour !");
    }
    setUploading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      phone: formData.phone,
      region: formData.region,
      quarter: formData.quarter,
      subject: formData.subject,
      level: formData.level,
      experience: formData.experience,
      price: formData.price,
      bio: formData.bio,
    }).eq("id", profile!.id);

    if (!error) {
      setProfile({ ...profile, ...formData } as Profile);
      setIsEditing(false);
      showSuccess("Profil mis à jour avec succès !");
    } else {
      alert("Erreur lors de la mise à jour : " + error.message);
    }
    setSaving(false);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) return <main className="flex-grow flex items-center justify-center"><i className="fas fa-spinner fa-spin text-sama-primary text-4xl"></i></main>;
  if (!profile) return <main className="flex-grow flex items-center justify-center"><p className="text-gray-500">Profil introuvable.</p></main>;

  const initials = getInitials(profile.first_name, profile.last_name);
  const avatarBg = getAvatarBg(profile.first_name);

  return (
    <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Mon Profil</h1>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold text-sm transition flex items-center gap-2">
            <i className="fas fa-edit"></i> Modifier
          </button>
        )}
      </div>

      {successMsg && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
          <i className="fas fa-check-circle"></i> {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne gauche — Avatar + base */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center gap-4">
          <div className="relative">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md" />
            ) : (
              <div className={`w-28 h-28 rounded-full ${avatarBg} flex items-center justify-center text-white font-bold text-4xl border-4 border-white shadow-md`}>
                {initials}
              </div>
            )}
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute bottom-0 right-0 bg-sama-primary text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:bg-blue-800 transition">
              {uploading ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className="fas fa-camera text-xs"></i>}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.first_name} {profile.last_name}</h2>
            <p className="text-sm text-gray-400 mt-1">{email}</p>
          </div>

          <span className="px-4 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-600">
            {ROLE_LABELS[profile.role] ?? profile.role}
          </span>

          <button onClick={handleLogout} className="mt-2 w-full border border-red-200 text-red-500 hover:bg-red-50 font-semibold py-2 rounded-xl text-sm transition">
            <i className="fas fa-sign-out-alt mr-2"></i>Se déconnecter
          </button>
          
          <button onClick={() => router.push("/demandes")} className="mt-2 w-full bg-blue-50 text-sama-primary hover:bg-blue-100 font-semibold py-2 rounded-xl text-sm transition">
            <i className="fas fa-inbox mr-2"></i>Mes demandes de cours
          </button>
        </div>

        {/* Colonne droite — Infos & Édition */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Informations détaillées</h3>
            
            {!isEditing ? (
              <div className="space-y-4 text-sm">
                {profile.role === "enseignant" && (
                  profile.verified ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-lg flex-shrink-0">
                        <i className="fas fa-check-circle"></i>
                      </div>
                      <div>
                        <p className="font-extrabold text-emerald-900 text-sm">Enseignant Accrédité &amp; Vérifié ✅</p>
                        <p className="text-emerald-700 text-xs">Votre profil est validé par la Direction SAMA ACADÉMIE et actif dans l&apos;annuaire officiel des familles.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg flex-shrink-0">
                        <i className="fas fa-user-clock"></i>
                      </div>
                      <div>
                        <p className="font-extrabold text-amber-900 text-sm">Dossier en attente d&apos;accréditation pédagogique ⏳</p>
                        <p className="text-amber-700 text-xs">Vos qualifications sont en cours d&apos;examen par notre équipe pédagogique. Dès validation, votre profil sera publié.</p>
                      </div>
                    </div>
                  )
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-gray-500 block text-xs">Téléphone (WhatsApp)</span><span className="font-bold text-gray-800">{profile.phone || "Non renseigné"}</span></div>
                  <div><span className="text-gray-500 block text-xs">Région</span><span className="font-bold text-gray-800">{profile.region || "Non renseignée"}</span></div>
                  <div><span className="text-gray-500 block text-xs">Quartier / Ville</span><span className="font-bold text-gray-800">{profile.quarter || "Non renseigné"}</span></div>
                  {profile.role === "eleve" && <div><span className="text-gray-500 block text-xs">Niveau scolaire</span><span className="font-bold text-gray-800">{profile.level || "Non renseigné"}</span></div>}
                </div>

                {profile.role === "enseignant" && (
                  <>
                    <hr className="border-gray-100" />
                    <h4 className="font-bold text-sama-primary text-base flex items-center gap-2">
                      <i className="fas fa-graduation-cap"></i> Dossier Pédagogique Officiel
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="text-gray-500 block text-xs">Matière principale</span>
                        <span className="font-bold text-gray-800">{profile.subject || "Non renseignée"}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="text-gray-500 block text-xs">Cycle d&apos;intervention</span>
                        <span className="font-bold text-gray-800">{profile.level || "Non renseigné"}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="text-gray-500 block text-xs">Diplôme &amp; Expérience</span>
                        <span className="font-bold text-gray-800">{profile.experience || "Non renseignée"}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="text-gray-500 block text-xs">Rémunération souhaitée / Tarif</span>
                        <span className="font-bold text-gray-800">{profile.price || "Non renseigné"}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-gray-500 block text-xs font-bold">Bio &amp; Présentation Pédagogique</span>
                      <p className="text-gray-800 leading-relaxed text-sm whitespace-pre-line">
                        {profile.bio || "Aucune présentation renseignée."}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Téléphone (WhatsApp)</label>
                    <input type="tel" value={formData.phone || ""} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-sama-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Région</label>
                    <select value={formData.region || ""} onChange={(e) => setFormData({...formData, region: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-sama-primary">
                      <option value="">Sélectionner</option>
                      {SENEGAL_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className={profile.role === "eleve" ? "col-span-1" : "col-span-2"}>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Quartier / Ville</label>
                    <input type="text" value={formData.quarter || ""} onChange={(e) => setFormData({...formData, quarter: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-sama-primary" placeholder="Ex: Point E, Parcelles..." />
                  </div>
                  {profile.role === "eleve" && (
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Classe / Niveau</label>
                      <input type="text" value={formData.level || ""} onChange={(e) => setFormData({...formData, level: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-sama-primary" placeholder="Ex: Terminale S2, Troisième..." />
                    </div>
                  )}
                </div>

                {profile.role === "enseignant" && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4 mt-4">
                    <h4 className="font-bold text-sama-primary text-sm flex items-center gap-1.5">
                      <i className="fas fa-chalkboard-teacher"></i> Informations Pédagogiques Enseignant
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Matière enseignée</label>
                        <input type="text" value={formData.subject || ""} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-sama-primary" placeholder="Ex: Mathématiques" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Cycle d&apos;intervention</label>
                        <input type="text" value={formData.level || ""} onChange={(e) => setFormData({...formData, level: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-sama-primary" placeholder="Ex: Collège (6e à 3e) ou Lycée" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Diplôme &amp; Années d&apos;expérience</label>
                        <input type="text" value={formData.experience || ""} onChange={(e) => setFormData({...formData, experience: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-sama-primary" placeholder="Ex: 2 à 5 ans d'expérience (FASTEF / ENS)" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Rémunération souhaitée / Tarif</label>
                        <input type="text" value={formData.price || ""} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-sama-primary" placeholder="Ex: 6000 FCFA PAR ELEVE" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Présentation pédagogique &amp; Démarche (Bio)</label>
                        <textarea rows={4} value={formData.bio || ""} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-sama-primary" placeholder="Décrivez votre méthode d'enseignement et votre approche auprès des élèves..."></textarea>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => { setIsEditing(false); setFormData(profile); }} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl text-sm font-bold transition">Annuler</button>
                  <button type="submit" disabled={saving} className="bg-sama-primary hover:bg-blue-800 text-white px-6 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2">
                    {saving ? <i className="fas fa-spinner fa-spin"></i> : "Enregistrer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
