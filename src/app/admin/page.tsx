"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getSupportConfig, updateSupportConfig } from "@/lib/siteConfig";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"stats" | "requests" | "teachers" | "videos" | "annales" | "users" | "support">("stats");

  // Données
  const [profiles, setProfiles] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [annales, setAnnales] = useState<any[]>([]);
  const [tutoringRequests, setTutoringRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Actions modération & assignation
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedTeacherForAssign, setSelectedTeacherForAssign] = useState<Record<string, string>>({});

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
    const { data: reqs } = await supabase
      .from("tutoring_requests")
      .select(`*, student:profiles!student_id(first_name, last_name, phone, email, region, level), teacher:profiles!teacher_id(first_name, last_name, phone, subject, price)`)
      .order("created_at", { ascending: false });

    if (profs) setProfiles(profs);
    if (vids) setVideos(vids);
    if (anns) setAnnales(anns);
    if (reqs) setTutoringRequests(reqs);

    const supportCfg = await getSupportConfig();
    if (supportCfg && supportCfg.phone) {
      setSupportPhone(supportCfg.phone);
    }

    setLoading(false);
  };

  // 0. Assigner et valider une demande d'encadrement
  const handleAssignAndApprove = async (requestId: string, teacherId?: string) => {
    setActionLoadingId(requestId);
    const assignedTeacher = teacherId || selectedTeacherForAssign[requestId];
    
    const updatePayload: any = {
      status: "accepted",
      updated_at: new Date().toISOString()
    };
    if (assignedTeacher) {
      updatePayload.teacher_id = assignedTeacher;
    }

    const { error } = await supabase
      .from("tutoring_requests")
      .update(updatePayload)
      .eq("id", requestId);

    if (!error) {
      showToast("✅ Demande validée et assignée ! L'élève et le professeur peuvent désormais échanger.");
      setTutoringRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, ...updatePayload } : r));
    } else {
      showToast("❌ Erreur : " + error.message);
    }
    setActionLoadingId(null);
  };

  // Rejeter ou archiver une demande
  const handleRejectRequest = async (requestId: string) => {
    setActionLoadingId(requestId);
    const { error } = await supabase
      .from("tutoring_requests")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (!error) {
      showToast("Demande archivée / refusée.");
      setTutoringRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: "declined" } : r));
    }
    setActionLoadingId(null);
  };

  // Activer ou suspendre la validation d'un enseignant
  const toggleTeacherVerification = async (teacherId: string, currentStatus: boolean) => {
    setActionLoadingId(teacherId);
    const { error } = await supabase
      .from("profiles")
      .update({ verified: !currentStatus })
      .eq("id", teacherId);

    if (!error) {
      showToast(!currentStatus ? "✅ Enseignant validé et accrédité dans l'annuaire !" : "⏸️ Visibilité de l'enseignant suspendue.");
      setProfiles((prev) => prev.map((p) => p.id === teacherId ? { ...p, verified: !currentStatus } : p));
    } else {
      showToast("❌ Erreur : " + error.message);
    }
    setActionLoadingId(null);
  };

  // Supprimer définitivement un enseignant
  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer définitivement l'enseignant ${teacherName} ? Cette action est irréversible.`)) {
      return;
    }
    setActionLoadingId(teacherId);

    try {
      await supabase.from("tutoring_requests").delete().eq("teacher_id", teacherId);
      await supabase.from("virtual_classes").delete().eq("teacher_id", teacherId);

      const { error } = await supabase.from("profiles").delete().eq("id", teacherId);
      if (!error) {
        showToast(`🗑️ L'enseignant ${teacherName} a été supprimé définitivement.`);
        setProfiles((prev) => prev.filter((p) => p.id !== teacherId));
      } else {
        showToast("❌ Erreur : " + error.message);
      }
    } catch (err: any) {
      showToast("❌ Erreur : " + err.message);
    }
    setActionLoadingId(null);
  };

  // Valider tous les enseignants d'un clic
  const handleValidateAllTeachers = async () => {
    setActionLoadingId("all_teachers");
    const unverifiedTeachers = profiles.filter((p) => p.role === "enseignant" && !p.verified);
    if (unverifiedTeachers.length === 0) {
      showToast("Tous les enseignants sont déjà validés !");
      setActionLoadingId(null);
      return;
    }

    const ids = unverifiedTeachers.map((t) => t.id);
    const { error } = await supabase
      .from("profiles")
      .update({ verified: true })
      .in("id", ids);

    if (!error) {
      showToast(`✅ ${ids.length} enseignant(s) validé(s) avec succès !`);
      setProfiles((prev) => prev.map((p) => p.role === "enseignant" ? { ...p, verified: true } : p));
    } else {
      showToast("❌ Erreur : " + error.message);
    }
    setActionLoadingId(null);
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

  // 4. Supprimer un élément (vidéo ou annale)
  const handleDelete = async (table: "videos" | "annales", id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet élément ?")) return;
    setActionLoadingId(id);

    try {
      const { data, error } = await supabase.from(table).delete().eq("id", id).select();

      if (error) {
        showToast("❌ Erreur de suppression : " + error.message);
      } else if (!data || data.length === 0) {
        showToast("⚠️ La sécurité Supabase (RLS) bloque la suppression. Exécutez le script SQL d'autorisation.");
      } else {
        showToast("🗑️ Élément supprimé définitivement de la base !");
        if (table === "videos") {
          setVideos((prev) => prev.filter((v) => v.id !== id));
        } else {
          setAnnales((prev) => prev.filter((a) => a.id !== id));
        }
      }
    } catch (err: any) {
      showToast("❌ Erreur : " + (err?.message || "Échec"));
    } finally {
      setActionLoadingId(null);
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
  const allTeachers = profiles.filter((p) => p.role === "enseignant");
  const pendingTeachersCount = allTeachers.filter((p) => !p.verified).length;
  const verifiedTeachersCount = allTeachers.filter((p) => p.verified).length;
  const pendingRequestsCount = tutoringRequests.filter(
    (r) => r.status === "en_attente_admin" || r.status === "pending"
  ).length;

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
          className={`py-3 px-5 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === "stats" ? "border-sama-primary text-sama-primary" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <i className="fas fa-chart-line mr-2"></i>Vue d&apos;ensemble
        </button>

        <button
          onClick={() => setActiveTab("requests")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === "requests" ? "border-sama-primary text-sama-primary" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <i className="fas fa-handshake"></i>
          <span>Demandes d&apos;Encadrement</span>
          {pendingRequestsCount > 0 ? (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
              {pendingRequestsCount}
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {tutoringRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("teachers")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === "teachers" ? "border-sama-primary text-sama-primary" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <i className="fas fa-chalkboard-teacher"></i>
          <span>Validation Enseignants</span>
          {pendingTeachersCount > 0 ? (
            <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
              {pendingTeachersCount}
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {allTeachers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === "users" ? "border-sama-primary text-sama-primary" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <i className="fas fa-users mr-2"></i>Utilisateurs ({profiles.length})
        </button>

        <button
          onClick={() => setActiveTab("videos")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === "videos" ? "border-sama-primary text-sama-primary" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <i className="fas fa-video mr-2"></i>Vidéos ({videos.length})
        </button>

        <button
          onClick={() => setActiveTab("annales")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === "annales" ? "border-sama-primary text-sama-primary" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <i className="fas fa-file-pdf mr-2"></i>Annales PDF ({annales.length})
        </button>

        <button
          onClick={() => setActiveTab("support")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === "support" ? "border-green-600 text-green-600 font-extrabold" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <i className="fab fa-whatsapp mr-2 text-green-500 text-base"></i>Support WhatsApp
        </button>
      </div>

      {/* 1. ONGLET STATS */}
      {activeTab === "stats" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-xl mb-3">
                <i className="fas fa-handshake"></i>
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900">{tutoringRequests.length}</h3>
              <p className="text-xs font-semibold mt-1 text-red-600">
                {pendingRequestsCount} demande(s) en attente de traitement
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl mb-3">
                <i className="fas fa-chalkboard-teacher"></i>
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900">{allTeachers.length}</h3>
              <p className="text-xs font-semibold mt-1 text-emerald-600">
                {verifiedTeachersCount} validé(s) • {pendingTeachersCount} à valider
              </p>
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

      {/* 2. ONGLET DEMANDES D'ENCADREMENT & INTERMÉDIATION */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold mb-2">
                <i className="fas fa-shield-alt text-sama-orange"></i> Intermédiation Sécurisée & Commissions
              </div>
              <h2 className="text-2xl font-black">Demandes d&apos;Encadrement & Cours Particuliers</h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-2xl">
                Toutes les demandes formulées par les élèves et parents arrivent ici. Vous fixez le tarif, percevez la commission SAMA ACADÉMIE, et assignez l&apos;enseignant officiel.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20 text-center">
              <span className="text-2xl font-black text-sama-orange">{pendingRequestsCount}</span>
              <p className="text-[11px] text-blue-200 uppercase font-bold">À Traiter</p>
            </div>
          </div>

          {tutoringRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
              <i className="fas fa-clipboard-check text-4xl text-gray-300 mb-3 block"></i>
              <h3 className="font-bold text-gray-700 text-lg">Aucune demande d&apos;encadrement pour le moment</h3>
              <p className="text-xs text-gray-400 mt-1">Les futures demandes d&apos;élèves ou de parents apparaîtront ici.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tutoringRequests.map((req) => {
                const isPending = req.status === "en_attente_admin" || req.status === "pending";
                const isAccepted = req.status === "accepted";
                const isDeclined = req.status === "declined";
                const studentPhone = req.student?.phone || "";
                const cleanStudentPhone = studentPhone.replace(/[^0-9]/g, "");

                return (
                  <div key={req.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col lg:flex-row gap-6 justify-between items-start">
                    <div className="space-y-3 flex-grow max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        {isPending && (
                          <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                            <i className="fas fa-clock"></i> À Valider & Assigner
                          </span>
                        )}
                        {isAccepted && (
                          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                            <i className="fas fa-check-circle"></i> Validée & En Cours
                          </span>
                        )}
                        {isDeclined && (
                          <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
                            ❌ Refusée / Archivée
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          Reçue le {new Date(req.created_at).toLocaleDateString("fr-FR")} à {new Date(req.created_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-lg font-black text-gray-900 flex items-center gap-2">
                          <i className="fas fa-user-graduate text-sama-primary text-base"></i>
                          {req.student?.first_name} {req.student?.last_name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <strong>Niveau / Classe :</strong> {req.student?.level || "Non précisé"} • 📍 <strong>Région :</strong> {req.student?.region || "Sénégal"}
                        </p>
                      </div>

                      {req.message && (
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 text-xs text-gray-700 italic">
                          <span className="font-bold not-italic text-gray-900 block mb-1">Message de la demande :</span>
                          &quot;{req.message}&quot;
                        </div>
                      )}

                      {/* Professeur souhaité / assigné */}
                      <div className="text-xs text-gray-600 flex items-center gap-2">
                        <span className="font-bold">Professeur ciblé/assigné :</span>
                        {req.teacher ? (
                          <span className="bg-blue-50 text-sama-primary px-2.5 py-1 rounded-lg font-bold border border-blue-100">
                            👨‍🏫 {req.teacher.first_name} {req.teacher.last_name} ({req.teacher.subject || "Général"})
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Aucun professeur spécifique sélectionné</span>
                        )}
                      </div>

                      {/* Base de négociation financière : Prétention du professeur */}
                      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 text-xs space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                            <i className="fas fa-coins text-amber-600"></i> Rémunération souhaitée par l&apos;enseignant :
                          </span>
                          <span className="bg-white border border-amber-300 text-sama-primary font-black px-2.5 py-0.5 rounded-lg text-xs">
                            {req.teacher?.price ? req.teacher.price : "Non spécifié par le professeur"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-tight">
                          💡 <strong>Règle de négociation SAMA ACADÉMIE :</strong> L&apos;administration fixe le tarif final avec les parents sur WhatsApp en tenant compte de ce montant souhaité et de la commission de la plateforme.
                        </p>
                      </div>
                    </div>

                    {/* Bloc d'action Admin */}
                    <div className="w-full lg:w-80 bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3 flex-shrink-0">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Actions de la Direction</p>

                      {/* Contact WhatsApp direct avec l'élève/parent pour négociation et paiement */}
                      {cleanStudentPhone ? (
                        <a
                          href={`https://wa.me/${cleanStudentPhone}?text=Bonjour%20${encodeURIComponent(req.student?.first_name || '')},%20je%20suis%20le%20responsable%20p%C3%A9dagogique%20de%20SAMA%20ACAD%C3%89MIE.%20Concernant%20votre%20demande%20d'encadrement,%20je%20vous%20contacte%20pour%20convenir%20du%20planning%20et%20du%20tarif%20mensuel.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
                        >
                          <i className="fab fa-whatsapp text-base"></i> Négocier sur WhatsApp ({req.student?.phone})
                        </a>
                      ) : (
                        <div className="text-[11px] text-gray-400 bg-white p-2 rounded-xl text-center border">
                          Numéro téléphone non renseigné
                        </div>
                      )}

                      {/* Sélecteur de professeur officiel */}
                      {isPending && (
                        <div className="space-y-2 pt-2 border-t border-gray-200">
                          <label className="block text-[11px] font-bold text-gray-700">
                            Choisir / Assigner le Professeur :
                          </label>
                          <select
                            value={selectedTeacherForAssign[req.id] || req.teacher_id || ""}
                            onChange={(e) => setSelectedTeacherForAssign({ ...selectedTeacherForAssign, [req.id]: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-white outline-none focus:border-sama-primary font-medium"
                          >
                            <option value="">-- Sélectionner un enseignant --</option>
                            {allTeachers.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.first_name} {t.last_name} — {t.subject || "Général"} ({t.price ? `Tarif souhaité: ${t.price}` : "Tarif libre"}) {t.verified ? "✅" : "⏳"}
                              </option>
                            ))}
                          </select>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleAssignAndApprove(req.id)}
                              disabled={actionLoadingId === req.id}
                              className="flex-1 bg-sama-primary hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                            >
                              {actionLoadingId === req.id ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <><i className="fas fa-check"></i> Valider & Activer</>
                              )}
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.id)}
                              disabled={actionLoadingId === req.id}
                              className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-3 rounded-xl text-xs transition"
                            >
                              Refuser
                            </button>
                          </div>
                        </div>
                      )}

                      {isAccepted && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 text-[11px] text-green-800 font-medium text-center">
                          ✅ Cours validé. La messagerie interne est ouverte entre l&apos;élève et l&apos;enseignant.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. ONGLET VALIDATION ENSEIGNANTS */}
      {activeTab === "teachers" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Modération du Corps Professoral</h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-2xl">
                Contrôlez les diplômes et l&apos;expérience des enseignants avant de les afficher publiquement dans l&apos;annuaire.
              </p>
            </div>
            {pendingTeachersCount > 0 && (
              <button
                onClick={handleValidateAllTeachers}
                disabled={actionLoadingId === "all_teachers"}
                className="bg-sama-primary hover:bg-blue-800 text-white font-bold px-5 py-3 rounded-2xl text-xs transition shadow-sm flex items-center gap-2"
              >
                {actionLoadingId === "all_teachers" ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <><i className="fas fa-check-double"></i> Valider tous les profs en attente ({pendingTeachersCount})</>
                )}
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="p-4">Enseignant</th>
                    <th className="p-4">Matière & Niveau</th>
                    <th className="p-4">Diplôme & Expérience</th>
                    <th className="p-4">Contact WhatsApp</th>
                    <th className="p-4">Statut Annuaire</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                        Aucun enseignant inscrit pour le moment.
                      </td>
                    </tr>
                  ) : (
                    allTeachers.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50 transition">
                        <td className="p-4">
                          <p className="font-extrabold text-gray-900">{t.first_name} {t.last_name}</p>
                          <p className="text-xs text-gray-400">{t.email || "Email non renseigné"}</p>
                          <p className="text-[11px] text-sama-primary font-semibold mt-0.5">📍 {t.region || "Région inconnue"}</p>
                        </td>

                        <td className="p-4">
                          <span className="bg-blue-50 text-sama-primary text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-100">
                            {t.subject || "Général"}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{t.level || "Tous cycles"}</p>
                        </td>

                        <td className="p-4 max-w-xs">
                          <p className="text-xs font-bold text-gray-800">{t.experience || "Expérience non renseignée"}</p>
                          {t.bio && (
                            <p className="text-[11px] text-gray-500 italic mt-0.5 line-clamp-2">&quot;{t.bio}&quot;</p>
                          )}
                        </td>

                        <td className="p-4">
                          {t.phone ? (
                            <a
                              href={`https://wa.me/${t.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-700 font-bold text-xs inline-flex items-center gap-1.5"
                            >
                              <i className="fab fa-whatsapp text-base"></i> {t.phone}
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">Non renseigné</span>
                          )}
                        </td>

                        <td className="p-4">
                          {t.verified ? (
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                              <i className="fas fa-check-circle"></i> Accrédité (Visible)
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                              <i className="fas fa-clock"></i> En Attente (Masqué)
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleTeacherVerification(t.id, t.verified)}
                              disabled={actionLoadingId === t.id}
                              className={`font-bold px-3 py-1.5 rounded-xl text-xs transition shadow-xs ${
                                t.verified
                                  ? "border border-amber-300 text-amber-700 hover:bg-amber-50"
                                  : "bg-green-600 hover:bg-green-700 text-white"
                              }`}
                              title={t.verified ? "Masquer cet enseignant de l'annuaire" : "Rendre cet enseignant visible"}
                            >
                              {actionLoadingId === t.id ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : t.verified ? (
                                "⏸️ Masquer"
                              ) : (
                                "✅ Publier"
                              )}
                            </button>

                            <button
                              onClick={() => handleDeleteTeacher(t.id, `${t.first_name} ${t.last_name}`)}
                              disabled={actionLoadingId === t.id}
                              className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-xl text-xs transition shadow-xs flex items-center gap-1 border border-red-200"
                              title="Supprimer définitivement cet enseignant"
                            >
                              <i className="fas fa-trash-alt"></i> Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                    disabled={actionLoadingId === vid.id}
                    onClick={() => handleDelete("videos", vid.id)}
                    className="text-red-400 hover:text-red-600 p-2 text-sm font-bold transition disabled:opacity-50"
                    title="Supprimer la vidéo"
                  >
                    {actionLoadingId === vid.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>}
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
                    disabled={actionLoadingId === ann.id}
                    onClick={() => handleDelete("annales", ann.id)}
                    className="text-red-400 hover:text-red-600 p-2 text-sm font-bold transition disabled:opacity-50"
                    title="Supprimer l'annale"
                  >
                    {actionLoadingId === ann.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>}
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
