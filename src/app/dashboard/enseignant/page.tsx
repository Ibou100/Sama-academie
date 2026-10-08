"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getClientSessionAndRole, safeRedirect } from "@/lib/auth-helpers";

export default function DashboardEnseignant() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"eleves" | "devoirs" | "videos" | "webinaires" | "progres" | "chat">("eleves");

  // Notifications / feedback
  const [toastMsg, setToastMsg] = useState("");

  // État Devoir / Document
  const [docStudentId, setDocStudentId] = useState("");
  const [docType, setDocType] = useState("Devoir à la maison");
  const [docTitle, setDocTitle] = useState("");
  const [docDueDate, setDocDueDate] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [sendingDoc, setSendingDoc] = useState(false);

  // État Vidéo
  const [videoTitle, setVideoTitle] = useState("");
  const [videoSubject, setVideoSubject] = useState("");
  const [videoLevel, setVideoLevel] = useState("Terminale S2");
  const [videoDuration, setVideoDuration] = useState("25 min");
  const [videoUrl, setVideoUrl] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);
  const [myVideos, setMyVideos] = useState<any[]>([]);

  // État Webinaires / Classes Virtuelles
  const [webinarTitle, setWebinarTitle] = useState("");
  const [webinarSubject, setWebinarSubject] = useState("");
  const [webinarLevel, setWebinarLevel] = useState("Terminale S2");
  const [webinarDate, setWebinarDate] = useState("");
  const [webinarTime, setWebinarTime] = useState("");
  const [webinarDesc, setWebinarDesc] = useState("");
  const [creatingWebinar, setCreatingWebinar] = useState(false);
  const [myWebinars, setMyWebinars] = useState<any[]>([]);

  // État Évaluation / Progrès pour l'élève et le parent
  const [evalStudentId, setEvalStudentId] = useState("");
  const [evalChapter, setEvalChapter] = useState("");
  const [evalComprehension, setEvalComprehension] = useState("Très bonne assimilation");
  const [evalScore, setEvalScore] = useState("85");
  const [evalAttendance, setEvalAttendance] = useState("Présent & Ponctuel");
  const [evalComment, setEvalComment] = useState("");
  const [sendingEval, setSendingEval] = useState(false);

  // État Messagerie & Annonces
  const [selectedStudentForChat, setSelectedStudentForChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [sendingChatMessage, setSendingChatMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  useEffect(() => {
    // Timeout de sécurité : empêche tout blocage infini du spinner
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 3500);

    fetchTeacherData();

    return () => clearTimeout(safetyTimer);
  }, []);

  const fetchTeacherData = async () => {
    try {
      const { user, role, profile } = await getClientSessionAndRole(3000);

      if (!user) {
        setLoading(false);
        safeRedirect("/login", router);
        return;
      }

      if (role === "eleve") {
        setLoading(false);
        safeRedirect("/dashboard/eleve", router);
        return;
      } else if (role === "parent") {
        setLoading(false);
        safeRedirect("/dashboard/parent", router);
        return;
      } else if (role === "admin") {
        setLoading(false);
        safeRedirect("/admin", router);
        return;
      }

      const safeProfile = profile || {
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || "Enseignant",
        last_name: user.user_metadata?.last_name || "",
        role: "enseignant",
        subject: user.user_metadata?.subject || "Mathématiques",
        level: user.user_metadata?.level || "Lycée",
        phone: user.user_metadata?.phone || "",
        region: user.user_metadata?.region || "Dakar",
        verified: true,
      };

      setCurrentUser(safeProfile);
      setVideoSubject(safeProfile.subject || "Mathématiques");
      setWebinarSubject(safeProfile.subject || "Mathématiques");

      // 1. RÈGLE D'OR SAMA ACADÉMIE : Récupérer UNIQUEMENT les élèves assignés et validés par l'administration
      let requests = null;
      try {
        const { data: reqsWithProfiles, error: joinErr } = await supabase
          .from("tutoring_requests")
          .select(`*, student:profiles!student_id(id, first_name, last_name, email, phone, region, level, avatar_url)`)
          .eq("teacher_id", user.id)
          .eq("status", "accepted")
          .order("created_at", { ascending: false });
        
        if (!joinErr && reqsWithProfiles) {
          requests = reqsWithProfiles;
        }
      } catch (_) {}

      if (!requests) {
        try {
          const { data: simpleReqs } = await supabase
            .from("tutoring_requests")
            .select("*")
            .eq("teacher_id", user.id)
            .eq("status", "accepted")
            .order("created_at", { ascending: false });
          requests = simpleReqs || [];
        } catch (_) {}
      }

      if (requests && requests.length > 0) {
        setAssignedStudents(requests);
        setDocStudentId(requests[0].id);
        setEvalStudentId(requests[0].id);
        setSelectedStudentForChat(requests[0]);
      }

      // 2. Récupérer les classes virtuelles de cet enseignant
      const { data: webinars } = await supabase
        .from("virtual_classes")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (webinars) setMyWebinars(webinars);

      // 3. Récupérer les vidéos récentes
      const { data: vids } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (vids) setMyVideos(vids);
    } catch (err) {
      console.error("Erreur chargement Espace Enseignant:", err);
    } finally {
      setLoading(false);
    }
  };

  // Chargement des messages pour la discussion active
  useEffect(() => {
    let channel: any = null;
    if (selectedStudentForChat) {
      const loadMessages = async () => {
        const { data } = await supabase
          .from("tutoring_messages")
          .select("*")
          .eq("request_id", selectedStudentForChat.id)
          .order("created_at", { ascending: true });

        if (data) setChatMessages(data);

        channel = supabase
          .channel(`teacher_chat_${selectedStudentForChat.id}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "tutoring_messages", filter: `request_id=eq.${selectedStudentForChat.id}` },
            (payload) => {
              setChatMessages((prev) => [...prev, payload.new]);
            }
          )
          .subscribe();
      };
      loadMessages();
    }
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [selectedStudentForChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // 1. Envoyer un cours / devoir
  const handleSendDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docStudentId) return;
    setSendingDoc(true);

    const docContent = `[SAMA_DOC] ${docType}: ${docTitle.trim()} | Date limite: ${docDueDate || "Non spécifiée"} | Consignes: ${docDescription.trim() || "Consultez les exercices ci-joints."}`;

    const { error } = await supabase.from("tutoring_messages").insert([{
      request_id: docStudentId,
      sender_id: currentUser.id,
      content: docContent
    }]);

    if (!error) {
      showToast("✅ Cours / Devoir transmis avec succès à l'élève !");
      setDocTitle("");
      setDocDueDate("");
      setDocDescription("");
      setActiveTab("chat");
    } else {
      showToast("❌ Erreur : " + error.message);
    }
    setSendingDoc(false);
  };

  // 2. Publier une vidéo pédagogique
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) return;
    setAddingVideo(true);

    const { data, error } = await supabase.from("videos").insert([{
      title: videoTitle.trim(),
      subject: videoSubject,
      level: videoLevel,
      duration: videoDuration || "20 min",
      video_url: videoUrl.trim() || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      is_free: false,
      thumbnail_color: "bg-blue-600"
    }]).select();

    if (!error) {
      showToast("✅ Vidéo pédagogique publiée avec succès !");
      if (data) setMyVideos((prev) => [data[0], ...prev]);
      setVideoTitle("");
      setVideoUrl("");
    } else {
      showToast("❌ Erreur lors de la publication : " + error.message);
    }
    setAddingVideo(false);
  };

  // 3. Créer un webinaire / classe virtuelle
  const handleCreateWebinar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webinarTitle.trim()) return;
    setCreatingWebinar(true);

    const meetingCode = `SAMA-${Math.floor(100000 + Math.random() * 900000)}`;
    const scheduledDateTime = webinarDate && webinarTime ? `${webinarDate}T${webinarTime}:00Z` : new Date().toISOString();

    const { data, error } = await supabase.from("virtual_classes").insert([{
      title: webinarTitle.trim(),
      description: webinarDesc.trim() || "Cours en direct avec votre enseignant certifié.",
      subject: webinarSubject,
      target_level: webinarLevel,
      teacher_id: currentUser.id,
      meeting_code: meetingCode,
      scheduled_at: scheduledDateTime,
      status: "scheduled",
      allow_student_screen_share: false
    }]).select();

    if (!error) {
      showToast("✅ Webinaire créé avec succès ! Code de session : " + meetingCode);
      if (data) setMyWebinars((prev) => [data[0], ...prev]);
      setWebinarTitle("");
      setWebinarDesc("");
    } else {
      showToast("❌ Erreur : " + error.message);
    }
    setCreatingWebinar(false);
  };

  // 4. Enregistrer une évaluation de progrès (visible par l'élève et le parent)
  const handleSendEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalStudentId || !evalChapter.trim()) return;
    setSendingEval(true);

    const evalContent = `[SAMA_PROGRES] Évaluation Pédagogique | Chapitre: ${evalChapter.trim()} | Assimilation: ${evalScore}% (${evalComprehension}) | Assiduité: ${evalAttendance} | Observation: ${evalComment.trim() || "Bon travail, poursuivez les efforts."}`;

    const { error } = await supabase.from("tutoring_messages").insert([{
      request_id: evalStudentId,
      sender_id: currentUser.id,
      content: evalContent
    }]);

    if (!error) {
      showToast("✅ Bilan pédagogique consigné avec succès pour l'élève et son parent !");
      setEvalChapter("");
      setEvalComment("");
      setActiveTab("chat");
    } else {
      showToast("❌ Erreur : " + error.message);
    }
    setSendingEval(false);
  };

  // 5. Envoyer un message dans le chat
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !selectedStudentForChat) return;
    setSendingChatMessage(true);

    const { error } = await supabase.from("tutoring_messages").insert([{
      request_id: selectedStudentForChat.id,
      sender_id: currentUser.id,
      content: newChatMessage.trim()
    }]);

    if (!error) {
      setNewChatMessage("");
    } else {
      showToast("❌ Erreur : " + error.message);
    }
    setSendingChatMessage(false);
  };

  // 6. Envoyer une annonce officielle à l'élève
  const handleSendAnnouncement = async () => {
    if (!announcementMsg.trim() || !selectedStudentForChat) return;
    setSendingChatMessage(true);

    const content = `[SAMA_ANNOUNCEMENT] 📢 ANNONCE DU PROFESSEUR : ${announcementMsg.trim()}`;

    const { error } = await supabase.from("tutoring_messages").insert([{
      request_id: selectedStudentForChat.id,
      sender_id: currentUser.id,
      content: content
    }]);

    if (!error) {
      showToast("✅ Annonce diffusée à l'élève !");
      setAnnouncementMsg("");
    } else {
      showToast("❌ Erreur : " + error.message);
    }
    setSendingChatMessage(false);
  };

  if (loading) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center py-24">
        <i className="fas fa-spinner fa-spin text-sama-primary text-4xl mb-3"></i>
        <p className="text-gray-500 font-semibold text-sm">Chargement de votre Espace Enseignant...</p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 bg-blue-50 text-sama-primary rounded-full flex items-center justify-center text-3xl mb-4">
          <i className="fas fa-chalkboard-teacher"></i>
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Espace Enseignant SAMA ACADÉMIE</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6">
          Veuillez vous connecter avec votre compte enseignant pour accéder à votre tableau de bord.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className="btn-primary text-sm px-6 py-2.5">
            Se connecter
          </Link>
          <Link href="/dashboard/eleve" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm px-5 py-2.5 rounded-xl transition">
            Espace Élève
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-24 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-gray-700 text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* En-tête Enseignant */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-8 mb-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-bold mb-3 border border-white/10">
              <i className="fas fa-shield-alt text-amber-400"></i> Espace Enseignant Certifié SAMA ACADÉMIE
            </div>
            <h1 className="text-3xl sm:text-4xl font-black">
              Bonjour, Prof. {currentUser?.first_name} {currentUser?.last_name} 👋
            </h1>
            <p className="text-blue-200 text-sm mt-1 max-w-2xl">
              Gérez vos élèves officiellement assignés, déposez vos cours et devoirs, animez vos webinaires et suivez les progrès pédagogiques.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-xs text-blue-200 font-medium">Élèves sous encadrement</p>
              <p className="text-2xl font-black text-white">{assignedStudents.length}</p>
            </div>
            <div className="w-12 h-12 bg-amber-400 text-blue-950 rounded-2xl flex items-center justify-center text-xl font-bold">
              <i className="fas fa-user-graduate"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'onglets de navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1.5 rounded-2xl mb-8 border border-gray-200">
        <button
          onClick={() => setActiveTab("eleves")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
            activeTab === "eleves" ? "bg-white text-sama-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <i className="fas fa-users"></i>
          <span>Mes Élèves ({assignedStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("devoirs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
            activeTab === "devoirs" ? "bg-white text-sama-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <i className="fas fa-file-signature"></i>
          <span>Donner un Devoir / Cours</span>
        </button>

        <button
          onClick={() => setActiveTab("videos")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
            activeTab === "videos" ? "bg-white text-sama-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <i className="fas fa-play-circle"></i>
          <span>Publier une Vidéo</span>
        </button>

        <button
          onClick={() => setActiveTab("webinaires")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
            activeTab === "webinaires" ? "bg-white text-sama-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <i className="fas fa-video"></i>
          <span>Webinaires & Directs</span>
        </button>

        <button
          onClick={() => setActiveTab("progres")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
            activeTab === "progres" ? "bg-white text-sama-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <i className="fas fa-chart-line"></i>
          <span>Évaluer les Progrès (Parent)</span>
        </button>

        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
            activeTab === "chat" ? "bg-white text-sama-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <i className="fas fa-comments"></i>
          <span>Messagerie & Annonces</span>
        </button>
      </div>

      {/* ======================= ONGLET 1 : MES ÉLÈVES ASSIGNÉS ======================= */}
      {activeTab === "eleves" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900">Élèves sous votre encadrement</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Seuls les élèves officiellement assignés par la Direction de SAMA ACADÉMIE sont visibles ici.
              </p>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <i className="fas fa-lock"></i> Accès Réservé & Sécurisé
            </span>
          </div>

          {assignedStudents.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
              <div className="w-16 h-16 bg-blue-50 text-sama-primary rounded-full flex items-center justify-center mx-auto text-2xl">
                <i className="fas fa-user-clock"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Aucun élève assigné actuellement</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                La Direction de SAMA ACADÉMIE vous affectera de nouveaux élèves après la validation de leur inscription et des créneaux horaires.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedStudents.map((req) => (
                <div key={req.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-sama-primary text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm">
                      {req.student?.first_name?.[0]}{req.student?.last_name?.[0]}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-base">
                        {req.student?.first_name} {req.student?.last_name}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium">
                        Classe : <span className="font-bold text-sama-primary">{req.student?.level || "Non précisée"}</span>
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        📍 {req.student?.region || "Sénégal"}
                      </p>
                    </div>
                  </div>

                  {req.message && (
                    <div className="bg-gray-50 rounded-2xl p-3 text-xs text-gray-600 italic border border-gray-100">
                      &quot;{req.message}&quot;
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedStudentForChat(req);
                        setActiveTab("chat");
                      }}
                      className="flex-1 bg-sama-primary hover:bg-blue-800 text-white font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <i className="fas fa-comment-dots"></i> Discuter
                    </button>
                    <button
                      onClick={() => {
                        setDocStudentId(req.id);
                        setActiveTab("devoirs");
                      }}
                      className="bg-blue-50 hover:bg-blue-100 text-sama-primary font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                      title="Envoyer un devoir"
                    >
                      <i className="fas fa-file-signature"></i> Devoir
                    </button>
                    <button
                      onClick={() => {
                        setEvalStudentId(req.id);
                        setActiveTab("progres");
                      }}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                      title="Évaluer l'assimilation"
                    >
                      <i className="fas fa-chart-line"></i> Bilan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================= ONGLET 2 : DONNER UN DEVOIR / COURS ======================= */}
      {activeTab === "devoirs" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <i className="fas fa-file-signature text-sama-primary"></i> Assigner un Devoir ou Partager une Fiche
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Le document sera instantanément notifié dans l&apos;espace de l&apos;élève et consultable par ses parents.
              </p>
            </div>

            {assignedStudents.length === 0 ? (
              <p className="text-xs text-red-500 font-bold">
                ⚠️ Vous devez avoir au moins un élève assigné par la Direction pour lui transmettre un devoir.
              </p>
            ) : (
              <form onSubmit={handleSendDoc} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Destinataire (Élève)</label>
                  <select
                    value={docStudentId}
                    onChange={(e) => setDocStudentId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  >
                    {assignedStudents.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.student?.first_name} {r.student?.last_name} ({r.student?.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Type de document</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                    >
                      <option>Devoir à la maison</option>
                      <option>Fiche de révision</option>
                      <option>Série d&apos;exercices</option>
                      <option>Support de cours officiel</option>
                      <option>Sujet type examen</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Date limite de remise</label>
                    <input
                      type="date"
                      value={docDueDate}
                      onChange={(e) => setDocDueDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Titre de l&apos;activité</label>
                  <input
                    type="text"
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Ex: TD n°3 : Fonctions trigonométriques & Limites"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Consignes et exercices à faire</label>
                  <textarea
                    rows={4}
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                    placeholder="Détaillez les exercices à traiter (Ex: Traiter les exercices 1, 3 et 4 page 42, bien rédiger la démonstration pour la prochaine séance)..."
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingDoc}
                  className="w-full bg-sama-primary hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-sm"
                >
                  {sendingDoc ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-paper-plane"></i> Transmettre le devoir à l&apos;élève</>}
                </button>
              </form>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 h-fit space-y-4">
            <h4 className="font-extrabold text-sama-primary text-sm flex items-center gap-2">
              <i className="fas fa-info-circle"></i> Procédure SAMA ACADÉMIE
            </h4>
            <ul className="text-xs text-gray-600 space-y-2.5">
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-green-600 mt-0.5"></i>
                <span>Le devoir apparaît instantanément dans la messagerie et sur le tableau de bord de l&apos;élève.</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-green-600 mt-0.5"></i>
                <span>Le parent d&apos;élève peut contrôler le travail à faire depuis son Espace Parent.</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-green-600 mt-0.5"></i>
                <span>Vous assurez ainsi un suivi pédagogique continu et garanti.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ======================= ONGLET 3 : PUBLIER UNE VIDÉO ======================= */}
      {activeTab === "videos" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-fit space-y-5">
            <div>
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <i className="fas fa-video text-sama-primary"></i> Ajouter une Vidéo de Cours
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Publiez des explications vidéo destinées aux révisions de vos élèves.
              </p>
            </div>

            <form onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Titre de la vidéo</label>
                <input
                  type="text"
                  required
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Ex: Méthode de factorisation des polynômes"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Matière</label>
                  <input
                    type="text"
                    required
                    value={videoSubject}
                    onChange={(e) => setVideoSubject(e.target.value)}
                    placeholder="Ex: Mathématiques"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Niveau / Classe</label>
                  <input
                    type="text"
                    required
                    value={videoLevel}
                    onChange={(e) => setVideoLevel(e.target.value)}
                    placeholder="Ex: 3ème ou Terminale"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Durée</label>
                  <input
                    type="text"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="Ex: 20 min"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Lien de la vidéo</label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Ex: https://youtube.com/..."
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addingVideo}
                className="w-full bg-sama-primary hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
              >
                {addingVideo ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-upload"></i> Mettre en ligne la vidéo</>}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-black text-gray-900">Vidéos pédagogiques disponibles sur la plateforme</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myVideos.map((v) => (
                <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition space-y-2">
                  <div className="h-32 bg-gray-900 rounded-xl flex items-center justify-center text-white relative overflow-hidden group">
                    <i className="fas fa-play-circle text-4xl text-sama-orange opacity-90 group-hover:scale-110 transition"></i>
                    <span className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-bold">
                      {v.duration || "20 min"}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{v.title}</h4>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{v.subject}</span>
                    <span className="font-bold text-sama-primary">{v.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================= ONGLET 4 : WEBINAIRES & COURS EN DIRECT ======================= */}
      {activeTab === "webinaires" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-fit space-y-4">
            <div>
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <i className="fas fa-video text-sama-primary"></i> Programmer un Cours en Direct
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Créez une séance webinaire pour expliquer une leçon ou corriger un devoir avec vos élèves.
              </p>
            </div>

            <form onSubmit={handleCreateWebinar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Titre de la session</label>
                <input
                  type="text"
                  required
                  value={webinarTitle}
                  onChange={(e) => setWebinarTitle(e.target.value)}
                  placeholder="Ex: Séance de révision : Dérivées & Primitives"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Matière</label>
                  <input
                    type="text"
                    required
                    value={webinarSubject}
                    onChange={(e) => setWebinarSubject(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Niveau cible</label>
                  <input
                    type="text"
                    required
                    value={webinarLevel}
                    onChange={(e) => setWebinarLevel(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={webinarDate}
                    onChange={(e) => setWebinarDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Heure de début</label>
                  <input
                    type="time"
                    required
                    value={webinarTime}
                    onChange={(e) => setWebinarTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description / Objectifs</label>
                <textarea
                  rows={3}
                  value={webinarDesc}
                  onChange={(e) => setWebinarDesc(e.target.value)}
                  placeholder="Objectif de la séance en direct..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                />
              </div>

              <button
                type="submit"
                disabled={creatingWebinar}
                className="w-full bg-sama-primary hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
              >
                {creatingWebinar ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-calendar-check"></i> Créer la session en direct</>}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-black text-gray-900">Mes Séances Programmées ({myWebinars.length})</h3>
            {myWebinars.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
                <i className="fas fa-video-slash text-4xl text-gray-300 mb-3 block"></i>
                <p className="text-gray-500 text-sm">Vous n&apos;avez aucune séance webinaire programmée.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myWebinars.map((w) => (
                  <div key={w.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-sama-primary text-xs font-bold px-2.5 py-0.5 rounded-full">
                          {w.subject}
                        </span>
                        <span className="text-xs text-gray-400">Niveau : {w.target_level}</span>
                      </div>
                      <h4 className="text-base font-bold text-gray-900">{w.title}</h4>
                      <p className="text-xs text-gray-500">
                        📅 {new Date(w.scheduled_at).toLocaleDateString("fr-FR")} à {new Date(w.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-xs text-sama-primary font-bold">
                        Code d&apos;accès : <code className="bg-gray-100 px-2 py-0.5 rounded">{w.meeting_code}</code>
                      </p>
                    </div>

                    <Link
                      href={`/classes/${w.id}/room`}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition flex items-center gap-2 shadow-sm flex-shrink-0"
                    >
                      <i className="fas fa-broadcast-tower"></i> Démarrer le cours live
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= ONGLET 5 : ÉVALUER LES PROGRÈS ======================= */}
      {activeTab === "progres" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <i className="fas fa-chart-line text-sama-primary"></i> Rapport d&apos;Assimilation &amp; Progrès
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Transmettez un bilan pédagogique pour informer le parent et l&apos;élève sur le niveau de compréhension du cours.
              </p>
            </div>

            {assignedStudents.length === 0 ? (
              <p className="text-xs text-red-500 font-bold">
                ⚠️ Aucun élève assigné actuellement.
              </p>
            ) : (
              <form onSubmit={handleSendEvaluation} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Élève concerné</label>
                  <select
                    value={evalStudentId}
                    onChange={(e) => setEvalStudentId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  >
                    {assignedStudents.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.student?.first_name} {r.student?.last_name} ({r.student?.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Chapitre ou Notions abordées</label>
                  <input
                    type="text"
                    required
                    value={evalChapter}
                    onChange={(e) => setEvalChapter(e.target.value)}
                    placeholder="Ex: Chapitre 2 : Calcul vectoriel & Produit scalaire"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Taux d&apos;assimilation (%)</label>
                    <select
                      value={evalScore}
                      onChange={(e) => setEvalScore(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                    >
                      <option value="95">95% (Excellent)</option>
                      <option value="85">85% (Très bon)</option>
                      <option value="70">70% (Bon acquis)</option>
                      <option value="50">50% (Moyen - à consolider)</option>
                      <option value="35">35% (Difficultés constatées)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Appréciation globale</label>
                    <select
                      value={evalComprehension}
                      onChange={(e) => setEvalComprehension(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                    >
                      <option>Très bonne assimilation</option>
                      <option>Comprend bien les explications</option>
                      <option>En nette progression</option>
                      <option>Doit refaire les exercices</option>
                      <option>Attention au manque de concentration</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Assiduité &amp; Ponctualité</label>
                    <select
                      value={evalAttendance}
                      onChange={(e) => setEvalAttendance(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                    >
                      <option>Présent &amp; Ponctuel</option>
                      <option>Très participatif</option>
                      <option>Retard constaté</option>
                      <option>Absence justifiée</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Remarques pédagogiques pour les parents</label>
                  <textarea
                    rows={3}
                    value={evalComment}
                    onChange={(e) => setEvalComment(e.target.value)}
                    placeholder="Ex: L'élève pose les bonnes questions et a bien compris la méthode. Je lui recommande de s'entraîner sur les exercices 3 et 4 pour consolider ses acquis..."
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingEval}
                  className="w-full bg-sama-primary hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-sm"
                >
                  {sendingEval ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-check-double"></i> Enregistrer et notifier le Parent &amp; l&apos;Élève</>}
                </button>
              </form>
            )}
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 h-fit space-y-4">
            <h4 className="font-extrabold text-amber-900 text-sm flex items-center gap-2">
              <i className="fas fa-shield-alt text-amber-600"></i> Transparence Pédagogique
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Ce compte-rendu répond directement aux attentes des parents d&apos;élèves pour :
            </p>
            <ul className="text-xs text-gray-600 space-y-2">
              <li className="flex items-start gap-1.5">
                <i className="fas fa-check-circle text-amber-600 mt-0.5"></i>
                <span>Vérifier que les cours sont clairement expliqués et assimilés.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <i className="fas fa-check-circle text-amber-600 mt-0.5"></i>
                <span>Mesurer la progression de l&apos;élève séance après séance.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <i className="fas fa-check-circle text-amber-600 mt-0.5"></i>
                <span>Garantir la fidélisation des familles sur SAMA ACADÉMIE.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ======================= ONGLET 6 : MESSAGERIE & ANNONCES ======================= */}
      {activeTab === "chat" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des conversations élèves */}
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm h-fit space-y-3">
            <h3 className="font-bold text-gray-900 text-sm px-2">Élèves Assignés ({assignedStudents.length})</h3>
            {assignedStudents.length === 0 ? (
              <p className="text-xs text-gray-400 p-2">Aucun élève assigné.</p>
            ) : (
              <div className="space-y-1">
                {assignedStudents.map((r) => {
                  const isSelected = selectedStudentForChat?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedStudentForChat(r)}
                      className={`w-full text-left p-3 rounded-2xl transition flex items-center gap-3 ${
                        isSelected ? "bg-sama-primary text-white shadow-sm" : "hover:bg-gray-50 text-gray-800"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isSelected ? "bg-white text-sama-primary" : "bg-blue-100 text-sama-primary"
                      }`}>
                        {r.student?.first_name?.[0]}{r.student?.last_name?.[0]}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm truncate">{r.student?.first_name} {r.student?.last_name}</p>
                        <p className={`text-xs truncate ${isSelected ? "text-blue-100" : "text-gray-400"}`}>
                          {r.student?.level || "Élève"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Boîte de discussion */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[650px] overflow-hidden">
            {selectedStudentForChat ? (
              <>
                {/* En-tête discussion */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sama-primary text-white rounded-xl flex items-center justify-center font-bold">
                      {selectedStudentForChat.student?.first_name?.[0]}{selectedStudentForChat.student?.last_name?.[0]}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm">
                        {selectedStudentForChat.student?.first_name} {selectedStudentForChat.student?.last_name}
                      </h4>
                      <p className="text-xs text-sama-primary font-semibold">
                        Classe : {selectedStudentForChat.student?.level || "Non précisée"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full">
                    Encadrement Actif
                  </span>
                </div>

                {/* Formulaire d'annonce rapide */}
                <div className="p-3 bg-amber-50/70 border-b border-amber-100 flex items-center gap-2">
                  <input
                    type="text"
                    value={announcementMsg}
                    onChange={(e) => setAnnouncementMsg(e.target.value)}
                    placeholder="Diffuser une annonce officielle (Ex: Séance décalée à 17h)..."
                    className="flex-grow bg-white border border-amber-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-sama-primary"
                  />
                  <button
                    onClick={handleSendAnnouncement}
                    disabled={!announcementMsg.trim() || sendingChatMessage}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1 flex-shrink-0"
                  >
                    <i className="fas fa-bullhorn"></i> Annonce
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-gray-50/50">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-400 py-12 text-xs">
                      Aucun message pour le moment. Saluez votre élève pour démarrer la séance !
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.sender_id === currentUser.id;
                      const isDoc = msg.content?.startsWith("[SAMA_DOC]");
                      const isEval = msg.content?.startsWith("[SAMA_PROGRES]");
                      const isAnno = msg.content?.startsWith("[SAMA_ANNOUNCEMENT]");

                      if (isDoc) {
                        return (
                          <div key={msg.id} className={`max-w-[85%] ${isMe ? "ml-auto" : "mr-auto"}`}>
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-xs space-y-1.5">
                              <p className="text-xs font-bold text-sama-primary flex items-center gap-1.5">
                                <i className="fas fa-file-signature"></i> Devoir / Support Partagé
                              </p>
                              <p className="text-xs text-gray-800 font-medium">
                                {msg.content.replace("[SAMA_DOC]", "").trim()}
                              </p>
                              <span className="text-[10px] text-gray-400 block text-right">
                                {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      if (isEval) {
                        return (
                          <div key={msg.id} className={`max-w-[85%] ${isMe ? "ml-auto" : "mr-auto"}`}>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs space-y-1.5">
                              <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                <i className="fas fa-chart-line"></i> Compte-Rendu Pédagogique (Élève &amp; Parent)
                              </p>
                              <p className="text-xs text-gray-800 font-medium">
                                {msg.content.replace("[SAMA_PROGRES]", "").trim()}
                              </p>
                              <span className="text-[10px] text-gray-400 block text-right">
                                {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      if (isAnno) {
                        return (
                          <div key={msg.id} className={`max-w-[85%] ${isMe ? "ml-auto" : "mr-auto"}`}>
                            <div className="bg-amber-100 border border-amber-300 rounded-2xl p-3 shadow-xs">
                              <p className="text-xs font-bold text-amber-950">
                                {msg.content.replace("[SAMA_ANNOUNCEMENT]", "").trim()}
                              </p>
                              <span className="text-[10px] text-gray-500 block text-right mt-1">
                                {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={msg.id} className={`flex flex-col max-w-[75%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}>
                          <div className={`p-3 rounded-2xl text-xs shadow-xs ${
                            isMe ? "bg-sama-primary text-white rounded-tr-none" : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                          }`}>
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Saisie message */}
                <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                  <input
                    type="text"
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    placeholder="Écrivez un message à votre élève..."
                    className="flex-grow bg-gray-100 border-none rounded-2xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-sama-primary"
                  />
                  <button
                    type="submit"
                    disabled={!newChatMessage.trim() || sendingChatMessage}
                    className="bg-sama-primary hover:bg-blue-800 disabled:opacity-50 text-white rounded-2xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-grow flex items-center justify-center text-gray-400 text-xs">
                Sélectionnez un élève pour ouvrir la discussion.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
