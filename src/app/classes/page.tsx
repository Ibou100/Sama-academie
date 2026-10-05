"use client";

import { getVisibleTeacherIds } from "@/lib/classAccess";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ClassesVirtuellesDashboard() {
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Formulaire Professeur
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Mathématiques");
  const [targetLevel, setTargetLevel] = useState("Terminale S2");
  const [description, setDescription] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Données Supabase
  const [classesList, setClassesList] = useState<any[]>([]);
  const [newlyCreatedClass, setNewlyCreatedClass] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfileAndClasses();
  }, []);

  const fetchProfileAndClasses = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    let viewerProfile: any = null;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        viewerProfile = profile;
        setUserProfile(profile);
      } else {
        viewerProfile = {
          id: user.id,
          first_name: user.user_metadata?.first_name || user.email?.split("@")[0] || "Professeur",
          last_name: user.user_metadata?.last_name || "",
          role: "enseignant",
        };
        setUserProfile(viewerProfile);
      }
    }

    // Charger UNIQUEMENT les classes auxquelles l'utilisateur a droit
    // (prof = ses classes, élève = classes de son prof assigné, admin = tout)
    if (user && viewerProfile) {
      const allowed = await getVisibleTeacherIds(user.id, viewerProfile.role);
      if (allowed === "all" || allowed.length > 0) {
        let q = supabase
          .from("virtual_classes")
          .select("*, teacher:profiles(first_name, last_name)")
          .order("created_at", { ascending: false });
        if (allowed !== "all") q = q.in("teacher_id", allowed);
        const { data: vClasses } = await q;
        setClassesList(vClasses || []);
      } else {
        setClassesList([]);
      }
    } else {
      setClassesList([]);
    }

    setLoading(false);
  };

  // Création d'une classe virtuelle par le professeur
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      alert("Vous devez être connecté pour créer une classe virtuelle.");
      return;
    }

    setSubmitting(true);
    const meetingCode = `SAMA-${Math.floor(100000 + Math.random() * 900000)}`;
    
    let scheduledAt = new Date().toISOString();
    try {
      if (scheduleDate) {
        const timePart = startTime ? startTime : "10:00";
        scheduledAt = new Date(`${scheduleDate}T${timePart}:00`).toISOString();
      }
    } catch (err) {
      scheduledAt = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("virtual_classes")
      .insert([
        {
          title,
          description,
          subject,
          target_level: targetLevel,
          teacher_id: userProfile.id,
          meeting_code: meetingCode,
          scheduled_at: scheduledAt,
          status: "scheduled",
        },
      ])
      .select("*, teacher:profiles(first_name, last_name)")
      .single();

    setSubmitting(false);

    if (!error && data) {
      setNewlyCreatedClass(data);
      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      fetchProfileAndClasses();
    } else {
      console.error("Erreur création classe Supabase :", error);
      const msg = error?.message || "Erreur de connexion à Supabase.";
      if (msg.includes("relation") || msg.includes("does not exist")) {
        alert("La table 'virtual_classes' n'existe pas encore dans votre Supabase. Assurez-vous d'avoir exécuté le script SQL 'supabase_virtual_classes.sql' dans votre SQL Editor Supabase.");
      } else {
        alert(`Erreur lors de la création de la classe virtuelle : ${msg}`);
      }
    }
  };

  // Démarrer la classe (pour le professeur)
  const handleStartClass = async (classId: string) => {
    await supabase
      .from("virtual_classes")
      .update({ status: "live", started_at: new Date().toISOString() })
      .eq("id", classId);

    router.push(`/classes/${classId}/preview`);
  };

  const copyLink = (meetingCode: string, id: string) => {
    const url = `${window.location.origin}/classes/${id}/preview`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  if (loading) {
    return (
      <main className="flex-grow flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-sama-primary text-4xl"></i>
      </main>
    );
  }

  const isTeacher = userProfile?.role === "enseignant" || userProfile?.role === "admin";

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

      {/* Modal Créer une classe virtuelle (Formulaire Professeur) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <i className="fas fa-plus-circle text-sama-primary"></i> Créer une classe virtuelle
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Titre du cours *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Correction BAC S2 — Mathématiques"
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Matière *</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  >
                    <option>Mathématiques</option>
                    <option>Physique-Chimie</option>
                    <option>SVT</option>
                    <option>Français</option>
                    <option>Anglais</option>
                    <option>Histoire-Géographie</option>
                    <option>Philosophie</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Classe / Niveau *</label>
                  <input
                    type="text"
                    required
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    placeholder="Ex: Terminale S2, 3e, etc."
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Début *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fin *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description / Programme du cours</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Expliquez ce qui sera abordé dans cette session..."
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-sama-primary hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold py-3.5 rounded-xl transition shadow-md flex justify-center items-center gap-2 text-sm"
              >
                {submitting ? <i className="fas fa-spinner fa-spin"></i> : "Publier la classe virtuelle"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation après création de classe */}
      {newlyCreatedClass && (
        <div className="bg-green-50 border border-green-200 rounded-3xl p-6 mb-8 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                <i className="fas fa-check"></i>
              </div>
              <div>
                <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Classe virtuelle créée avec succès !</span>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{newlyCreatedClass.title}</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Matière : <strong>{newlyCreatedClass.subject}</strong> • Niveau : <strong>{newlyCreatedClass.target_level}</strong>
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="bg-white border border-green-300 text-green-800 px-3 py-1 rounded-xl text-xs font-mono font-bold">
                    Code : {newlyCreatedClass.meeting_code}
                  </span>
                  <button
                    onClick={() => copyLink(newlyCreatedClass.meeting_code, newlyCreatedClass.id)}
                    className="bg-green-600 text-white hover:bg-green-700 px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <i className="fas fa-copy"></i>
                    {copiedId === newlyCreatedClass.id ? "Lien copié !" : "Copier le lien"}
                  </button>
                  <button
                    onClick={() => handleStartClass(newlyCreatedClass.id)}
                    className="bg-sama-primary hover:bg-blue-800 text-white px-5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                  >
                    <i className="fas fa-play"></i> Démarrer la classe maintenant
                  </button>
                </div>
              </div>
            </div>
            <button onClick={() => setNewlyCreatedClass(null)} className="text-gray-400 hover:text-gray-600">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* En-tête du Dashboard */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-50 text-sama-primary text-xs font-bold px-3 py-1 rounded-full">
                MODULE ACADÉMIQUE
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
              Classes Virtuelles
            </h1>
            <p className="text-gray-500 text-sm">
              {isTeacher
                ? "Programmez vos cours en visioconférence et donnez rendez-vous à vos élèves en direct."
                : "Consultez vos cours en visioconférence programmés et rejoignez vos professeurs en direct."}
            </p>
          </div>

          {isTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-sama-primary hover:bg-blue-800 text-white font-bold px-6 py-3.5 rounded-2xl transition shadow-md flex items-center gap-2 text-sm flex-shrink-0"
            >
              <i className="fas fa-plus"></i> Créer une classe virtuelle
            </button>
          )}
        </div>
      </div>

      {/* Liste des cours pour l'Étudiant / Professeur */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">
          {isTeacher ? "Mes sessions de cours" : "Vos classes virtuelles programmées"}
        </h2>

        {classesList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
            <i className="fas fa-video-slash text-4xl text-gray-300 mb-3 block"></i>
            <h3 className="font-bold text-gray-700">Aucune classe virtuelle programmée pour le moment</h3>
            <p className="text-xs text-gray-400 mt-1">
              {isTeacher ? "Cliquez sur 'Créer une classe virtuelle' pour planifier votre premier cours !" : "Vos professeurs publieront prochainement les créneaux de visioconférence."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classesList.map((c) => {
              const isLive = c.status === "live" || c.status === "waiting";
              const isEnded = c.status === "ended";
              const dateStr = new Date(c.scheduled_at).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col justify-between transition hover:shadow-md ${
                    isLive ? "border-green-300 ring-2 ring-green-100" : "border-gray-100"
                  }`}
                >
                  <div>
                    {/* Badge Statut */}
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold bg-blue-50 text-sama-primary px-3 py-1 rounded-full">
                        {c.subject}
                      </span>

                      {isLive && (
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-red-600"></span> 🟢 Classe disponible
                        </span>
                      )}
                      {c.status === "scheduled" && (
                        <span className="bg-yellow-50 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <i className="fas fa-clock text-xs"></i> Programmé
                        </span>
                      )}
                      {isEnded && (
                        <span className="bg-gray-100 text-gray-500 text-xs font-medium px-3 py-1 rounded-full">
                          Terminée
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-gray-900 text-lg mb-1 leading-snug">{c.title}</h3>
                    <p className="text-xs text-gray-500 font-medium mb-3">
                      Professeur : <strong>{c.teacher?.first_name} {c.teacher?.last_name}</strong> • Niveau : <strong>{c.target_level}</strong>
                    </p>

                    {c.description && (
                      <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">{c.description}</p>
                    )}

                    <div className="bg-gray-50 rounded-2xl p-3 text-xs text-gray-600 flex items-center gap-2 mb-4">
                      <i className="fas fa-calendar-alt text-sama-primary"></i>
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  {/* Actions selon rôle et statut */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-mono text-gray-400">
                      Code : <strong>{c.meeting_code}</strong>
                    </span>

                    {isTeacher ? (
                      <div className="flex gap-2">
                        {c.status !== "ended" && (
                          <button
                            onClick={() => handleStartClass(c.id)}
                            className="bg-sama-primary hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-1.5"
                          >
                            <i className="fas fa-video"></i> {isLive ? "Rejoindre le Studio" : "Démarrer la classe"}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div>
                        {isLive ? (
                          <Link
                            href={`/classes/${c.id}/preview`}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-md inline-flex items-center gap-1.5"
                          >
                            <i className="fas fa-sign-in-alt"></i> Rejoindre la classe
                          </Link>
                        ) : isEnded ? (
                          <span className="text-xs text-gray-400 font-semibold italic">Cours terminé</span>
                        ) : (
                          <button
                            disabled
                            className="bg-gray-100 text-gray-400 px-5 py-2.5 rounded-xl font-bold text-xs cursor-not-allowed"
                          >
                            Commence à la date indiquée
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
