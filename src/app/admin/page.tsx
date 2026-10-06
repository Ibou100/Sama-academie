"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getSupportConfig, updateSupportConfig } from "@/lib/siteConfig";
import { detectCycle, Cycle } from "@/lib/cycle";

type TabKey = "overview" | "users" | "requests" | "teachers" | "classes" | "content" | "settings";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Données principales
  const [profiles, setProfiles] = useState<any[]>([]);
  const [tutoringRequests, setTutoringRequests] = useState<any[]>([]);
  const [virtualClasses, setVirtualClasses] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [annales, setAnnales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres & Recherche Utilisateurs
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userCycleFilter, setUserCycleFilter] = useState<string>("all");
  const [userPremiumFilter, setUserPremiumFilter] = useState<string>("all");

  // Actions asynchrones & chargements
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedTeacherForAssign, setSelectedTeacherForAssign] = useState<Record<string, string>>({});

  // Négociation financière par contrat
  const [contractPricing, setContractPricing] = useState<Record<string, { familyPrice: string; teacherPayout: string; notes: string }>>({});

  // Configuration Support & Annonce Globale
  const [supportPhone, setSupportPhone] = useState("+221 77 467 31 09");
  const [supportWelcomeMsg, setSupportWelcomeMsg] = useState("Bonjour SAMA ACADÉMIE, j'ai besoin d'une orientation pour mon enfant.");
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

  // Toasts de feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      // 1. Profils utilisateurs
      const { data: profs } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (profs) setProfiles(profs);

      // 2. Demandes d'encadrement
      const { data: reqs } = await supabase
        .from("tutoring_requests")
        .select(`*, student:profiles!student_id(first_name, last_name, phone, email, region, level), teacher:profiles!teacher_id(first_name, last_name, phone, subject, price)`)
        .order("created_at", { ascending: false });
      if (reqs) {
        setTutoringRequests(reqs);
        // Extraire les données de tarification enregistrées dans le message
        const pricingMap: Record<string, any> = {};
        reqs.forEach((r) => {
          if (r.message && r.message.includes("[SAMA_CONTRAT]")) {
            const raw = r.message.split("[SAMA_CONTRAT]")[1] || "";
            const famMatch = raw.match(/Famille:\s*([^|]+)/i);
            const profMatch = raw.match(/Prof:\s*([^|]+)/i);
            const noteMatch = raw.match(/Note:\s*([^$]+)/i);
            pricingMap[r.id] = {
              familyPrice: famMatch ? famMatch[1].trim() : "",
              teacherPayout: profMatch ? profMatch[1].trim() : "",
              notes: noteMatch ? noteMatch[1].trim() : "",
            };
          }
        });
        setContractPricing(pricingMap);
      }

      // 3. Classes virtuelles
      const { data: vClasses } = await supabase
        .from("virtual_classes")
        .select("*, teacher:profiles(first_name, last_name, email, phone)")
        .order("created_at", { ascending: false });
      if (vClasses) setVirtualClasses(vClasses);

      // 4. Vidéos & Annales
      const { data: vids } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
      if (vids) setVideos(vids);

      const { data: anns } = await supabase.from("annales").select("*").order("created_at", { ascending: false });
      if (anns) setAnnales(anns);

      // 5. Config Support
      const supportCfg = await getSupportConfig();
      if (supportCfg?.phone) setSupportPhone(supportCfg.phone);
    } catch (err: any) {
      console.error("Erreur chargement données admin:", err);
      showToast("Erreur lors de la synchronisation des données.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ========================================================================= */
  /*  STATISTIQUES & ANALYTICS SAAS                                            */
  /* ========================================================================= */
  const stats = useMemo(() => {
    const totalUsers = profiles.length;
    const students = profiles.filter((p) => p.role === "eleve");
    const parents = profiles.filter((p) => p.role === "parent");
    const teachers = profiles.filter((p) => p.role === "enseignant");
    const admins = profiles.filter((p) => p.role === "admin");
    const premiumUsers = profiles.filter((p) => p.is_premium);

    const pendingTeachers = teachers.filter((t) => !t.verified);
    const verifiedTeachers = teachers.filter((t) => t.verified);

    const pendingRequests = tutoringRequests.filter(
      (r) => r.status === "en_attente_admin" || r.status === "pending"
    );
    const activeRequests = tutoringRequests.filter((r) => r.status === "accepted");

    // Cycles scolaires des élèves
    let lyceeCount = 0;
    let collegeCount = 0;
    let primaireCount = 0;
    students.forEach((s) => {
      const c = detectCycle(s.level);
      if (c === "Lycee") lyceeCount++;
      else if (c === "College") collegeCount++;
      else if (c === "Primaire") primaireCount++;
      else lyceeCount++; // Par défaut
    });

    // Estimation Volume Financier Mensuel (GMV) basée sur les contrats
    let estimatedMonthlyGMV = 0;
    activeRequests.forEach((req) => {
      const pricing = contractPricing[req.id];
      if (pricing?.familyPrice) {
        const num = parseInt(pricing.familyPrice.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(num)) estimatedMonthlyGMV += num;
      } else {
        estimatedMonthlyGMV += 30000; // Estimation forfait moyen
      }
    });

    // Estimation Commissions SAMA ACADÉMIE (Marge plateforme)
    let estimatedMonthlyCommission = 0;
    activeRequests.forEach((req) => {
      const pricing = contractPricing[req.id];
      if (pricing?.familyPrice && pricing?.teacherPayout) {
        const f = parseInt(pricing.familyPrice.replace(/[^0-9]/g, ""), 10) || 0;
        const p = parseInt(pricing.teacherPayout.replace(/[^0-9]/g, ""), 10) || 0;
        if (f > p) estimatedMonthlyCommission += (f - p);
      } else {
        estimatedMonthlyCommission += 10000; // Forfait moyen 10 000 FCFA
      }
    });

    const liveClassesCount = virtualClasses.filter((vc) => vc.status === "live").length;
    const scheduledClassesCount = virtualClasses.filter((vc) => vc.status === "scheduled").length;

    return {
      totalUsers,
      studentsCount: students.length,
      parentsCount: parents.length,
      teachersCount: teachers.length,
      adminsCount: admins.length,
      premiumCount: premiumUsers.length,
      premiumRate: totalUsers > 0 ? Math.round((premiumUsers.length / totalUsers) * 100) : 0,
      pendingTeachersCount: pendingTeachers.length,
      verifiedTeachersCount: verifiedTeachers.length,
      pendingRequestsCount: pendingRequests.length,
      activeRequestsCount: activeRequests.length,
      lyceeCount,
      collegeCount,
      primaireCount,
      estimatedMonthlyGMV,
      estimatedMonthlyCommission,
      liveClassesCount,
      scheduledClassesCount,
    };
  }, [profiles, tutoringRequests, virtualClasses, contractPricing]);

  /* ========================================================================= */
  /*  FILTRAGE DYNAMIQUE DES UTILISATEURS                                      */
  /* ========================================================================= */
  const filteredUsers = useMemo(() => {
    return profiles.filter((p) => {
      // 1. Recherche texte (Nom, Email, Téléphone, Région, Classe)
      const q = userSearch.toLowerCase().trim();
      if (q) {
        const fullName = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase();
        const email = (p.email || "").toLowerCase();
        const phone = (p.phone || "").toLowerCase();
        const region = (p.region || "").toLowerCase();
        const level = (p.level || "").toLowerCase();
        if (!fullName.includes(q) && !email.includes(q) && !phone.includes(q) && !region.includes(q) && !level.includes(q)) {
          return false;
        }
      }

      // 2. Filtre rôle
      if (userRoleFilter !== "all" && p.role !== userRoleFilter) return false;

      // 3. Filtre cycle (applicable aux élèves)
      if (userCycleFilter !== "all") {
        const c = detectCycle(p.level);
        if (c !== userCycleFilter) return false;
      }

      // 4. Filtre premium
      if (userPremiumFilter === "premium" && !p.is_premium) return false;
      if (userPremiumFilter === "free" && p.is_premium) return false;

      return true;
    });
  }, [profiles, userSearch, userRoleFilter, userCycleFilter, userPremiumFilter]);

  /* ========================================================================= */
  /*  ACTIONS ADMIN : UTILISATEURS (MOT DE PASSE, RÔLE, SUPPRESSION)          */
  /* ========================================================================= */
  const handleResetPassword = async (userId: string, userName: string) => {
    const pwd = window.prompt(`Nouveau mot de passe pour ${userName} (minimum 6 caractères) :`);
    if (pwd === null) return;
    if (pwd.length < 6) {
      showToast("Le mot de passe doit contenir au moins 6 caractères.", "error");
      return;
    }

    setActionLoadingId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ userId, newPassword: pwd }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`Mot de passe mis à jour pour ${userName} ! Vous pouvez lui transmettre sur WhatsApp.`, "success");
      } else {
        showToast(data.error || "Échec de la réinitialisation.", "error");
      }
    } catch {
      showToast("Erreur de connexion au serveur.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateRole = async (userId: string, currentName: string, newRole: string) => {
    if (!confirm(`Confirmez-vous le passage de ${currentName} au rôle "${newRole.toUpperCase()}" ?`)) return;

    setActionLoadingId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ userId, updates: { role: newRole } }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`Rôle mis à jour (${newRole}) avec succès !`, "success");
        setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p)));
      } else {
        showToast(data.error || "Impossible de mettre à jour le rôle.", "error");
      }
    } catch {
      showToast("Erreur lors de la modification.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`⚠️ ATTENTION SUPPRESSION DÉFINITIVE !\n\nVoulez-vous vraiment supprimer le compte de ${userName} ?\nToutes ses demandes, accès et messages seront effacés.`)) {
      return;
    }

    setActionLoadingId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`Compte de ${userName} supprimé définitivement.`, "success");
        setProfiles((prev) => prev.filter((p) => p.id !== userId));
      } else {
        showToast(data.error || "Échec de la suppression.", "error");
      }
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const togglePremium = async (userId: string, currentStatus: boolean) => {
    setActionLoadingId(userId);
    const { error } = await supabase.from("profiles").update({ is_premium: !currentStatus }).eq("id", userId);
    if (!error) {
      showToast(`Statut Premium ${!currentStatus ? "activé ⭐" : "désactivé"} !`, "success");
      setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, is_premium: !currentStatus } : p)));
    } else {
      showToast("Erreur de mise à jour Premium.", "error");
    }
    setActionLoadingId(null);
  };

  /* ========================================================================= */
  /*  ACTIONS ADMIN : CONTRATS, NÉGOCIATIONS & PROFESSEURS                     */
  /* ========================================================================= */
  const handleSaveContractPricing = async (requestId: string) => {
    const pricing = contractPricing[requestId] || { familyPrice: "", teacherPayout: "", notes: "" };
    const req = tutoringRequests.find((r) => r.id === requestId);
    if (!req) return;

    setActionLoadingId(requestId);
    const originalMsg = req.message ? req.message.replace(/\[SAMA_CONTRAT\][\s\S]*$/, "").trim() : "";
    const contractTag = `[SAMA_CONTRAT] Famille: ${pricing.familyPrice || "À convenir"} | Prof: ${pricing.teacherPayout || "À convenir"} | Note: ${pricing.notes || "Négociation en cours"}`;
    const newMsg = originalMsg ? `${originalMsg}\n\n${contractTag}` : contractTag;

    const { error } = await supabase
      .from("tutoring_requests")
      .update({ message: newMsg, updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (!error) {
      showToast("Accord financier enregistré avec succès !", "success");
      setTutoringRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, message: newMsg } : r)));
    } else {
      showToast("Erreur lors de l'enregistrement du contrat.", "error");
    }
    setActionLoadingId(null);
  };

  const handleAssignAndApprove = async (requestId: string, teacherId?: string) => {
    setActionLoadingId(requestId);
    const assignedTeacher = teacherId || selectedTeacherForAssign[requestId];

    const updatePayload: any = {
      status: "accepted",
      updated_at: new Date().toISOString(),
    };
    if (assignedTeacher) {
      updatePayload.teacher_id = assignedTeacher;
    }

    const { error } = await supabase
      .from("tutoring_requests")
      .update(updatePayload)
      .eq("id", requestId);

    if (!error) {
      showToast("Contrat validé et activé ! La salle et le chat sont maintenant ouverts.", "success");
      setTutoringRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, ...updatePayload } : r))
      );
    } else {
      showToast("Erreur : " + error.message, "error");
    }
    setActionLoadingId(null);
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoadingId(requestId);
    const { error } = await supabase
      .from("tutoring_requests")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (!error) {
      showToast("Demande archivée / clôturée.", "info");
      setTutoringRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "declined" } : r))
      );
    }
    setActionLoadingId(null);
  };

  const toggleTeacherVerification = async (teacherId: string, currentStatus: boolean) => {
    setActionLoadingId(teacherId);
    const { error } = await supabase
      .from("profiles")
      .update({ verified: !currentStatus })
      .eq("id", teacherId);

    if (!error) {
      showToast(
        !currentStatus
          ? "Professeur accrédité et visible dans l'annuaire officiel ! ✅"
          : "Professeur suspendu de l'annuaire public. ⏸️",
        "success"
      );
      setProfiles((prev) =>
        prev.map((p) => (p.id === teacherId ? { ...p, verified: !currentStatus } : p))
      );
    }
    setActionLoadingId(null);
  };

  /* ========================================================================= */
  /*  CLASSES VIRTUELLES (SUPERVISION DIRECT)                                  */
  /* ========================================================================= */
  const handleEndClass = async (classId: string) => {
    if (!confirm("Voulez-vous clôturer cette session de cours en direct ?")) return;
    setActionLoadingId(classId);
    const { error } = await supabase
      .from("virtual_classes")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", classId);

    if (!error) {
      showToast("Session de cours clôturée avec succès.", "success");
      setVirtualClasses((prev) =>
        prev.map((vc) => (vc.id === classId ? { ...vc, status: "ended" } : vc))
      );
    }
    setActionLoadingId(null);
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Supprimer définitivement cette classe virtuelle de la base ?")) return;
    setActionLoadingId(classId);
    await supabase.from("meeting_messages").delete().eq("virtual_class_id", classId);
    const { error } = await supabase.from("virtual_classes").delete().eq("id", classId);

    if (!error) {
      showToast("Classe virtuelle supprimée.", "info");
      setVirtualClasses((prev) => prev.filter((vc) => vc.id !== classId));
    }
    setActionLoadingId(null);
  };

  /* ========================================================================= */
  /*  CONTENUS (VIDÉOS & ANNALES)                                              */
  /* ========================================================================= */
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) return;
    setVideoAdding(true);

    const { data, error } = await supabase
      .from("videos")
      .insert([
        {
          title: videoTitle.trim(),
          subject: videoSubject,
          level: videoLevel,
          duration: videoDuration || "30 min",
          video_url: videoUrl.trim() || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          is_free: false,
          thumbnail_color: "bg-blue-600",
        },
      ])
      .select();

    if (!error && data) {
      showToast("Vidéo ajoutée à la bibliothèque !", "success");
      setVideos((prev) => [data[0], ...prev]);
      setVideoTitle("");
      setVideoUrl("");
    } else {
      showToast("Erreur lors de l'ajout de la vidéo.", "error");
    }
    setVideoAdding(false);
  };

  const handleAddAnnale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annaleTitle.trim()) return;
    setAnnaleUploading(true);

    let fileUrl = "https://sama-academie.sn/annales/sample.pdf";
    if (annaleFile) {
      const fileExt = annaleFile.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("annales_pdf").upload(fileName, annaleFile);
      if (!uploadError) {
        const { data: pubData } = supabase.storage.from("annales_pdf").getPublicUrl(fileName);
        fileUrl = pubData.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from("annales")
      .insert([
        {
          title: annaleTitle.trim(),
          subject: annaleSubject,
          level: annaleLevel,
          pages: annalePages || "PDF Officiel",
          file_url: fileUrl,
          is_free: false,
          download_count: 0,
        },
      ])
      .select();

    if (!error && data) {
      showToast("Épreuve PDF ajoutée avec succès !", "success");
      setAnnales((prev) => [data[0], ...prev]);
      setAnnaleTitle("");
      setAnnaleFile(null);
    } else {
      showToast("Erreur lors de l'ajout de l'annale.", "error");
    }
    setAnnaleUploading(false);
  };

  const handleDeleteItem = async (table: "videos" | "annales", id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet élément définitivement ?")) return;
    setActionLoadingId(id);

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) {
      showToast("Élément supprimé de la base.", "info");
      if (table === "videos") setVideos((prev) => prev.filter((v) => v.id !== id));
      else setAnnales((prev) => prev.filter((a) => a.id !== id));
    } else {
      showToast("Erreur de suppression : " + error.message, "error");
    }
    setActionLoadingId(null);
  };

  const handleSaveSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSupport(true);
    const { success } = await updateSupportConfig(supportPhone);
    if (success) {
      showToast("Numéro WhatsApp officiel mis à jour sur tout le site !", "success");
    } else {
      showToast("Erreur lors de la sauvegarde du support.", "error");
    }
    setSavingSupport(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <i className="fas fa-spinner fa-spin text-sama-primary text-4xl"></i>
          <p className="text-sm font-bold text-gray-600">Chargement de la Console de Direction SAMA ACADÉMIE...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Toast Notification Flottant */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 transition transform duration-300 ${
            toast.type === "success"
              ? "bg-emerald-900 text-emerald-100 border border-emerald-700"
              : toast.type === "error"
              ? "bg-red-900 text-red-100 border border-red-700"
              : "bg-slate-900 text-white border border-slate-700"
          }`}
        >
          <i
            className={`fas ${
              toast.type === "success"
                ? "fa-check-circle text-emerald-400"
                : toast.type === "error"
                ? "fa-exclamation-triangle text-red-400"
                : "fa-info-circle text-blue-400"
            }`}
          ></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER DE DIRECTION / TOPBAR COMMAND */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sama-primary flex items-center justify-center text-white font-black text-lg shadow-md">
              SA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">SAMA ACADÉMIE</h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-sama-orange text-slate-900 px-2 py-0.5 rounded-full">
                  Control Tower
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-400">Poste de commandement & Administration opérationnelle</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-700"
            >
              <span>Voir le site</span>
              <i className="fas fa-external-link-alt text-[10px]"></i>
            </Link>
            <button
              onClick={fetchData}
              className="text-xs font-bold bg-sama-primary hover:bg-blue-600 text-white px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <i className="fas fa-sync-alt text-xs"></i>
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* NAVIGATION DES ONGLETS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none flex gap-1 border-t border-slate-800/80 pt-1">
          {[
            { id: "overview", label: "Vue d'ensemble", icon: "fa-chart-pie", badge: null },
            { id: "users", label: "Utilisateurs", icon: "fa-users", badge: profiles.length },
            { id: "requests", label: "Contrats & Négociations", icon: "fa-handshake", badge: stats.pendingRequestsCount, badgeAlert: stats.pendingRequestsCount > 0 },
            { id: "teachers", label: "Corps Professoral", icon: "fa-chalkboard-teacher", badge: stats.pendingTeachersCount, badgeAlert: stats.pendingTeachersCount > 0 },
            { id: "classes", label: "Classes Virtuelles", icon: "fa-video", badge: stats.liveClassesCount > 0 ? "LIVE" : virtualClasses.length, badgeLive: stats.liveClassesCount > 0 },
            { id: "content", label: "Bibliothèque & Contenus", icon: "fa-folder-open", badge: videos.length + annales.length },
            { id: "settings", label: "Paramètres & Support", icon: "fa-sliders-h", badge: null },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabKey)}
                className={`py-3 px-3.5 text-xs font-bold whitespace-nowrap border-b-2 flex items-center gap-2 transition ${
                  isActive
                    ? "border-sama-orange text-sama-orange bg-slate-800/50"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <i className={`fas ${tab.icon} text-sm`}></i>
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      tab.badgeLive
                        ? "bg-red-500 text-white animate-pulse"
                        : tab.badgeAlert
                        ? "bg-amber-500 text-slate-900 font-extrabold"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* =================================================================== */}
        {/* 1. ONGLET : VUE D'ENSEMBLE (METRIQUES SAAS & COCKPIT)               */}
        {/* =================================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* GRILLE DES KPIS CLÉS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <span>Membres Totaux</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-sama-primary flex items-center justify-center text-sm">
                    <i className="fas fa-users"></i>
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 mt-2">{stats.totalUsers}</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
                  <span className="font-bold text-sama-primary">{stats.studentsCount} élèves</span> •{" "}
                  <span>{stats.parentsCount} parents</span> •{" "}
                  <span>{stats.teachersCount} profs</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <span>Contrats d&apos;Encadrement</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
                    <i className="fas fa-handshake"></i>
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 mt-2">{tutoringRequests.length}</div>
                <div className="flex items-center gap-2 text-xs mt-2 font-medium">
                  <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                    {stats.pendingRequestsCount} à négocier
                  </span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    {stats.activeRequestsCount} actifs
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <span>Volume Mensuel Estimé</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
                    <i className="fas fa-coins"></i>
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-700 mt-2">
                  {stats.estimatedMonthlyGMV.toLocaleString("fr-FR")} <span className="text-xs font-bold text-slate-500">FCFA</span>
                </div>
                <div className="text-xs text-slate-500 mt-2 font-medium">
                  Marge plateforme estimée : <strong className="text-slate-800">~{stats.estimatedMonthlyCommission.toLocaleString("fr-FR")} FCFA</strong>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <span>Classes & Directs</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm">
                    <i className="fas fa-video"></i>
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 mt-2">{virtualClasses.length}</div>
                <div className="flex items-center gap-2 text-xs mt-2 font-medium">
                  {stats.liveClassesCount > 0 ? (
                    <span className="text-white bg-red-600 font-black px-2 py-0.5 rounded-md animate-pulse">
                      🔴 {stats.liveClassesCount} en direct
                    </span>
                  ) : (
                    <span className="text-slate-500">Aucune session en direct</span>
                  )}
                  <span className="text-slate-400">({stats.scheduledClassesCount} prévues)</span>
                </div>
              </div>
            </div>

            {/* GRILLES D'ANALYSE DÉTAILLÉE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Répartition par Cycles */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <i className="fas fa-graduation-cap text-sama-primary"></i>
                  Répartition des Élèves par Cycle
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span>Lycée (Seconde à Terminale)</span>
                      <span>{stats.lyceeCount} ({stats.studentsCount > 0 ? Math.round((stats.lyceeCount / stats.studentsCount) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-sama-primary h-2.5 rounded-full"
                        style={{ width: `${stats.studentsCount > 0 ? (stats.lyceeCount / stats.studentsCount) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span>Collège (6ème à 3ème)</span>
                      <span>{stats.collegeCount} ({stats.studentsCount > 0 ? Math.round((stats.collegeCount / stats.studentsCount) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-sama-orange h-2.5 rounded-full"
                        style={{ width: `${stats.studentsCount > 0 ? (stats.collegeCount / stats.studentsCount) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span>Primaire (CI à CM2)</span>
                      <span>{stats.primaireCount} ({stats.studentsCount > 0 ? Math.round((stats.primaireCount / stats.studentsCount) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2.5 rounded-full"
                        style={{ width: `${stats.studentsCount > 0 ? (stats.primaireCount / stats.studentsCount) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Abonnements Premium :</span>
                  <span className="font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                    ⭐ {stats.premiumCount} ({stats.premiumRate}%)
                  </span>
                </div>
              </div>

              {/* Raccourcis d'actions immédiates */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 lg:col-span-2">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <i className="fas fa-bolt text-amber-500"></i>
                  Actions Rapides de Direction
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveTab("requests")}
                    className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100/70 transition text-left space-y-1"
                  >
                    <div className="text-amber-800 font-extrabold text-xs flex items-center justify-between">
                      <span>Négocier Contrats</span>
                      <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                        {stats.pendingRequestsCount}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900/80 leading-snug">
                      Fixer les tarifs et rémunérations avec les familles.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveTab("teachers")}
                    className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 hover:bg-blue-100/70 transition text-left space-y-1"
                  >
                    <div className="text-sama-primary font-extrabold text-xs flex items-center justify-between">
                      <span>Accréditer Profs</span>
                      <span className="bg-sama-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                        {stats.pendingTeachersCount}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-900/80 leading-snug">
                      Vérifier les diplômes avant publication dans l&apos;annuaire.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveTab("users")}
                    className="p-4 rounded-2xl bg-slate-100 border border-slate-200 hover:bg-slate-200/70 transition text-left space-y-1"
                  >
                    <div className="text-slate-800 font-extrabold text-xs flex items-center justify-between">
                      <span>Gérer Comptes</span>
                      <i className="fas fa-key text-slate-400"></i>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Réinitialiser mots de passe, rôles ou bannir.
                    </p>
                  </button>
                </div>

                {/* Dernières demandes récentes */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-700 mb-2">Dernières demandes formulées :</p>
                  {tutoringRequests.slice(0, 3).map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-none">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{r.student?.first_name} {r.student?.last_name}</span>
                        <span className="text-slate-400">({r.student?.level || "Niveau non renseigné"})</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        r.status === "accepted" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {r.status === "accepted" ? "Validé" : "En attente"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 2. ONGLET : GESTION DES UTILISATEURS (CONTRÔLE 360°)                */}
        {/* =================================================================== */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* BARRE D'OUTILS ET RECHERCHE */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Annuaire des Utilisateurs ({filteredUsers.length} / {profiles.length})</h2>
                  <p className="text-xs text-slate-500">Recherchez, gérez les rôles, réinitialisez les mots de passe et contactez les membres directement.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Actions rapides par compte disponibles ci-dessous</span>
                </div>
              </div>

              {/* FILTRES DYNAMIQUES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                <div className="relative">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Recherche nom, email, tél, classe..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium outline-none focus:border-sama-primary focus:bg-white transition"
                  />
                  <i className="fas fa-search text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-xs"></i>
                </div>

                <div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-sama-primary bg-white transition"
                  >
                    <option value="all">Tous les rôles ({profiles.length})</option>
                    <option value="eleve">Élèves ({stats.studentsCount})</option>
                    <option value="parent">Parents ({stats.parentsCount})</option>
                    <option value="enseignant">Enseignants ({stats.teachersCount})</option>
                    <option value="admin">Administrateurs ({stats.adminsCount})</option>
                  </select>
                </div>

                <div>
                  <select
                    value={userCycleFilter}
                    onChange={(e) => setUserCycleFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-sama-primary bg-white transition"
                  >
                    <option value="all">Tous les cycles d&apos;études</option>
                    <option value="Lycee">Lycée (Seconde à Terminale)</option>
                    <option value="College">Collège (6e à 3e)</option>
                    <option value="Primaire">Primaire (CI à CM2)</option>
                  </select>
                </div>

                <div>
                  <select
                    value={userPremiumFilter}
                    onChange={(e) => setUserPremiumFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-sama-primary bg-white transition"
                  >
                    <option value="all">Tous les statuts d&apos;abonnement</option>
                    <option value="premium">⭐ Premium uniquement</option>
                    <option value="free">Gratuits uniquement</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TABLEAU DES MEMBRES */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-4">Utilisateur</th>
                      <th className="p-4">Rôle</th>
                      <th className="p-4">Niveau / Cycle</th>
                      <th className="p-4">WhatsApp Direct</th>
                      <th className="p-4">Statut Premium</th>
                      <th className="p-4 text-right">Actions Système</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          Aucun utilisateur ne correspond à vos critères de recherche.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const cleanPhone = (user.phone || "").replace(/[^0-9]/g, "");
                        const isActionActive = actionLoadingId === user.id;

                        return (
                          <tr key={user.id} className="hover:bg-slate-50/70 transition">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-black flex items-center justify-center text-xs flex-shrink-0 border border-slate-200">
                                  {user.first_name?.[0]?.toUpperCase() || "U"}{user.last_name?.[0]?.toUpperCase() || ""}
                                </div>
                                <div>
                                  <div className="font-extrabold text-slate-900">
                                    {user.first_name} {user.last_name}
                                  </div>
                                  <div className="text-[11px] text-slate-400">{user.email || "Sans email"}</div>
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              <select
                                value={user.role}
                                onChange={(e) => handleUpdateRole(user.id, `${user.first_name} ${user.last_name}`, e.target.value)}
                                className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl outline-none cursor-pointer border ${
                                  user.role === "admin"
                                    ? "bg-purple-50 text-purple-800 border-purple-200"
                                    : user.role === "enseignant"
                                    ? "bg-blue-50 text-sama-primary border-blue-200"
                                    : user.role === "parent"
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                <option value="eleve">Élève</option>
                                <option value="parent">Parent</option>
                                <option value="enseignant">Enseignant</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>

                            <td className="p-4">
                              <div className="font-medium text-slate-700">{user.level || "Non renseigné"}</div>
                              <div className="text-[10px] text-slate-400">📍 {user.region || "Sénégal"}</div>
                            </td>

                            <td className="p-4">
                              {cleanPhone ? (
                                <a
                                  href={`https://wa.me/${cleanPhone}?text=Bonjour%20${encodeURIComponent(user.first_name || '')},%20je%20suis%20le%20responsable%20SAMA%20ACAD%C3%89MIE.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
                                >
                                  <i className="fab fa-whatsapp text-emerald-500"></i>
                                  <span>{user.phone}</span>
                                </a>
                              ) : (
                                <span className="text-slate-400 italic">Aucun tél</span>
                              )}
                            </td>

                            <td className="p-4">
                              <button
                                onClick={() => togglePremium(user.id, user.is_premium)}
                                disabled={isActionActive}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition border flex items-center gap-1 ${
                                  user.is_premium
                                    ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                }`}
                              >
                                <span>{user.is_premium ? "⭐ Premium" : "Gratuit"}</span>
                              </button>
                            </td>

                            <td className="p-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => handleResetPassword(user.id, `${user.first_name} ${user.last_name}`)}
                                  disabled={isActionActive}
                                  title="Définir un nouveau mot de passe"
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-sama-primary text-slate-700 hover:text-sama-primary font-bold transition flex items-center gap-1"
                                >
                                  <i className="fas fa-key text-[10px]"></i>
                                  <span className="hidden sm:inline">Mot de passe</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteUser(user.id, `${user.first_name} ${user.last_name}`)}
                                  disabled={isActionActive}
                                  title="Supprimer définitivement l'utilisateur"
                                  className="w-8 h-8 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 flex items-center justify-center transition"
                                >
                                  <i className="fas fa-trash-alt text-[11px]"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 3. ONGLET : CONTRATS & NÉGOCIATIONS D'ENCADREMENT                     */}
        {/* =================================================================== */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="bg-sama-orange text-slate-900 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                  Deal & Pricing Room
                </span>
                <h2 className="text-2xl font-black mt-2">Négociations Financières & Contrats d&apos;Encadrement</h2>
                <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
                  En tant qu&apos;administrateur, vous avez le contrôle total sur la tarification : fixez le tarif convenu avec la famille, la rémunération versée au professeur, et validez le contrat.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center">
                <span className="text-2xl font-black text-sama-orange">{stats.pendingRequestsCount}</span>
                <p className="text-[10px] uppercase font-bold text-slate-300">En cours de négociation</p>
              </div>
            </div>

            {tutoringRequests.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
                <i className="fas fa-clipboard-check text-4xl text-slate-300 mb-3 block"></i>
                <h3 className="font-extrabold text-slate-800 text-base">Aucune demande d&apos;encadrement pour le moment</h3>
                <p className="text-xs text-slate-400 mt-1">Dès qu&apos;un élève ou un parent sollicite un enseignant, la négociation apparaît ici.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tutoringRequests.map((req) => {
                  const isPending = req.status === "en_attente_admin" || req.status === "pending";
                  const isAccepted = req.status === "accepted";
                  const isDeclined = req.status === "declined";
                  const cleanPhone = (req.student?.phone || "").replace(/[^0-9]/g, "");
                  const pricing = contractPricing[req.id] || { familyPrice: "", teacherPayout: "", notes: "" };

                  const fPriceNum = parseInt(pricing.familyPrice.replace(/[^0-9]/g, ""), 10) || 0;
                  const tPriceNum = parseInt(pricing.teacherPayout.replace(/[^0-9]/g, ""), 10) || 0;
                  const estimatedMargin = fPriceNum > tPriceNum ? fPriceNum - tPriceNum : 0;

                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col lg:flex-row gap-6 justify-between items-start"
                    >
                      {/* DÉTAILS DE LA DEMANDE */}
                      <div className="space-y-4 flex-grow max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          {isPending && (
                            <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                              <i className="fas fa-clock"></i> Négociation Ouverte
                            </span>
                          )}
                          {isAccepted && (
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                              <i className="fas fa-check-circle"></i> Contrat Validé & En Cours
                            </span>
                          )}
                          {isDeclined && (
                            <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
                              ❌ Refusé / Archivé
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            Reçue le {new Date(req.created_at).toLocaleDateString("fr-FR")}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <i className="fas fa-user-graduate text-sama-primary text-base"></i>
                            {req.student?.first_name} {req.student?.last_name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            <strong>Niveau :</strong> {req.student?.level || "Non précisé"} • 📍 <strong>Région :</strong> {req.student?.region || "Sénégal"}
                          </p>
                        </div>

                        {req.message && (
                          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3 text-xs text-slate-700 italic">
                            <span className="font-bold not-italic text-slate-900 block mb-0.5">Besoins exprimés par la famille :</span>
                            &quot;{req.message.replace(/\[SAMA_CONTRAT\][\s\S]*$/, "").trim()}&quot;
                          </div>
                        )}

                        {/* COCKPIT DE NÉGOCIATION FINANCIÈRE */}
                        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-amber-900 flex items-center gap-1.5">
                              <i className="fas fa-calculator text-amber-600"></i>
                              Paramètres Financiers du Contrat
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Prétention du prof : <strong>{req.teacher?.price || "Libre"}</strong>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-amber-900 mb-1">
                                Facturé à la Famille :
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: 35 000 FCFA"
                                value={pricing.familyPrice}
                                onChange={(e) =>
                                  setContractPricing({
                                    ...contractPricing,
                                    [req.id]: { ...pricing, familyPrice: e.target.value },
                                  })
                                }
                                className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:border-sama-primary"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-black uppercase text-amber-900 mb-1">
                                Versé au Professeur :
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: 25 000 FCFA"
                                value={pricing.teacherPayout}
                                onChange={(e) =>
                                  setContractPricing({
                                    ...contractPricing,
                                    [req.id]: { ...pricing, teacherPayout: e.target.value },
                                  })
                                }
                                className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:border-sama-primary"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-black uppercase text-amber-900 mb-1">
                                Marge SAMA ACADÉMIE :
                              </label>
                              <div className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-2.5 py-1.5 text-xs font-black text-emerald-800">
                                {estimatedMargin > 0 ? `+${estimatedMargin.toLocaleString("fr-FR")} FCFA` : "À calculer"}
                              </div>
                            </div>
                          </div>

                          <div>
                            <input
                              type="text"
                              placeholder="Notes internes (ex: 2 séances de 2h/semaine les mardis et jeudis)"
                              value={pricing.notes}
                              onChange={(e) =>
                                setContractPricing({
                                  ...contractPricing,
                                  [req.id]: { ...pricing, notes: e.target.value },
                                })
                              }
                              className="w-full bg-white border border-amber-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none"
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={() => handleSaveContractPricing(req.id)}
                              disabled={actionLoadingId === req.id}
                              className="text-xs font-bold text-amber-900 hover:text-black bg-amber-200/80 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition"
                            >
                              <i className="fas fa-save mr-1"></i> Sauvegarder les montants
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* BLOC ACTIONS DE VALIDATION */}
                      <div className="w-full lg:w-80 bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3 flex-shrink-0">
                        <p className="text-xs font-black uppercase text-slate-700 tracking-wider">Intermédiation Directe</p>

                        {/* WhatsApp famille */}
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=Bonjour%20${encodeURIComponent(req.student?.first_name || '')},%20je%20suis%20la%20Direction%20p%C3%A9dagogique%20de%20SAMA%20ACAD%C3%89MIE.%20Concernant%20votre%20demande%20d'encadrement,%20le%20tarif%20est%20de%20${encodeURIComponent(pricing.familyPrice || 'votre accord')}.%20Pouvons-nous%20valider%20le%20planning%20?`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
                          >
                            <i className="fab fa-whatsapp text-base"></i> Négocier avec la famille
                          </a>
                        ) : (
                          <div className="text-[11px] text-slate-400 bg-white p-2 rounded-xl text-center border">
                            Téléphone non fourni
                          </div>
                        )}

                        {/* Professeur assigné */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-200">
                          <label className="block text-[11px] font-bold text-slate-700">Professeur Assigné :</label>
                          <select
                            value={selectedTeacherForAssign[req.id] || req.teacher_id || ""}
                            onChange={(e) =>
                              setSelectedTeacherForAssign({ ...selectedTeacherForAssign, [req.id]: e.target.value })
                            }
                            className="w-full border border-slate-300 rounded-xl p-2 text-xs bg-white outline-none focus:border-sama-primary font-medium"
                          >
                            <option value="">-- Choisir un enseignant --</option>
                            {profiles
                              .filter((p) => p.role === "enseignant")
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.first_name} {t.last_name} ({t.subject || "Général"}) {t.verified ? "✅" : "⏳"}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Boutons d'approbation */}
                        {isPending && (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleAssignAndApprove(req.id)}
                              disabled={actionLoadingId === req.id}
                              className="flex-1 bg-sama-primary hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition shadow-sm"
                            >
                              {actionLoadingId === req.id ? "Traitement..." : "Valider Contrat ✅"}
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.id)}
                              disabled={actionLoadingId === req.id}
                              className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-3 rounded-xl text-xs transition"
                            >
                              Refuser
                            </button>
                          </div>
                        )}

                        {isAccepted && (
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-2.5 rounded-xl text-center font-bold">
                            Contrat Actif. Salle et suivi ouverts.
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

        {/* =================================================================== */}
        {/* 4. ONGLET : CORPS PROFESSORAL & ACCRÉDITATION                       */}
        {/* =================================================================== */}
        {activeTab === "teachers" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Accréditation du Corps Professoral ({stats.teachersCount})</h2>
                <p className="text-xs text-slate-500">Vérifiez les qualifications avant d&apos;autoriser la visibilité publique dans l&apos;annuaire officiel.</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
                  {stats.verifiedTeachersCount} Validés
                </span>
                <span className="bg-amber-50 text-amber-800 font-bold px-3 py-1 rounded-full border border-amber-200">
                  {stats.pendingTeachersCount} En attente
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles
                .filter((p) => p.role === "enseignant")
                .map((t) => {
                  const cleanPhone = (t.phone || "").replace(/[^0-9]/g, "");

                  return (
                    <div key={t.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-sama-primary font-black flex items-center justify-center text-sm border border-blue-100">
                            {t.first_name?.[0]}{t.last_name?.[0]}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm">
                              {t.first_name} {t.last_name}
                            </h3>
                            <p className="text-xs text-sama-primary font-bold">{t.subject || "Matière générale"}</p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                          t.verified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {t.verified ? "Accrédité ✅" : "En attente ⏳"}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1.5 border border-slate-100">
                        <div><strong>Cycle enseigné :</strong> {t.level || "Non précisé"}</div>
                        <div><strong>Diplôme & Expérience :</strong> {t.experience || "Non renseigné"}</div>
                        <div><strong>Prétention tarifaire :</strong> {t.price || "Tarif libre"}</div>
                        {t.bio && <div className="text-slate-500 italic mt-1">&quot;{t.bio}&quot;</div>}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=Bonjour%20M.%20${encodeURIComponent(t.last_name || '')},%20je%20suis%20la%20Direction%20SAMA%20ACAD%C3%89MIE.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1.5 border border-emerald-200"
                          >
                            <i className="fab fa-whatsapp text-emerald-600"></i>
                            <span>WhatsApp</span>
                          </a>
                        )}

                        <button
                          onClick={() => toggleTeacherVerification(t.id, t.verified)}
                          disabled={actionLoadingId === t.id}
                          className={`flex-1 font-bold py-2 px-3 rounded-xl text-xs transition ${
                            t.verified
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              : "bg-sama-primary hover:bg-blue-700 text-white shadow-xs"
                          }`}
                        >
                          {t.verified ? "Suspendre l'accréditation" : "Accréditer le Professeur ✅"}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 5. ONGLET : CLASSES VIRTUELLES (SUPERVISION DIRECT)                */}
        {/* =================================================================== */}
        {activeTab === "classes" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Supervision des Classes Virtuelles & Visio ({virtualClasses.length})</h2>
                <p className="text-xs text-slate-500">Supervisez la qualité des cours en direct. Vous pouvez rejoindre n&apos;importe quelle session en observateur.</p>
              </div>
              <div className="flex items-center gap-2">
                {stats.liveClassesCount > 0 && (
                  <span className="bg-red-500 text-white font-black text-xs px-3 py-1 rounded-full animate-pulse">
                    🔴 {stats.liveClassesCount} En Direct Actuellement
                  </span>
                )}
              </div>
            </div>

            {virtualClasses.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
                <i className="fas fa-video-slash text-4xl text-slate-300 mb-3 block"></i>
                <h3 className="font-extrabold text-slate-800 text-base">Aucune classe virtuelle créée</h3>
                <p className="text-xs text-slate-400 mt-1">Les sessions lancées par les enseignants s&apos;afficheront ici.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {virtualClasses.map((vc) => {
                  const isLive = vc.status === "live";
                  const isScheduled = vc.status === "scheduled";

                  return (
                    <div key={vc.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          isLive
                            ? "bg-red-500 text-white animate-pulse"
                            : isScheduled
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {isLive ? "🔴 En Direct" : isScheduled ? "🟡 Programmée" : "⚪ Clôturée"}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">Code: {vc.meeting_code}</span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{vc.title}</h4>
                        <p className="text-xs text-sama-primary font-bold mt-0.5">{vc.subject} • {vc.target_level}</p>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600 space-y-1">
                        <div>👨‍🏫 <strong>Professeur :</strong> {vc.teacher?.first_name} {vc.teacher?.last_name || "Enseignant"}</div>
                        <div>📅 <strong>Horaire :</strong> {new Date(vc.scheduled_at).toLocaleDateString("fr-FR")} à {new Date(vc.scheduled_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <Link
                          href={`/classes/${vc.id}/room`}
                          target="_blank"
                          className="flex-1 bg-sama-primary hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs text-center transition shadow-xs"
                        >
                          <i className="fas fa-eye mr-1"></i> Inspecter / Rejoindre
                        </Link>

                        {isLive && (
                          <button
                            onClick={() => handleEndClass(vc.id)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-3 py-2 rounded-xl text-xs transition"
                            title="Clôturer le cours"
                          >
                            Terminer
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteClass(vc.id)}
                          className="w-8 h-8 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 flex items-center justify-center transition"
                          title="Supprimer la classe"
                        >
                          <i className="fas fa-trash-alt text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* 6. ONGLET : BIBLIOTHÈQUE & CONTENUS (VIDÉOS & ANNALES)              */}
        {/* =================================================================== */}
        {activeTab === "content" && (
          <div className="space-y-8">
            {/* AJOUT DE CONTENUS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulaire Vidéo */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <i className="fas fa-video text-sama-primary"></i>
                  Ajouter une Vidéo Pédagogique
                </h3>
                <form onSubmit={handleAddVideo} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Titre de la leçon / correction</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Nombres Complexes - Forme Exponentielle"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-sama-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Matière</label>
                      <select
                        value={videoSubject}
                        onChange={(e) => setVideoSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium outline-none"
                      >
                        <option>Mathématiques</option>
                        <option>Physique-Chimie</option>
                        <option>SVT</option>
                        <option>Français</option>
                        <option>Philosophie</option>
                        <option>Anglais</option>
                        <option>Histoire-Géo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Classe / Niveau</label>
                      <select
                        value={videoLevel}
                        onChange={(e) => setVideoLevel(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium outline-none"
                      >
                        <option>Terminale S2</option>
                        <option>Terminale S1</option>
                        <option>Terminale L</option>
                        <option>Première S</option>
                        <option>Seconde S</option>
                        <option>3ème (BFEM)</option>
                        <option>CM2 (CFEE)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lien YouTube / Vidéo</label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-sama-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={videoAdding}
                    className="w-full bg-sama-primary hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition shadow-xs"
                  >
                    {videoAdding ? "Publication..." : "Publier la Vidéo"}
                  </button>
                </form>
              </div>

              {/* Formulaire Annale PDF */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <i className="fas fa-file-pdf text-red-600"></i>
                  Ajouter une Épreuve / Annale Officielle (PDF)
                </h3>
                <form onSubmit={handleAddAnnale} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Titre du document</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: BAC Blanc 2024 Mathématiques S2 - Lycée Limamoulaye"
                      value={annaleTitle}
                      onChange={(e) => setAnnaleTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-sama-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Matière</label>
                      <select
                        value={annaleSubject}
                        onChange={(e) => setAnnaleSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium outline-none"
                      >
                        <option>Mathématiques</option>
                        <option>Physique-Chimie</option>
                        <option>SVT</option>
                        <option>Français</option>
                        <option>Philosophie</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Examen / Niveau</label>
                      <select
                        value={annaleLevel}
                        onChange={(e) => setAnnaleLevel(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium outline-none"
                      >
                        <option>BAC S2</option>
                        <option>BAC S1</option>
                        <option>BAC L2</option>
                        <option>BFEM</option>
                        <option>CFEE (Entrée en 6e)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fichier PDF officiel</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setAnnaleFile(e.target.files?.[0] || null)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={annaleUploading}
                    className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl transition shadow-xs"
                  >
                    {annaleUploading ? "Envoi en cours..." : "Téléverser l'Annale PDF"}
                  </button>
                </form>
              </div>
            </div>

            {/* LISTE DES CONTENUS PUBLIÉS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vidéos */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Vidéos Actives ({videos.length})
                </h4>
                {videos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucune vidéo en ligne.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {videos.map((v) => (
                      <div key={v.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{v.title}</p>
                          <p className="text-[11px] text-slate-500">{v.subject} • {v.level}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteItem("videos", v.id)}
                          className="text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Annales */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Annales PDF en Ligne ({annales.length})
                </h4>
                {annales.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucune annale en ligne.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {annales.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{a.title}</p>
                          <p className="text-[11px] text-slate-500">{a.subject} • {a.level}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteItem("annales", a.id)}
                          className="text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 7. ONGLET : PARAMÈTRES & SUPPORT WHATSAPP                          */}
        {/* =================================================================== */}
        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <i className="fab fa-whatsapp text-emerald-500 text-xl"></i>
                  Ligne Officielle WhatsApp SAMA ACADÉMIE
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ce numéro est rattaché au bouton flottant WhatsApp de tout le site et aux demandes d&apos;orientation.
                </p>
              </div>

              <form onSubmit={handleSaveSupport} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Numéro de Téléphone Officiel</label>
                  <input
                    type="text"
                    required
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="+221 77 000 00 00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-sama-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Message d&apos;Accroche Pré-rempli</label>
                  <textarea
                    rows={3}
                    value={supportWelcomeMsg}
                    onChange={(e) => setSupportWelcomeMsg(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-sama-primary"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Texte automatique qui s&apos;ouvre dans WhatsApp quand l&apos;utilisateur clique sur le support.</p>
                </div>

                <button
                  type="submit"
                  disabled={savingSupport}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl transition shadow-xs text-xs"
                >
                  {savingSupport ? "Mise à jour..." : "Enregistrer la Ligne Support"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
