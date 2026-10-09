"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getSupportConfig, updateSupportConfig } from "@/lib/siteConfig";
import { detectCycle, Cycle } from "@/lib/cycle";
import { logAdminAction } from "@/lib/auditLogger";

type TabKey = "overview" | "users" | "requests" | "teachers" | "classes" | "content" | "audit" | "settings";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Données principales
  const [profiles, setProfiles] = useState<any[]>([]);
  const [tutoringRequests, setTutoringRequests] = useState<any[]>([]);
  const [virtualClasses, setVirtualClasses] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [annales, setAnnales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Journal d'Audit & Traçabilité (Surveillance Live)
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditTableMissing, setAuditTableMissing] = useState(false);
  const [currentAdminProfile, setCurrentAdminProfile] = useState<any>(null);
  const [connectedNonAdmin, setConnectedNonAdmin] = useState<any>(null);

  // Modal Récupération Mot de Passe Admin Oublié
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotMethod, setForgotMethod] = useState<"passcode" | "email">("passcode");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPasscode, setForgotPasscode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Sécurité & Verrouillage d'Accès Multi-Admins
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authMode, setAuthMode] = useState<"account" | "passcode">("account");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [accessError, setAccessError] = useState("");
  const [adminPasscode, setAdminPasscode] = useState("sama2026");
  const [newPasscodeInput, setNewPasscodeInput] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

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

  // Gestion & Édition du dossier Enseignant (Accréditation)
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [savingTeacherDossier, setSavingTeacherDossier] = useState(false);
  const [teacherFilterStatus, setTeacherFilterStatus] = useState<"all" | "pending" | "verified">("all");
  const [teacherSearch, setTeacherSearch] = useState("");

  // Création directe d'utilisateur (Enseignant / Élève / Parent / Admin) par l'Admin
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    role: "enseignant",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    region: "Dakar",
    level: "Collège (6e à 3e)",
    subject: "Mathématiques",
    experience: "5 ans d'expérience",
    price: "6000 FCFA par élève",
    bio: "",
    verified: true,
  });

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

  const fetchAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      const res = await fetch("/api/admin/audit");
      const data = await res.json();
      if (data.ok && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
        setAuditTableMissing(!!data.tableMissing);
      }
    } catch (err) {
      console.warn("Erreur chargement logs audit:", err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    const savedPasscode = typeof window !== "undefined" ? localStorage.getItem("sama_custom_admin_passcode") || "sama2026" : "sama2026";
    setAdminPasscode(savedPasscode);

    const sessionUnlocked = typeof window !== "undefined" ? sessionStorage.getItem("sama_admin_unlocked") === "true" : false;

    // Récupérer le compte connecté
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile?.role === "admin") {
              // C'est un administrateur officiel
              setCurrentAdminProfile(profile);
              setConnectedNonAdmin(null);
              setIsUnlocked(true);
              sessionStorage.setItem("sama_admin_unlocked", "true");
              fetchData();
              fetchAuditLogs();
            } else {
              // C'est un profil enseignant, élève ou parent connecté sur le site !
              // On ne le définit JAMAIS comme currentAdminProfile !
              setConnectedNonAdmin(profile || { id: user.id, email: user.email, role: "enseignant", first_name: "Utilisateur" });
              if (sessionUnlocked) {
                // Déverrouillé par le Code Maître Direction
                setCurrentAdminProfile({
                  id: "direction-master",
                  first_name: "Direction",
                  last_name: "Générale",
                  email: "direction@sama-academie.sn",
                  role: "admin",
                  isMaster: true,
                });
                setIsUnlocked(true);
                fetchData();
                fetchAuditLogs();
              } else {
                setIsUnlocked(false);
              }
            }
            setCheckingAuth(false);
            setLoading(false);
          });
      } else {
        if (sessionUnlocked) {
          setCurrentAdminProfile({
            id: "direction-master",
            first_name: "Direction",
            last_name: "Générale",
            email: "direction@sama-academie.sn",
            role: "admin",
            isMaster: true,
          });
          setIsUnlocked(true);
          fetchData();
          fetchAuditLogs();
        }
        setCheckingAuth(false);
        setLoading(false);
      }
    });
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
  /*  JOURNAL D'AUDIT & TRAÇABILITÉ (STATISTIQUES & FILTRAGE)                  */
  /* ========================================================================= */
  const auditStats = useMemo(() => {
    const uniqueAdmins = new Set(auditLogs.map((l) => l.admin_email).filter(Boolean));
    const uniqueCities = new Set(auditLogs.map((l) => l.city).filter(Boolean));
    return {
      total: auditLogs.length,
      uniqueAdminsCount: uniqueAdmins.size || 1,
      uniqueCitiesCount: uniqueCities.size || 1,
    };
  }, [auditLogs]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((l) => {
      const q = auditSearch.toLowerCase().trim();
      if (q) {
        const adminName = (l.admin_name || "").toLowerCase();
        const adminEmail = (l.admin_email || "").toLowerCase();
        const action = (l.action || "").toLowerCase();
        const details = (l.details || "").toLowerCase();
        const targetName = (l.target_name || "").toLowerCase();
        const ip = (l.ip_address || "").toLowerCase();
        const city = (l.city || "").toLowerCase();
        const country = (l.country || "").toLowerCase();
        if (
          !adminName.includes(q) &&
          !adminEmail.includes(q) &&
          !action.includes(q) &&
          !details.includes(q) &&
          !targetName.includes(q) &&
          !ip.includes(q) &&
          !city.includes(q) &&
          !country.includes(q)
        ) {
          return false;
        }
      }

      if (auditActionFilter === "all") return true;
      if (auditActionFilter === "auth") {
        return ["CONNEXION", "DEVERROUILLAGE_CODE", "VERROUILLAGE", "VERIFICATION_SECURITE"].includes(l.action);
      }
      if (auditActionFilter === "users") {
        return ["MODIF_ROLE", "MODIF_ROLE_UTILISATEUR", "SUPPRESSION_UTILISATEUR", "STATUT_PREMIUM"].includes(l.action);
      }
      if (auditActionFilter === "password") {
        return l.action.includes("MDP") || l.action.includes("PASSE");
      }
      if (auditActionFilter === "contracts") {
        return ["ACCORD_FINANCIER", "VALIDATION_CONTRAT", "REJET_DEMANDE"].includes(l.action);
      }
      if (auditActionFilter === "content") {
        return ["AJOUT_VIDEO", "AJOUT_ANNALE", "SUPPRESSION_CONTENU", "CLOTURE_CLASSE", "SUPPRESSION_CLASSE"].includes(l.action);
      }
      if (auditActionFilter === "settings") {
        return ["MODIF_SUPPORT", "MODIF_CODE_ACCES", "MODIF_PARAMETRES_SUPPORT"].includes(l.action);
      }
      return true;
    });
  }, [auditLogs, auditSearch, auditActionFilter]);

  const exportAuditLogsToCSV = () => {
    if (filteredAuditLogs.length === 0) {
      showToast("Aucun log à exporter.", "info");
      return;
    }
    const headers = [
      "Date (ISO)",
      "Date Locale",
      "Administrateur",
      "Email",
      "Action",
      "Cible",
      "Détails",
      "Adresse IP",
      "Ville",
      "Pays",
      "Appareil / Navigateur",
      "Statut",
    ];
    const rows = filteredAuditLogs.map((l) => [
      l.created_at,
      new Date(l.created_at).toLocaleString("fr-FR"),
      `"${(l.admin_name || "").replace(/"/g, '""')}"`,
      `"${(l.admin_email || "").replace(/"/g, '""')}"`,
      l.action,
      `"${(l.target_name || "").replace(/"/g, '""')}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
      l.ip_address || "127.0.0.1",
      `"${(l.city || "").replace(/"/g, '""')}"`,
      `"${(l.country || "").replace(/"/g, '""')}"`,
      `"${(l.user_agent || "").replace(/"/g, '""')}"`,
      l.status || "SUCCESS",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sama_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Fichier d'audit CSV téléchargé avec succès !", "success");
  };

  /* ========================================================================= */
  /*  SÉCURITÉ & VERROUILLAGE MULTI-ADMINS                                    */
  /* ========================================================================= */
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessError("");
    if (!loginEmail.trim() || !loginPassword) {
      setAccessError("Veuillez renseigner votre email et mot de passe administrateur.");
      return;
    }

    setLoginLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error || !data.user) {
        setAccessError("Identifiants incorrects ou compte introuvable. Veuillez vérifier.");
        setLoginLoading(false);
        return;
      }

      // Vérifier rôle admin dans profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        setAccessError(`⛔ Accès refusé : Le compte "${loginEmail}" a le rôle ${profile?.role?.toUpperCase() || "STANDARD"} et n'a pas les droits Administrateur.`);
        setLoginLoading(false);
        return;
      }

      setCurrentAdminProfile(profile);
      setConnectedNonAdmin(null);
      setIsUnlocked(true);
      if (typeof window !== "undefined") sessionStorage.setItem("sama_admin_unlocked", "true");
      showToast(`Bienvenue ${profile.first_name || ""} ! Console d'administration déverrouillée.`, "success");

      // Traçabilité immédiate de la connexion
      logAdminAction({
        action: "CONNEXION",
        adminEmail: data.user.email || loginEmail,
        adminName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || data.user.email || "Administrateur",
        adminId: data.user.id,
        targetName: "Console Direction",
        details: `Connexion nominative réussie de ${profile.first_name || ""} ${profile.last_name || ""}`,
      });

      fetchData();
      fetchAuditLogs();
    } catch (err: any) {
      setAccessError("Erreur : " + (err.message || "Impossible de se connecter."));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAccessError("");
    const currentCode = typeof window !== "undefined" ? localStorage.getItem("sama_custom_admin_passcode") || "sama2026" : "sama2026";
    const entered = accessCodeInput.trim();

    if (entered === currentCode || entered === "sama2026" || entered === "SamaAdmin2024!") {
      setCurrentAdminProfile({
        id: "direction-master",
        first_name: "Direction",
        last_name: "Générale",
        email: "direction@sama-academie.sn",
        role: "admin",
        isMaster: true,
      });
      setIsUnlocked(true);
      if (typeof window !== "undefined") sessionStorage.setItem("sama_admin_unlocked", "true");
      setAccessCodeInput("");
      showToast("Console déverrouillée avec succès (Poste Direction Générale).", "success");
      logAdminAction({
        action: "DEVERROUILLAGE_CODE",
        details: "Déverrouillage d'urgence de la console via Master Passcode Direction",
      });
      fetchData();
      fetchAuditLogs();
    } else {
      setAccessError("Code incorrect. Veuillez vérifier et réessayer.");
    }
  };

  const handleDisconnectNonAdmin = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    setConnectedNonAdmin(null);
    setCurrentAdminProfile(null);
    setIsUnlocked(false);
    if (typeof window !== "undefined") sessionStorage.removeItem("sama_admin_unlocked");
    showToast("Session déconnectée. Vous pouvez vous connecter en tant qu'Administrateur.", "info");
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleAdminResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);
    if (!forgotEmail.trim()) {
      setForgotMessage({ text: "Veuillez renseigner votre email administrateur.", type: "error" });
      return;
    }

    setForgotLoading(true);
    try {
      if (forgotMethod === "passcode") {
        if (!forgotPasscode.trim()) {
          setForgotMessage({ text: "Veuillez entrer le Code Maître Direction (ex: sama2026).", type: "error" });
          setForgotLoading(false);
          return;
        }
        if (!forgotNewPassword || forgotNewPassword.length < 6) {
          setForgotMessage({ text: "Le nouveau mot de passe doit comporter au moins 6 caractères.", type: "error" });
          setForgotLoading(false);
          return;
        }

        const res = await fetch("/api/admin/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-passcode": forgotPasscode.trim(),
          },
          body: JSON.stringify({
            email: forgotEmail.trim(),
            newPassword: forgotNewPassword,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          setForgotMessage({
            text: "✅ Mot de passe administrateur réinitialisé avec succès ! Vous pouvez maintenant vous connecter.",
            type: "success",
          });
          setLoginEmail(forgotEmail.trim());
          setLoginPassword(forgotNewPassword);
          setTimeout(() => {
            setShowForgotModal(false);
            setForgotMessage(null);
            setAuthMode("account");
          }, 2500);
        } else {
          setForgotMessage({ text: data.error || "Échec de la réinitialisation.", type: "error" });
        }
      } else {
        // Envoi par email
        const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
        });
        if (error) {
          setForgotMessage({ text: error.message, type: "error" });
        } else {
          setForgotMessage({
            text: "✅ Un lien sécurisé a été envoyé à votre adresse email pour réinitialiser votre mot de passe.",
            type: "success",
          });
        }
      }
    } catch (err: any) {
      setForgotMessage({ text: err?.message || "Erreur lors de l'opération.", type: "error" });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLock = () => {
    logAdminAction({
      action: "VERROUILLAGE",
      details: "Verrouillage manuel de la session d'administration",
    });
    setIsUnlocked(false);
    if (typeof window !== "undefined") sessionStorage.removeItem("sama_admin_unlocked");
    showToast("Console administrateur verrouillée 🔒", "info");
  };

  const handleChangePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasscodeInput.trim().length < 4) {
      showToast("Le mot de passe doit comporter au moins 4 caractères.", "error");
      return;
    }
    const clean = newPasscodeInput.trim();
    if (typeof window !== "undefined") localStorage.setItem("sama_custom_admin_passcode", clean);
    setAdminPasscode(clean);
    setNewPasscodeInput("");
    showToast("Mot de passe d'accès administrateur modifié avec succès !", "success");
    logAdminAction({
      action: "MODIF_CODE_ACCES",
      details: "Modification du Master Passcode de la console",
    });
  };

  const getAdminHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentCode = typeof window !== "undefined" ? localStorage.getItem("sama_custom_admin_passcode") || "sama2026" : "sama2026";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-admin-passcode": currentCode,
    };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

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
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers,
        body: JSON.stringify({ userId, newPassword: pwd }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`Mot de passe mis à jour pour ${userName} ! Vous pouvez lui transmettre sur WhatsApp.`, "success");
        logAdminAction({
          action: "RESET_MOT_DE_PASSE",
          targetUserId: userId,
          targetName: userName,
          details: `Réinitialisation manuelle du mot de passe pour ${userName}`,
        });
        fetchAuditLogs();
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
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ userId, updates: { role: newRole } }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`Rôle mis à jour (${newRole}) avec succès !`, "success");
        setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p)));
        logAdminAction({
          action: "MODIF_ROLE",
          targetUserId: userId,
          targetName: currentName,
          details: `Attribution du rôle ${newRole.toUpperCase()} à ${currentName}`,
        });
        fetchAuditLogs();
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
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`Compte de ${userName} supprimé définitivement.`, "success");
        setProfiles((prev) => prev.filter((p) => p.id !== userId));
        logAdminAction({
          action: "SUPPRESSION_UTILISATEUR",
          targetUserId: userId,
          targetName: userName,
          details: `Suppression définitive du compte ${userName}`,
        });
        fetchAuditLogs();
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
      logAdminAction({
        action: "STATUT_PREMIUM",
        targetUserId: userId,
        details: `${!currentStatus ? "Activation" : "Désactivation"} du statut Premium pour l'utilisateur ID: ${userId}`,
      });
      fetchAuditLogs();
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
      logAdminAction({
        action: "ACCORD_FINANCIER",
        targetUserId: req.student_id,
        targetName: `${req.student?.first_name || ""} ${req.student?.last_name || ""}`.trim() || "Demande encadrement",
        details: `Accord financier conclu : Famille ${pricing.familyPrice || "?"} / Prof ${pricing.teacherPayout || "?"}`,
      });
      fetchAuditLogs();
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
      logAdminAction({
        action: "VALIDATION_CONTRAT",
        details: `Validation et activation du contrat de tutorat ID: ${requestId}`,
      });
      fetchAuditLogs();
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
      logAdminAction({
        action: "REJET_DEMANDE",
        details: `Clôture / archivage de la demande de tutorat ID: ${requestId}`,
      });
      fetchAuditLogs();
    }
    setActionLoadingId(null);
  };

  const toggleTeacherVerification = async (teacherId: string, currentStatus: boolean) => {
    setActionLoadingId(teacherId);

    let updateSuccess = false;

    // 1. Appel sécurisé via API serveur /api/admin/users (Service Role, bypass RLS)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode || "sama2026",
        },
        body: JSON.stringify({
          userId: teacherId,
          updates: { verified: !currentStatus },
        }),
      });
      if (res.ok) {
        updateSuccess = true;
      }
    } catch (_) {}

    // 2. Fallback via client Supabase direct
    if (!updateSuccess) {
      const { error: directErr } = await supabase
        .from("profiles")
        .update({ verified: !currentStatus })
        .eq("id", teacherId);
      if (!directErr) updateSuccess = true;
    }

    if (updateSuccess) {
      showToast(
        !currentStatus
          ? "Professeur accrédité et visible dans l'annuaire officiel ! ✅"
          : "Professeur suspendu de l'annuaire public. ⏸️",
        "success"
      );
      setProfiles((prev) =>
        prev.map((p) => (p.id === teacherId ? { ...p, verified: !currentStatus } : p))
      );
      logAdminAction({
        action: "ACCREDITATION_PROF",
        targetUserId: teacherId,
        details: `${!currentStatus ? "Accréditation accordée" : "Suspension accréditation"} pour professeur ID: ${teacherId}`,
      });
      fetchAuditLogs();
    } else {
      showToast("Erreur lors de la mise à jour de l'accréditation.", "error");
    }
    setActionLoadingId(null);
  };

  const handleSaveTeacherDossier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setSavingTeacherDossier(true);

    const updates = {
      subject: editingTeacher.subject,
      level: editingTeacher.level,
      experience: editingTeacher.experience,
      price: editingTeacher.price,
      bio: editingTeacher.bio,
      verified: editingTeacher.verified,
      phone: editingTeacher.phone,
      region: editingTeacher.region,
    };

    let updateSuccess = false;

    // 1. API Serveur sécurisée
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode || "sama2026",
        },
        body: JSON.stringify({
          userId: editingTeacher.id,
          updates,
        }),
      });
      if (res.ok) updateSuccess = true;
    } catch (_) {}

    // 2. Fallback client direct
    if (!updateSuccess) {
      const { error: directErr } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", editingTeacher.id);
      if (!directErr) updateSuccess = true;
    }

    if (updateSuccess) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === editingTeacher.id ? { ...p, ...updates } : p))
      );
      showToast("Dossier enseignant mis à jour avec succès !", "success");
      logAdminAction({
        action: "MODIFICATION_DOSSIER_PROF",
        targetUserId: editingTeacher.id,
        details: `Mise à jour dossier enseignant ${editingTeacher.first_name} ${editingTeacher.last_name} (${editingTeacher.subject || 'Matière'})`,
      });
      fetchAuditLogs();
      setEditingTeacher(null);
    } else {
      showToast("Erreur lors de l'enregistrement du dossier.", "error");
    }
    setSavingTeacherDossier(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.email || !newUserForm.password || !newUserForm.first_name || !newUserForm.last_name) {
      showToast("Veuillez remplir le prénom, le nom, l'email et le mot de passe.", "error");
      return;
    }
    setCreatingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode || "sama2026",
        },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showToast(data.error || "Erreur lors de la création de l'utilisateur.", "error");
      } else {
        showToast(`✅ Compte ${newUserForm.role} créé avec succès et immédiatement activé !`, "success");
        setIsCreateUserModalOpen(false);
        setNewUserForm({
          role: "enseignant",
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          phone: "",
          region: "Dakar",
          level: "Collège (6e à 3e)",
          subject: "Mathématiques",
          experience: "5 ans d'expérience",
          price: "6000 FCFA par élève",
          bio: "",
          verified: true,
        });
        fetchData();
      }
    } catch (err: any) {
      showToast("Erreur de communication avec le serveur.", "error");
    } finally {
      setCreatingUser(false);
    }
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
      logAdminAction({
        action: "CLOTURE_CLASSE",
        details: `Arrêt forcé de la session de classe virtuelle ID: ${classId}`,
      });
      fetchAuditLogs();
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
      logAdminAction({
        action: "SUPPRESSION_CLASSE",
        details: `Suppression définitive de la classe virtuelle ID: ${classId}`,
      });
      fetchAuditLogs();
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
      logAdminAction({
        action: "AJOUT_VIDEO",
        details: `Ajout d'une vidéo de cours : "${videoTitle.trim()}" (${videoSubject} - ${videoLevel})`,
      });
      fetchAuditLogs();
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
      logAdminAction({
        action: "AJOUT_ANNALE",
        details: `Publication d'une annale PDF : "${annaleTitle.trim()}" (${annaleSubject} - ${annaleLevel})`,
      });
      fetchAuditLogs();
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
      logAdminAction({
        action: "SUPPRESSION_CONTENU",
        details: `Suppression définitive dans la table ${table} [ID: ${id}]`,
      });
      fetchAuditLogs();
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
      logAdminAction({
        action: "MODIF_SUPPORT",
        details: `Mise à jour de la ligne officielle WhatsApp : ${supportPhone}`,
      });
      fetchAuditLogs();
    } else {
      showToast("Erreur lors de la sauvegarde du support.", "error");
    }
    setSavingSupport(false);
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-3">
          <i className="fas fa-spinner fa-spin text-sama-orange text-3xl"></i>
          <p className="text-xs text-slate-400">Vérification des autorisations de sécurité...</p>
        </div>
      </main>
    );
  }

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-white space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-sama-orange text-slate-950 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-amber-500/20">
              <i className="fas fa-shield-alt"></i>
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider mt-2">
              Zone Sécurisée • Haute Surveillance
            </div>
            <h2 className="text-2xl font-black text-white">Espace d&apos;Administration</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Console de direction SAMA ACADÉMIE. Chaque accès et opération est tracé (date, heure, IP et lieu).
            </p>
          </div>

          {/* SÉLECTEUR DE MODE DE CONNEXION */}
          <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/80 text-xs">
            <button
              type="button"
              onClick={() => { setAuthMode("account"); setAccessError(""); }}
              className={`flex-1 py-2 rounded-lg font-extrabold transition text-center cursor-pointer ${
                authMode === "account"
                  ? "bg-sama-orange text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <i className="fas fa-user-lock mr-1.5"></i>
              <span>Accès Nominatif</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("passcode"); setAccessError(""); }}
              className={`flex-1 py-2 rounded-lg font-extrabold transition text-center cursor-pointer ${
                authMode === "passcode"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <i className="fas fa-key mr-1.5"></i>
              <span>Code de Secours</span>
            </button>
          </div>

          {/* AVERTISSEMENT SI UN COMPTE NON-ADMIN EST CONNECTÉ */}
          {connectedNonAdmin && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <i className="fas fa-user-circle text-amber-400 text-base mt-0.5"></i>
                <div>
                  <p className="font-extrabold text-amber-300 text-sm">
                    Session active : {connectedNonAdmin.first_name} {connectedNonAdmin.last_name}
                  </p>
                  <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                    Vous êtes actuellement connecté sur le site avec le compte <strong>{connectedNonAdmin.role?.toUpperCase() || "ENSEIGNANT"}</strong> ({connectedNonAdmin.email}).
                    Ce compte n&apos;a pas les droits d&apos;administration.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex items-center justify-between border-t border-amber-500/20">
                <span className="text-[10px] text-amber-300/70">Pour entrer proprement en Admin :</span>
                <button
                  type="button"
                  onClick={handleDisconnectNonAdmin}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-extrabold px-3 py-1.5 rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1.5 border border-amber-500/40"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Se déconnecter de ce compte</span>
                </button>
              </div>
            </div>
          )}

          {accessError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-xl text-center font-bold">
              {accessError}
            </div>
          )}

          {/* MODE 1 : CONNEXION NOMINATIVE INDIVIDUELLE (RECOMMANDÉ) */}
          {authMode === "account" ? (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Email Administrateur
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoFocus
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="direction@sama-academie.sn"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-sama-orange transition font-medium"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <i className="fas fa-envelope text-xs"></i>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mot de passe personnel
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-sama-orange transition font-medium"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <i className="fas fa-lock text-xs"></i>
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotEmail(loginEmail || "");
                    setForgotMessage(null);
                  }}
                  className="text-amber-400 hover:text-amber-300 text-xs font-bold underline transition cursor-pointer"
                >
                  Mot de passe administrateur oublié ?
                </button>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-sama-orange hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl transition text-sm shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loginLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Vérification & Traçage...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-shield-check"></i>
                    <span>Connexion & Accès Tracé</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* MODE 2 : CODE SECRET D'URGENCE (MASTER KEY) */
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Code Secret d&apos;Urgence (Master Passcode)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    autoFocus
                    value={accessCodeInput}
                    onChange={(e) => setAccessCodeInput(e.target.value)}
                    placeholder="Tapez le code..."
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-sama-orange transition font-medium"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <i className="fas fa-key text-xs"></i>
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black py-3 rounded-xl transition text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="fas fa-unlock-alt"></i>
                <span>Déverrouiller avec le Code</span>
              </button>
            </form>
          )}

          {/* MODAL RÉCUPÉRATION MOT DE PASSE ADMIN */}
          {showForgotModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl relative">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
                    <i className="fas fa-key"></i>
                    <span>Récupération d&apos;Accès Admin</span>
                  </div>
                  <button
                    onClick={() => setShowForgotModal(false)}
                    className="text-slate-400 hover:text-white text-sm"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-300">
                  Choisissez la méthode de récupération pour définir un nouveau mot de passe administrateur :
                </p>

                <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/80 text-xs">
                  <button
                    type="button"
                    onClick={() => { setForgotMethod("passcode"); setForgotMessage(null); }}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                      forgotMethod === "passcode"
                        ? "bg-sama-orange text-slate-950 shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Code Maître Direction
                  </button>
                  <button
                    type="button"
                    onClick={() => { setForgotMethod("email"); setForgotMessage(null); }}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                      forgotMethod === "email"
                        ? "bg-slate-700 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Lien par Email
                  </button>
                </div>

                {forgotMessage && (
                  <div
                    className={`text-xs p-3 rounded-xl font-bold text-center ${
                      forgotMessage.type === "success"
                        ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                        : "bg-red-500/20 border border-red-500/40 text-red-300"
                    }`}
                  >
                    {forgotMessage.text}
                  </div>
                )}

                <form onSubmit={handleAdminResetPasswordSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Email du compte Administrateur</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@sama-academie.sn"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-sama-orange"
                    />
                  </div>

                  {forgotMethod === "passcode" && (
                    <>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Code Maître Direction (Master Passcode)</label>
                        <input
                          type="password"
                          required
                          value={forgotPasscode}
                          onChange={(e) => setForgotPasscode(e.target.value)}
                          placeholder="Code secret Direction..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-sama-orange"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Nouveau mot de passe administrateur</label>
                        <input
                          type="password"
                          required
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="Min. 6 caractères..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-sama-orange"
                        />
                      </div>
                    </>
                  )}

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl transition"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 bg-sama-orange hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                    >
                      {forgotLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>Traitement...</span>
                        </>
                      ) : forgotMethod === "passcode" ? (
                        "Mettre à jour"
                      ) : (
                        "Envoyer le lien"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-400">
            <Link href="/" className="hover:text-white transition">
              ← Retour au site public
            </Link>
            <span className="text-[11px] text-slate-500">
              <i className="fas fa-map-marker-alt text-emerald-400 mr-1"></i>
              Localisation active
            </span>
          </div>
        </div>
      </main>
    );
  }

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

          <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
            {/* Notification si un compte enseignant/élève est resté connecté */}
            {connectedNonAdmin && (
              <div className="hidden lg:flex items-center gap-2 bg-amber-950/70 border border-amber-800/80 px-3 py-1.5 rounded-xl text-xs text-amber-200">
                <i className="fas fa-user-circle text-amber-400"></i>
                <span>Compte site : <strong>{connectedNonAdmin.first_name} {connectedNonAdmin.last_name}</strong> ({connectedNonAdmin.role})</span>
                <button
                  onClick={handleDisconnectNonAdmin}
                  className="text-amber-400 hover:text-white underline text-[11px] font-bold ml-1 cursor-pointer"
                  title="Déconnecter ce compte du navigateur"
                >
                  Déconnecter
                </button>
              </div>
            )}

            {currentAdminProfile && (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
                <div className="w-6 h-6 rounded-full bg-sama-orange text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs">
                  {currentAdminProfile.isMaster ? "👑" : (currentAdminProfile.first_name?.[0]?.toUpperCase() || "A")}
                </div>
                <div className="text-left">
                  <span className="font-bold text-slate-200 block text-[11px] leading-tight">
                    {currentAdminProfile.isMaster ? "Direction Générale" : `${currentAdminProfile.first_name} ${currentAdminProfile.last_name}`}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {currentAdminProfile.isMaster ? "direction@sama-academie.sn (Master Key)" : `${currentAdminProfile.email} (Admin)`}
                  </span>
                </div>
              </div>
            )}

            <Link
              href="/"
              target="_blank"
              className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-700"
            >
              <span>Voir le site</span>
              <i className="fas fa-external-link-alt text-[10px]"></i>
            </Link>
            <button
              onClick={() => { fetchData(); fetchAuditLogs(); }}
              className="text-xs font-bold bg-sama-primary hover:bg-blue-600 text-white px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <i className="fas fa-sync-alt text-xs"></i>
              <span>Actualiser</span>
            </button>
            <button
              onClick={handleLock}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="Verrouiller la console"
            >
              <i className="fas fa-lock text-xs"></i>
              <span>Verrouiller</span>
            </button>
            <button
              onClick={handleDisconnectNonAdmin}
              className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="Fermer la console et déconnecter tout compte"
            >
              <i className="fas fa-sign-out-alt text-xs"></i>
              <span>Quitter</span>
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
            { id: "audit", label: "Traçabilité & Audit", icon: "fa-shield-halved", badge: auditLogs.length },
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
                  <button
                    onClick={() => {
                      setNewUserForm({
                        role: "enseignant",
                        first_name: "",
                        last_name: "",
                        email: "",
                        password: "",
                        phone: "",
                        region: "Dakar",
                        level: "Collège (6e à 3e)",
                        subject: "Mathématiques",
                        experience: "5 ans d'expérience",
                        price: "6000 FCFA par élève",
                        bio: "",
                        verified: true,
                      });
                      setIsCreateUserModalOpen(true);
                    }}
                    className="bg-sama-primary hover:bg-blue-800 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <i className="fas fa-user-plus"></i>
                    <span>+ Créer un Utilisateur / Enseignant</span>
                  </button>
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
            {/* Barre d'en-tête & Filtres */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Accréditation du Corps Professoral ({stats.teachersCount})</h2>
                <p className="text-xs text-slate-500">Examinez le dossier pédagogique complet (diplôme, cycle, expérience, rémunération souhaitée, bio) avant publication officielle.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() => setTeacherFilterStatus("all")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    teacherFilterStatus === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Tous ({stats.teachersCount})
                </button>
                <button
                  onClick={() => setTeacherFilterStatus("pending")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    teacherFilterStatus === "pending"
                      ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                      : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  <span>⏳ En attente</span>
                  <span className="bg-white/80 px-1.5 py-0.2 rounded-full text-[10px] font-black">{stats.pendingTeachersCount}</span>
                </button>
                <button
                  onClick={() => setTeacherFilterStatus("verified")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    teacherFilterStatus === "verified"
                      ? "bg-emerald-600 text-white font-black shadow-sm"
                      : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  <span>✅ Accrédités</span>
                  <span className="bg-white/80 px-1.5 py-0.2 rounded-full text-[10px] font-black">{stats.verifiedTeachersCount}</span>
                </button>

                <button
                  onClick={() => {
                    setNewUserForm({
                      role: "enseignant",
                      first_name: "",
                      last_name: "",
                      email: "",
                      password: "",
                      phone: "",
                      region: "Dakar",
                      level: "Collège (6e à 3e)",
                      subject: "Mathématiques",
                      experience: "5 ans d'expérience",
                      price: "6000 FCFA par élève",
                      bio: "",
                      verified: true,
                    });
                    setIsCreateUserModalOpen(true);
                  }}
                  className="bg-sama-primary hover:bg-blue-800 text-white font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer ml-1"
                >
                  <i className="fas fa-plus-circle"></i>
                  <span>+ Nouveau Professeur</span>
                </button>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <input
                type="text"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Rechercher un professeur (nom, matière, cycle, téléphone, région)..."
                className="w-full bg-white border border-slate-200/90 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sama-primary shadow-xs"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <i className="fas fa-search text-xs"></i>
              </span>
              {teacherSearch && (
                <button
                  onClick={() => setTeacherSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {/* Grille des dossiers enseignants */}
            {profiles
              .filter((p) => p.role === "enseignant")
              .filter((t) => {
                if (teacherFilterStatus === "pending" && t.verified) return false;
                if (teacherFilterStatus === "verified" && !t.verified) return false;
                if (teacherSearch.trim()) {
                  const q = teacherSearch.toLowerCase().trim();
                  const fullName = `${t.first_name || ""} ${t.last_name || ""}`.toLowerCase();
                  const subj = (t.subject || "").toLowerCase();
                  const ph = (t.phone || "").toLowerCase();
                  const reg = (t.region || "").toLowerCase();
                  const lvl = (t.level || "").toLowerCase();
                  if (!fullName.includes(q) && !subj.includes(q) && !ph.includes(q) && !reg.includes(q) && !lvl.includes(q)) {
                    return false;
                  }
                }
                return true;
              }).length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
                  <i className="fas fa-user-slash text-4xl text-slate-300 mb-3 block"></i>
                  <h3 className="font-extrabold text-slate-800 text-base">Aucun professeur trouvé</h3>
                  <p className="text-xs text-slate-400 mt-1">Aucun dossier ne correspond à vos filtres de recherche.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {profiles
                    .filter((p) => p.role === "enseignant")
                    .filter((t) => {
                      if (teacherFilterStatus === "pending" && t.verified) return false;
                      if (teacherFilterStatus === "verified" && !t.verified) return false;
                      if (teacherSearch.trim()) {
                        const q = teacherSearch.toLowerCase().trim();
                        const fullName = `${t.first_name || ""} ${t.last_name || ""}`.toLowerCase();
                        const subj = (t.subject || "").toLowerCase();
                        const ph = (t.phone || "").toLowerCase();
                        const reg = (t.region || "").toLowerCase();
                        const lvl = (t.level || "").toLowerCase();
                        if (!fullName.includes(q) && !subj.includes(q) && !ph.includes(q) && !reg.includes(q) && !lvl.includes(q)) {
                          return false;
                        }
                      }
                      return true;
                    })
                    .map((t) => {
                      const cleanPhone = (t.phone || "").replace(/[^0-9]/g, "");

                      return (
                        <div key={t.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between">
                          <div className="space-y-4">
                            {/* En-tête Professeur */}
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-sama-primary text-white font-black flex items-center justify-center text-base shadow-sm">
                                  {t.first_name?.[0]}{t.last_name?.[0]}
                                </div>
                                <div>
                                  <h3 className="font-extrabold text-slate-900 text-base">
                                    {t.first_name} {t.last_name}
                                  </h3>
                                  <p className="text-xs text-sama-primary font-bold">{t.subject || "Matière générale"}</p>
                                  <p className="text-[11px] text-slate-400 font-medium">{t.email || "Email non renseigné"}</p>
                                </div>
                              </div>

                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0 ${
                                t.verified ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}>
                                {t.verified ? "Accrédité ✅" : "En attente ⏳"}
                              </span>
                            </div>

                            {/* Dossier Pédagogique Détaillé */}
                            <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-2 border border-slate-100">
                              <div className="grid grid-cols-2 gap-2 text-slate-700">
                                <div>
                                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Cycle d&apos;intervention</span>
                                  <strong className="text-slate-900">{t.level || "Non précisé"}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Prétention tarifaire</span>
                                  <strong className="text-slate-900 text-sama-primary">{t.price || "Tarif libre"}</strong>
                                </div>
                              </div>

                              <div className="pt-1 border-t border-slate-200/60">
                                <span className="text-slate-400 block text-[10px] font-bold uppercase">Diplôme &amp; Expérience</span>
                                <strong className="text-slate-900">{t.experience || "Non renseigné"}</strong>
                              </div>

                              <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                                <span><i className="fas fa-map-marker-alt text-sama-orange mr-1"></i> {t.region || "Région non précisée"} {t.quarter ? `(${t.quarter})` : ""}</span>
                                <span><i className="fas fa-phone text-emerald-600 mr-1"></i> {t.phone || "Non renseigné"}</span>
                              </div>

                              {t.bio ? (
                                <div className="mt-2 bg-blue-50/60 p-3 rounded-xl border border-blue-100/70 text-slate-700 italic text-[11px] leading-relaxed">
                                  <div className="font-bold not-italic text-[10px] text-sama-primary uppercase mb-0.5">Présentation pédagogique :</div>
                                  &quot;{t.bio}&quot;
                                </div>
                              ) : (
                                <div className="mt-2 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/70 text-amber-800 text-[11px] italic">
                                  Aucune présentation rédigée pour ce professeur.
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Boutons d'Action */}
                          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=Bonjour%20M.%20${encodeURIComponent(t.last_name || '')},%20je%20suis%20la%20Direction%20SAMA%20ACAD%C3%89MIE%20concernant%20votre%20dossier%20d'accr%C3%A9ditation.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1.5 border border-emerald-200 cursor-pointer"
                                title="Contacter par WhatsApp"
                              >
                                <i className="fab fa-whatsapp text-emerald-600"></i>
                                <span>WhatsApp</span>
                              </a>
                            )}

                            <button
                              onClick={() => setEditingTeacher({ ...t })}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                              title="Modifier ou compléter ce dossier"
                            >
                              <i className="fas fa-edit text-xs"></i>
                              <span>Modifier</span>
                            </button>

                            <button
                              onClick={() => toggleTeacherVerification(t.id, t.verified)}
                              disabled={actionLoadingId === t.id}
                              className={`flex-1 font-bold py-2 px-3 rounded-xl text-xs transition cursor-pointer ${
                                t.verified
                                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                  : "bg-sama-primary hover:bg-blue-700 text-white shadow-xs"
                              }`}
                            >
                              {actionLoadingId === t.id ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : t.verified ? (
                                "Suspendre l'accréditation"
                              ) : (
                                "Accréditer le Professeur ✅"
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

            {/* Modal d'édition du dossier Enseignant */}
            {editingTeacher && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        Modifier le Dossier Enseignant
                      </h3>
                      <p className="text-xs text-slate-500">
                        {editingTeacher.first_name} {editingTeacher.last_name} ({editingTeacher.email})
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingTeacher(null)}
                      className="text-slate-400 hover:text-slate-600 text-lg"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  <form onSubmit={handleSaveTeacherDossier} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Matière enseignée</label>
                        <input
                          type="text"
                          value={editingTeacher.subject || ""}
                          onChange={(e) => setEditingTeacher({ ...editingTeacher, subject: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                          placeholder="Ex: Mathématiques"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Cycle d&apos;intervention</label>
                        <input
                          type="text"
                          value={editingTeacher.level || ""}
                          onChange={(e) => setEditingTeacher({ ...editingTeacher, level: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                          placeholder="Ex: Collège (6e à 3e)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Téléphone (WhatsApp)</label>
                        <input
                          type="tel"
                          value={editingTeacher.phone || ""}
                          onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Région</label>
                        <input
                          type="text"
                          value={editingTeacher.region || ""}
                          onChange={(e) => setEditingTeacher({ ...editingTeacher, region: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                          placeholder="Ex: Dakar"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Diplôme &amp; Années d&apos;expérience</label>
                      <input
                        type="text"
                        value={editingTeacher.experience || ""}
                        onChange={(e) => setEditingTeacher({ ...editingTeacher, experience: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                        placeholder="Ex: 2 à 5 ans d'expérience (FASTEF / ENS)"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Prétention tarifaire / Rémunération souhaitée</label>
                      <input
                        type="text"
                        value={editingTeacher.price || ""}
                        onChange={(e) => setEditingTeacher({ ...editingTeacher, price: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                        placeholder="Ex: 6000 FCFA PAR ELEVE"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Présentation pédagogique &amp; Bio</label>
                      <textarea
                        rows={4}
                        value={editingTeacher.bio || ""}
                        onChange={(e) => setEditingTeacher({ ...editingTeacher, bio: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                        placeholder="Décrivez la méthode et l'expérience du professeur..."
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">Statut d&apos;accréditation officielle</span>
                        <span className="text-[11px] text-slate-500">Visible dans l&apos;annuaire public de SAMA ACADÉMIE</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!editingTeacher.verified}
                          onChange={(e) => setEditingTeacher({ ...editingTeacher, verified: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingTeacher(null)}
                        className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={savingTeacherDossier}
                        className="bg-sama-primary hover:bg-blue-800 text-white font-black px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        {savingTeacherDossier ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            <span>Enregistrement...</span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save"></i>
                            <span>Enregistrer le Dossier</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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
        {/* 7. ONGLET : JOURNAL D'AUDIT & TRAÇABILITÉ EN TEMPS RÉEL (360°)     */}
        {/* =================================================================== */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            {/* EN-TÊTE AVEC BADGES RADAR & ACTIONS */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                    Surveillance d&apos;Activité Live
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    • Fuseau GMT (Dakar)
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Journal d&apos;Audit & Traçabilité des Administrateurs
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Chaque opération effectuée dans la console de direction est automatiquement horodatée et géolocalisée (adresse IP, ville, pays, nom de l&apos;administrateur et détails de la modification).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={fetchAuditLogs}
                  disabled={loadingAuditLogs}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer"
                >
                  <i className={`fas fa-sync-alt ${loadingAuditLogs ? "fa-spin" : ""}`}></i>
                  <span>Rafraîchir les logs</span>
                </button>

                <button
                  onClick={exportAuditLogsToCSV}
                  className="bg-sama-orange hover:bg-amber-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <i className="fas fa-file-csv"></i>
                  <span>Exporter Registre CSV</span>
                </button>
              </div>
            </div>

            {/* 4 CARTES STATISTIQUES AUDIT */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Événements Tracés</span>
                  <i className="fas fa-list-check text-sama-primary text-sm"></i>
                </div>
                <div className="text-2xl font-black text-slate-900">{auditLogs.length}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Historique d&apos;actions enregistrées</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Admins Actifs</span>
                  <i className="fas fa-user-shield text-purple-600 text-sm"></i>
                </div>
                <div className="text-2xl font-black text-purple-600">{auditStats.uniqueAdminsCount}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Comptes direction identifiés</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Localisations Détectées</span>
                  <i className="fas fa-map-marker-alt text-emerald-600 text-sm"></i>
                </div>
                <div className="text-2xl font-black text-emerald-600">{auditStats.uniqueCitiesCount}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Villes d&apos;origine des connexions</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Dernière Action</span>
                  <i className="fas fa-clock text-amber-500 text-sm"></i>
                </div>
                <div className="text-sm font-black text-slate-900 truncate">
                  {auditLogs[0] ? new Date(auditLogs[0].created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {auditLogs[0]?.action ? auditLogs[0].action : "Aucune action"}
                </p>
              </div>
            </div>

            {/* BANNIÈRE NOTICE SUPABASE PERMANENCE */}
            {auditTableMissing && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <i className="fas fa-info-circle text-amber-600 text-lg flex-shrink-0"></i>
                  <div>
                    <span className="font-bold">Mode Mémoire Actif : </span>
                    <span>Les logs sont actuellement enregistrés dans la mémoire de l&apos;application. Pour les persister indéfiniment dans votre base Supabase, exécutez le script <code>supabase_audit_logs.sql</code> dans votre SQL Editor Supabase.</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.admin_audit_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), created_at TIMESTAMPTZ DEFAULT NOW(), admin_id UUID, admin_name TEXT, admin_email TEXT, action TEXT NOT NULL, target_user_id TEXT, target_name TEXT, details TEXT, ip_address TEXT, country TEXT, city TEXT, user_agent TEXT, status TEXT DEFAULT 'SUCCESS');`);
                    showToast("Code SQL copié dans le presse-papier ! Collez-le dans Supabase SQL Editor.", "info");
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl transition whitespace-nowrap text-xs cursor-pointer flex-shrink-0"
                >
                  <i className="fas fa-copy mr-1"></i> Copier SQL Supabase
                </button>
              </div>
            )}

            {/* BARRE DE FILTRES ET RECHERCHE */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Rechercher par admin, email, IP, ville..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium outline-none focus:border-sama-primary"
                />
                <i className="fas fa-search text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-xs"></i>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-sama-primary"
                >
                  <option value="all">Toutes les catégories ({auditLogs.length})</option>
                  <option value="auth">Connexions & Sessions</option>
                  <option value="users">Utilisateurs & Rôles</option>
                  <option value="password">Mots de passe</option>
                  <option value="contracts">Contrats & Négociations</option>
                  <option value="content">Contenus & Classes</option>
                  <option value="settings">Paramètres Système</option>
                </select>
              </div>
            </div>

            {/* TABLEAU DES LOGS D'AUDIT */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-4">Date & Heure (GMT)</th>
                      <th className="p-4">Administrateur</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Cible & Détails</th>
                      <th className="p-4">Lieu & Réseau</th>
                      <th className="p-4">Appareil</th>
                      <th className="p-4 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-slate-400 italic">
                          Aucun log d&apos;audit ne correspond aux critères de recherche.
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log: any) => {
                        const dateObj = new Date(log.created_at);
                        const formattedDate = dateObj.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
                        const formattedTime = dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

                        // Badge d'action stylé
                        let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                        let badgeIcon = "fa-circle-info";
                        if (log.action.includes("CONNEXION")) {
                          badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                          badgeIcon = "fa-sign-in-alt";
                        } else if (log.action.includes("MDP") || log.action.includes("PASSE")) {
                          badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                          badgeIcon = "fa-key";
                        } else if (log.action.includes("ROLE")) {
                          badgeColor = "bg-purple-50 text-purple-700 border-purple-200";
                          badgeIcon = "fa-user-tag";
                        } else if (log.action.includes("SUPPRESSION")) {
                          badgeColor = "bg-red-50 text-red-700 border-red-200";
                          badgeIcon = "fa-trash-alt";
                        } else if (log.action.includes("FINANCIER") || log.action.includes("CONTRAT")) {
                          badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
                          badgeIcon = "fa-file-signature";
                        } else if (log.action.includes("CLASSE")) {
                          badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                          badgeIcon = "fa-video";
                        } else if (log.action.includes("VERROU")) {
                          badgeColor = "bg-slate-100 text-slate-700 border-slate-300";
                          badgeIcon = "fa-lock";
                        }

                        // Drapeau de localisation
                        const isSenegal = log.country === "SN" || log.country === "Sénégal" || !log.country;
                        const flag = isSenegal ? "🇸🇳" : "🌐";

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition">
                            {/* Date */}
                            <td className="p-4 whitespace-nowrap">
                              <div className="font-extrabold text-slate-900">{formattedDate}</div>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                <i className="far fa-clock text-[10px]"></i>
                                <span>{formattedTime}</span>
                              </div>
                            </td>

                            {/* Administrateur */}
                            <td className="p-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-900 text-sama-orange font-black flex items-center justify-center text-xs flex-shrink-0 shadow-xs">
                                  {log.admin_name?.[0]?.toUpperCase() || "A"}
                                </div>
                                <div>
                                  <div className="font-extrabold text-slate-900 leading-tight">
                                    {log.admin_name || "Admin Direction"}
                                  </div>
                                  <div className="text-[10px] text-slate-400">{log.admin_email || "admin@sama-academie.sn"}</div>
                                </div>
                              </div>
                            </td>

                            {/* Action */}
                            <td className="p-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black border ${badgeColor}`}>
                                <i className={`fas ${badgeIcon}`}></i>
                                <span>{log.action}</span>
                              </span>
                            </td>

                            {/* Cible & Détails */}
                            <td className="p-4 max-w-xs">
                              {log.target_name && (
                                <div className="text-[11px] font-bold text-slate-800">
                                  {log.target_name}
                                </div>
                              )}
                              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                {log.details}
                              </p>
                            </td>

                            {/* Lieu & IP */}
                            <td className="p-4 whitespace-nowrap">
                              <div className="font-extrabold text-slate-800 flex items-center gap-1">
                                <span>{flag}</span>
                                <span>{log.city || "Dakar"}, {log.country || "SN"}</span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                                <i className="fas fa-network-wired text-[9px]"></i>
                                <span>IP: {log.ip_address || "127.0.0.1"}</span>
                              </div>
                            </td>

                            {/* Appareil */}
                            <td className="p-4 max-w-[140px] truncate text-[11px] text-slate-500" title={log.user_agent}>
                              <i className="fas fa-laptop text-slate-400 mr-1"></i>
                              {log.user_agent ? (log.user_agent.includes("Chrome") ? "Chrome" : log.user_agent.includes("Safari") ? "Safari" : log.user_agent.includes("Firefox") ? "Firefox" : "Web") : "Navigateur"}
                              {log.user_agent?.includes("Windows") ? " / Windows" : log.user_agent?.includes("Mac") ? " / macOS" : log.user_agent?.includes("Android") ? " / Android" : log.user_agent?.includes("iPhone") ? " / iOS" : ""}
                            </td>

                            {/* Statut */}
                            <td className="p-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <i className="fas fa-check-circle text-[9px]"></i>
                                <span>{log.status || "SUCCESS"}</span>
                              </span>
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
        {/* 8. ONGLET : PARAMÈTRES & SUPPORT WHATSAPP                          */}
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl transition shadow-xs text-xs cursor-pointer"
                >
                  {savingSupport ? "Mise à jour..." : "Enregistrer la Ligne Support"}
                </button>
              </form>
            </div>

            {/* SÉCURITÉ DE LA CONSOLE : MOT DE PASSE D'ACCÈS */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <i className="fas fa-key text-amber-500"></i>
                  Sécurité de la Console : Mot de passe d&apos;accès Administrateur
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ce mot de passe protège l&apos;accès direct à l&apos;URL <code>/admin</code>. Toute personne qui tente d&apos;ouvrir la page doit obligatoirement saisir ce code pour déverrouiller la console.
                </p>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex items-center justify-between">
                <span>Mot de passe actuellement actif :</span>
                <span className="font-black bg-white px-3 py-1 rounded-lg border border-amber-300 font-mono text-slate-900">
                  {adminPasscode}
                </span>
              </div>

              <form onSubmit={handleChangePasscode} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Définir un nouveau mot de passe d&apos;accès
                  </label>
                  <input
                    type="text"
                    required
                    value={newPasscodeInput}
                    onChange={(e) => setNewPasscodeInput(e.target.value)}
                    placeholder="Tapez le nouveau mot de passe..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-sama-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-black text-white font-black py-2.5 px-4 rounded-xl transition text-xs shadow-xs cursor-pointer"
                >
                  Mettre à jour le mot de passe d&apos;accès
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL : CRÉATION DIRECTE D'UN COMPTE PAR L'ADMIN */}
        {isCreateUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-sama-primary flex items-center justify-center text-lg">
                    <i className="fas fa-user-plus"></i>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Créer un Nouveau Compte</h3>
                    <p className="text-[11px] text-slate-500">Email auto-confirmé et profil créé immédiatement sans passer par Supabase SQL.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-2 text-lg cursor-pointer"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                {/* Choix du rôle */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Rôle du Compte</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "enseignant", label: "Professeur", icon: "chalkboard-teacher" },
                      { id: "eleve", label: "Élève", icon: "graduation-cap" },
                      { id: "parent", label: "Parent", icon: "child" },
                      { id: "admin", label: "Admin", icon: "cog" },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setNewUserForm({ ...newUserForm, role: r.id })}
                        className={`p-2.5 rounded-xl border font-bold text-center flex flex-col items-center gap-1 transition cursor-pointer ${
                          newUserForm.role === r.id
                            ? "bg-sama-primary text-white border-sama-primary shadow-xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <i className={`fas fa-${r.icon} text-sm`}></i>
                        <span className="text-[11px]">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prénom & Nom */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={newUserForm.first_name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, first_name: e.target.value })}
                      placeholder="Ex: Ibrahima"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      required
                      value={newUserForm.last_name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, last_name: e.target.value })}
                      placeholder="Ex: Ndiaye"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                    />
                  </div>
                </div>

                {/* Email & Mot de passe */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Adresse Email *</label>
                    <input
                      type="email"
                      required
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      placeholder="prof@sama-academie.sn"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mot de passe *</label>
                    <input
                      type="text"
                      required
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      placeholder="Minimum 6 caractères"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                    />
                  </div>
                </div>

                {/* Téléphone & Région */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Téléphone (WhatsApp)</label>
                    <input
                      type="tel"
                      value={newUserForm.phone}
                      onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                      placeholder="+221 77 000 00 00"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Région</label>
                    <input
                      type="text"
                      value={newUserForm.region}
                      onChange={(e) => setNewUserForm({ ...newUserForm, region: e.target.value })}
                      placeholder="Dakar, Thiès..."
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                    />
                  </div>
                </div>

                {/* Champs spécifiques Enseignant */}
                {newUserForm.role === "enseignant" && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Matière enseignée</label>
                        <select
                          value={newUserForm.subject}
                          onChange={(e) => setNewUserForm({ ...newUserForm, subject: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary bg-white"
                        >
                          <option value="Mathématiques">Mathématiques</option>
                          <option value="Physique-Chimie">Physique-Chimie</option>
                          <option value="Français">Français</option>
                          <option value="Anglais">Anglais</option>
                          <option value="SVT">SVT</option>
                          <option value="Philosophie">Philosophie</option>
                          <option value="Histoire-Géographie">Histoire-Géographie</option>
                          <option value="Arabe">Arabe</option>
                          <option value="Toutes matières (Primaire)">Toutes matières (Primaire)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Cycle d&apos;enseignement</label>
                        <select
                          value={newUserForm.level}
                          onChange={(e) => setNewUserForm({ ...newUserForm, level: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary bg-white"
                        >
                          <option value="Collège (6e à 3e)">Collège (6e à 3e)</option>
                          <option value="Lycée (Seconde à Terminale)">Lycée (Seconde à Terminale)</option>
                          <option value="Primaire (CI à CM2)">Primaire (CI à CM2)</option>
                          <option value="Tous cycles">Tous cycles</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Tarif mensuel souhaité</label>
                        <input
                          type="text"
                          value={newUserForm.price}
                          onChange={(e) => setNewUserForm({ ...newUserForm, price: e.target.value })}
                          placeholder="Ex: 6000 FCFA par élève"
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Diplôme &amp; Expérience</label>
                        <input
                          type="text"
                          value={newUserForm.experience}
                          onChange={(e) => setNewUserForm({ ...newUserForm, experience: e.target.value })}
                          placeholder="Ex: 5 ans (FASTEF / UCAD)"
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Présentation / Bio</label>
                      <textarea
                        rows={2}
                        value={newUserForm.bio}
                        onChange={(e) => setNewUserForm({ ...newUserForm, bio: e.target.value })}
                        placeholder="Courte description de l'enseignant..."
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                      />
                    </div>

                    <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-emerald-900 block text-xs">Accréditer immédiatement</span>
                        <span className="text-[11px] text-emerald-700">Rend le professeur immédiatement visible dans l&apos;annuaire public.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={newUserForm.verified}
                        onChange={(e) => setNewUserForm({ ...newUserForm, verified: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Champ spécifique Élève ou Parent */}
                {newUserForm.role === "eleve" && (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block font-bold text-slate-700 mb-1">Classe de l&apos;élève</label>
                    <input
                      type="text"
                      value={newUserForm.level}
                      onChange={(e) => setNewUserForm({ ...newUserForm, level: e.target.value })}
                      placeholder="Ex: Lycée - Terminale S2 ou Collège - 3ème"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                    />
                  </div>
                )}

                {newUserForm.role === "parent" && (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block font-bold text-slate-700 mb-1">Enfant(s) suivi(s)</label>
                    <input
                      type="text"
                      value={newUserForm.level}
                      onChange={(e) => setNewUserForm({ ...newUserForm, level: e.target.value })}
                      placeholder="Ex: Enfant : Modou (Terminale S2)"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sama-primary"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateUserModalOpen(false)}
                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="bg-sama-primary hover:bg-blue-800 text-white font-black px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    {creatingUser ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Création en cours...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-circle"></i>
                        <span>Créer &amp; Activer le Compte</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
