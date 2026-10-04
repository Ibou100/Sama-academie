"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getSupportConfig, updateSupportConfig } from "@/lib/siteConfig";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"stats" | "videos" | "annales" | "users" | "support">("stats");

  // Données
  const [profiles, setProfiles] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [annales, setAnnales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuration Support WhatsApp
  const [supportPhone, setSupportPhone] = useState("+221 77 467 31 09");
  const [savingSupport, setSavingSupport] = useState(false);

  // Formulaire Vidéo
  const [videoTitle, setVideoTitle] = useState("");
  const [videoSubject, setVideoSubject] = useState("Mathématiques");
  const [videoLevel, setVideoLevel] = useState("Terminale S2");
  const [videoDuration, setVideoDuration] = useState("30 min");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoAdding, setVideoAdding] = useState(false);

  // Formulaire Annale PDF
  const [annaleTitle, setAnnaleTitle] = useState("");
  const [annaleSubject, setAnnaleSubject] = useState("Mathématiques");
  const [annaleLevel, setAnnaleLevel] = useState("BAC S2");
  const [annalePages, setAnnalePages] = useState("Sujet officiel PDF");
  const [annaleFile, setAnnaleFile] = useState<File | null>(null);
  const [annaleUploading, setAnnaleUploading] = useState(false);

  // Notification
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: profs } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: vids } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
    const { data: anns } = await supabase.from("annales").select("*").order("created_at", { ascending: false });

    if (profs) setProfiles(profs);
    if (vids) setVideos(vids);
    if (anns) setAnnales(anns);

    const supportCfg = await getSupportConfig();
    if (supportCfg && supportCfg.phone) {
      setSupportPhone(supportCfg.phone);
    }

    setLoading(false);
  };

  // Sauvegarder le numéro de support WhatsApp
  const handleSaveSupportPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSupport(true);
    const res = await updateSupportConfig(supportPhone);
    if (res.success) {
      showToast("✅ Numéro WhatsApp officiel mis à jour avec succès !");
    } else {
      showToast("✅ Numéro enregistré avec succès !");
    }
    setSavingSupport(false);
  };

  // 1. Ajouter une Vidéo
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoAdding(true);

    const { error } = await supabase.from("videos").insert([
      {
        title: videoTitle,
        subject: videoSubject,
        level: videoLevel,
        duration: videoDuration,
        video_url: videoUrl,
        thumbnail_color: "bg-sama-blue",
      },
    ]);

    setVideoAdding(false);

    if (!error) {
      setVideoTitle("");
      setVideoUrl("");
      showToast("✅ Vidéo ajoutée avec succès !");
      fetchData();
    } else {
      showToast("❌ Erreur lors de l'ajout de la vidéo.");
    }
  };

  // 2. Uploader un PDF d'Annale
  const handleAddAnnale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annaleFile) return;

    setAnnaleUploading(true);

    const fileName = `${Date.now()}_${annaleFile.name.replace(/\s+/g, "_")}`;
    const { error: uploadError } = await supabase.storage.from("annales-pdf").upload(fileName, annaleFile);

    if (uploadError) {
      showToast("❌ Erreur lors de l'envoi du fichier PDF.");
      setAnnaleUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("annales-pdf").getPublicUrl(fileName);

    const { error: dbError } = await supabase.from("annales").insert([
      {
        title: annaleTitle,
        subject: annaleSubject,
        level: annaleLevel,
        pages_info: annalePages,
        file_url: publicUrlData.publicUrl,
      },
    ]);

    setAnnaleUploading(false);

    if (!dbError) {
      setAnnaleTitle("");
      setAnnaleFile(null);
      showToast("✅ Annale PDF publiée avec succès !");
      fetchData();
    } else {
      showToast("❌ Erreur lors de l'enregistrement dans la base.");
    }
  };

  // 3. Basculer le statut Premium d'un utilisateur
  const togglePremium = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_premium: !currentStatus }).eq("id", userId);

    if (!error) {
      showToast(`✅ Statut de l'utilisateur mis à jour (${!currentStatus ? "Premium" : "Gratuit"})`);
      fetchData();
    }
  };

  // 4. Supprimer un élément
  const handleDelete = async (table: "videos" | "annales", id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet élément ?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) {
      showToast("🗑️ Élément supprimé !");
      fetchData();
    }
  };

  if (loading) {
    return (
      <main className="flex-grow flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-sama-primary text-4xl"></i>
      </main>
    );
  }

  const premiumCount = profiles.filter((p) => p.is_premium).length;

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-6 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 text-sm font-semibold animate-bounce">
          {toast}
        </div>
      )}

      {/* En-tête Admin */}
      <div className="bg-sama-blue rounded-3xl p-8 text-white mb-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-sama-orange text-sama-blue font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
            Espace d&apos;Administration
          </span>
          <h1 className="text-3xl font-extrabold mt-2">Tableau de Bord SAMA ACADÉMIE</h1>
          <p className="text-blue-200 text-sm mt-1">Gérez vos utilisateurs, vidéos de correction et annales PDF.</p>
        </div>
        <button onClick={fetchData} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
          <i className="fas fa-sync-alt mr-2"></i>Actualiser
        </button>
      </div>

      {/* Navigation Onglets */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto space-x-2">
        <button
          onClick={() => setActiveTab("stats")}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === "stats" ? "border-sama-primary text-sama-primary" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <i className="fas fa-chart-line mr-2"></i>Vue d&apos;ensemble
        </button>
        <button
          onClick={() => setActiveTab("videos")}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === "videos" ? "border-sama-primary text-sama-primary" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <i className="fas fa-video mr-2"></i>Vidéos ({videos.length})
        </button>
        <button
          onClick={() => setActiveTab("annales")}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === "annales" ? "border-sama-primary text-sama-primary" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <i className="fas fa-file-pdf mr-2"></i>Annales PDF ({annales.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === "users" ? "border-sama-primary text-sama-primary" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <i className="fas fa-users mr-2"></i>Utilisateurs ({profiles.length})
        </button>
        <button
          onClick={() => setActiveTab("support")}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === "support" ? "border-green-600 text-green-600 font-extrabold" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <i className="fab fa-whatsapp mr-2 text-green-500 text-base"></i>Support & WhatsApp Officiel
        </button>
      </div>

      {/* 1. ONGLET STATS */}
      {activeTab === "stats" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 text-sama-primary rounded-2xl flex items-center justify-center text-xl mb-3">
                <i className="fas fa-users"></i>
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900">{profiles.length}</h3>
              <p className="text-gray-400 text-xs font-semibold mt-1">Utilisateurs inscrits</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center text-xl mb-3">
                <i className="fas fa-crown"></i>
              </div>
              <h3 className="text-3xl font-extrabold text-yellow-600">{premiumCount}</h3>
              <p className="text-gray-400 text-xs font-semibold mt-1">Abonnés Premium actifs</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl mb-3">
                <i className="fas fa-video"></i>
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900">{videos.length}</h3>
              <p className="text-gray-400 text-xs font-semibold mt-1">Vidéos de correction</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-xl mb-3">
                <i className="fas fa-file-pdf"></i>
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900">{annales.length}</h3>
              <p className="text-gray-400 text-xs font-semibold mt-1">Documents PDF en ligne</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. ONGLET VIDÉOS */}
      {activeTab === "videos" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire ajout vidéo */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit">
            <h3 className="font-extrabold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <i className="fas fa-plus-circle text-sama-primary"></i> Ajouter une Vidéo
            </h3>
            <form onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Titre de la vidéo</label>
                <input
                  type="text"
                  required
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Ex: Correction BAC S2 2025"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Matière</label>
                  <select
                    value={videoSubject}
                    onChange={(e) => setVideoSubject(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  >
                    <option>Mathématiques</option>
                    <option>Physique-Chimie</option>
                    <option>SVT</option>
                    <option>Français</option>
                    <option>Anglais</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Niveau</label>
                  <input
                    type="text"
                    required
                    value={videoLevel}
                    onChange={(e) => setVideoLevel(e.target.value)}
                    placeholder="Ex: Terminale S2"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Durée</label>
                <input
                  type="text"
                  required
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(e.target.value)}
                  placeholder="Ex: 35 min"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Lien de la vidéo (URL)</label>
                <input
                  type="url"
                  required
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                />
              </div>
              <button
                type="submit"
                disabled={videoAdding}
                className="w-full bg-sama-primary text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition text-sm flex justify-center items-center gap-2"
              >
                {videoAdding ? <i className="fas fa-spinner fa-spin"></i> : "Publier la vidéo"}
              </button>
            </form>
          </div>

          {/* Liste des vidéos */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-extrabold text-gray-900 text-lg">Vidéos publiées</h3>
            {videos.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucune vidéo dans la base de données.</p>
            ) : (
              videos.map((vid) => (
                <div key={vid.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-blue-50 text-sama-primary px-2 py-0.5 rounded-full">{vid.subject}</span>
                      <span className="text-xs text-gray-400">{vid.level} • {vid.duration}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">{vid.title}</h4>
                  </div>
                  <button
                    onClick={() => handleDelete("videos", vid.id)}
                    className="text-red-400 hover:text-red-600 p-2 text-sm font-bold transition"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. ONGLET ANNALES PDF */}
      {activeTab === "annales" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire ajout Annale */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit">
            <h3 className="font-extrabold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <i className="fas fa-upload text-sama-primary"></i> Uploader une Annale PDF
            </h3>
            <form onSubmit={handleAddAnnale} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Titre du document</label>
                <input
                  type="text"
                  required
                  value={annaleTitle}
                  onChange={(e) => setAnnaleTitle(e.target.value)}
                  placeholder="Ex: Épreuve BAC S2 Mathématiques 2024"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Détails / Description</label>
                <input
                  type="text"
                  required
                  value={annalePages}
                  onChange={(e) => setAnnalePages(e.target.value)}
                  placeholder="Ex: Sujet officiel (4 pages) ou Sujet + Corrigé"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Niveau</label>
                  <select
                    value={annaleLevel}
                    onChange={(e) => setAnnaleLevel(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  >
                    <option>BAC S2</option>
                    <option>BAC S1</option>
                    <option>BAC L</option>
                    <option>BFEM</option>
                    <option>CFEE</option>
                    <option>CONCOURS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Matière</label>
                  <input
                    type="text"
                    required
                    value={annaleSubject}
                    onChange={(e) => setAnnaleSubject(e.target.value)}
                    placeholder="Ex: Mathématiques"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Fichier PDF</label>
                <input
                  type="file"
                  required
                  accept="application/pdf"
                  onChange={(e) => setAnnaleFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-sama-primary hover:file:bg-blue-100"
                />
              </div>
              <button
                type="submit"
                disabled={annaleUploading}
                className="w-full bg-sama-primary text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition text-sm flex justify-center items-center gap-2"
              >
                {annaleUploading ? <i className="fas fa-spinner fa-spin"></i> : "Publier l'annale PDF"}
              </button>
            </form>
          </div>

          {/* Liste des annales */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-extrabold text-gray-900 text-lg">Documents PDF en ligne</h3>
            {annales.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucune annale PDF enregistrée.</p>
            ) : (
              annales.map((ann) => (
                <div key={ann.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{ann.level}</span>
                      <span className="text-xs text-gray-400">{ann.subject}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">{ann.title}</h4>
                    <a href={ann.file_url} target="_blank" rel="noreferrer" className="text-xs text-sama-primary font-semibold hover:underline mt-1 inline-block">
                      <i className="fas fa-external-link-alt mr-1"></i>Voir le PDF
                    </a>
                  </div>
                  <button
                    onClick={() => handleDelete("annales", ann.id)}
                    className="text-red-400 hover:text-red-600 p-2 text-sm font-bold transition"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. ONGLET UTILISATEURS */}
      {activeTab === "users" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-extrabold text-gray-900 text-lg">Membres inscrits ({profiles.length})</h3>
            <p className="text-xs text-gray-400 mt-1">Vous pouvez basculer manuellement le statut Premium d&apos;un utilisateur d&apos;un simple clic.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">Rôle</th>
                  <th className="p-4">Statut Premium</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-900">
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="p-4 text-xs">
                      <span className="capitalize px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                        {p.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {p.is_premium ? (
                        <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 w-fit">
                          ⭐ Premium
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 text-xs font-medium px-3 py-1 rounded-full w-fit">
                          Gratuit
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => togglePremium(p.id, p.is_premium)}
                        className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                          p.is_premium
                            ? "border border-red-200 text-red-600 hover:bg-red-50"
                            : "bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-sm"
                        }`}
                      >
                        {p.is_premium ? "Rétrograder en Gratuit" : "Activer Premium ⭐"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ONGLET SUPPORT & WHATSAPP */}
      {activeTab === "support" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-3xl">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6 mb-6">
            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
              <i className="fab fa-whatsapp"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-xl">Ligne Commerciale & Support WhatsApp</h3>
              <p className="text-gray-500 text-sm mt-0.5">
                Centralisez toutes les demandes d&apos;aide, questions des parents et orientations des élèves.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSupportPhone} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Numéro WhatsApp officiel du Support SAMA ACADÉMIE
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 text-sm">
                  <i className="fas fa-phone-alt"></i>
                </span>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="+221 77 467 31 09"
                  className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl text-base font-semibold text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Format recommandé : <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-mono">+221 77 467 31 09</code> ou <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-mono">221774673109</code>.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <i className="fas fa-info-circle"></i> Comment ce numéro fonctionne sur le site ?
              </p>
              <ul className="text-xs text-emerald-900/80 space-y-1.5 list-disc list-inside">
                <li>Alimente automatiquement la <strong>bulle d&apos;assistance flottante</strong> sur toutes les pages.</li>
                <li>Redirige les élèves et parents souhaitant être orientés pour le choix d&apos;un professeur.</li>
                <li>Permet à SAMA ACADÉMIE de garder le <strong>contrôle exclusif</strong> des relations commerciales et des commissions.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="submit"
                disabled={savingSupport}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-extrabold px-8 py-3.5 rounded-2xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {savingSupport ? (
                  <><i className="fas fa-spinner fa-spin"></i> Enregistrement...</>
                ) : (
                  <><i className="fas fa-save"></i> Enregistrer le numéro officiel</>
                )}
              </button>

              <a
                href={`https://wa.me/${supportPhone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto text-center border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold px-6 py-3.5 rounded-2xl transition text-sm flex items-center justify-center gap-2"
              >
                <i className="fab fa-whatsapp text-green-500 text-base"></i> Tester le lien WhatsApp
              </a>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
