"use client";

import { detectCycle, studentCycleOf } from "@/lib/cycle";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function getYouTubeEmbedUrl(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : null;
}

const CYCLES = [
  { id: "TOUS", label: "Tous les cycles", icon: "fas fa-layer-group" },
  { id: "Primaire", label: "Primaire (CI à CM2)", icon: "fas fa-child" },
  { id: "College", label: "Collège (6e à 3e BFEM)", icon: "fas fa-user-graduate" },
  { id: "Lycee", label: "Lycée (Seconde à Terminale)", icon: "fas fa-graduation-cap" },
];

export default function Videos() {
  const [videosList, setVideosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState("TOUS");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [targetVideo, setTargetVideo] = useState<any>(null);

  useEffect(() => {
    const checkAccessAndFetch = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profile) {
          setUserProfile(profile);
          const lvl = (profile.level || "").toLowerCase();
          const dc = detectCycle(lvl);
          if (dc) setSelectedCycle(dc);
        }
      }

      // Charger STRICTEMENT les vidéos depuis Supabase (la base de données est l'unique source de vérité)
      const { data: dbVideos } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
      const validVideos = (dbVideos || []).filter((v: any) => {
        const t = (v.title || "").toLowerCase();
        return !t.includes("probe") && !t.includes("test");
      });
      setVideosList(validVideos);
      setLoading(false);
    };

    checkAccessAndFetch();
  }, []);

  const handleVideoClick = (video: any) => {
    // RÈGLE SAMA ACADÉMIE : Seuls les utilisateurs inscrits/connectés peuvent regarder
    if (!userProfile) {
      setTargetVideo(video);
      setShowAuthModal(true);
      return;
    }
    setActiveVideoId(activeVideoId === video.id ? null : video.id);
  };

  // Détection profil, élève et enseignant
  const isStudent = userProfile?.role === "eleve";
  const studentLevel = (userProfile?.level || "").toLowerCase();
  const studentCycle: "Primaire" | "College" | "Lycee" | null = isStudent ? studentCycleOf(studentLevel) : null;

  const isTeacher = userProfile?.role === "enseignant";
  const teacherCycle: "Primaire" | "College" | "Lycee" | null = isTeacher ? detectCycle(userProfile?.level) : null;
  const teacherSubject = isTeacher ? userProfile?.subject : null;

  const effectiveCycle = isStudent && studentCycle 
    ? studentCycle 
    : (isTeacher && teacherCycle ? teacherCycle : selectedCycle);

  const filteredVideos = videosList.filter((vid) => {
    if (isTeacher && teacherSubject) {
      // RÈGLE SAMA ACADÉMIE : Le professeur ne voit que les vidéos de son domaine
      const subNorm = (s: string) => s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "") || "";
      const vs = subNorm(vid.subject);
      const ts = subNorm(teacherSubject);
      const matchSubject = vs === ts || vs.includes(ts) || ts.includes(vs) || (vs.startsWith("math") && ts.startsWith("math"));
      if (!matchSubject) return false;
    }

    if (effectiveCycle === "TOUS") return true;
    const vc = detectCycle(vid.level);
    if (effectiveCycle === "Primaire" || effectiveCycle === "College" || effectiveCycle === "Lycee") return vc === effectiveCycle;
    return true;
  });

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

      {/* En-tête avec Sélecteur de Cycle */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-sama-primary text-xs font-bold mb-2">
              <i className="fas fa-play-circle"></i> Cours & Résolutions Vidéos
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Vidéos Pédagogiques SAMA ACADÉMIE
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Des explications claires et détaillées par nos enseignants certifiés pour maîtriser chaque chapitre.
            </p>
          </div>

          {userProfile && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs text-gray-700 font-medium">
              Espace adapté pour : <strong>{userProfile.first_name}</strong> ({userProfile.level || "Cycle général"})
            </div>
          )}
        </div>

        {/* Sélecteur de Cycle (Cloisonné pour les élèves) */}
        {isStudent && studentCycle ? (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-sama-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  <i className="fas fa-lock"></i>
                </span>
                <div>
                  <p className="font-extrabold text-sama-primary text-sm flex items-center gap-2">
                    <span>Vidéothèque Officielle • Cycle {studentCycle === "Primaire" ? "Primaire (CI à CM2)" : studentCycle === "College" ? "Collège (6e à 3e, BFEM)" : "Lycée (Seconde à Terminale, BAC)"}</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Cloisonné</span>
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Connecté en tant qu&apos;élève ({userProfile?.first_name} • {userProfile?.level}). Seules les leçons vidéos de votre cycle vous sont présentées.
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-sama-primary text-xs font-bold border border-blue-200 shadow-xs">
                  <i className="fas fa-check-circle text-green-500"></i> Cycle Actif : {studentCycle}
                </span>
              </div>
            </div>
          </div>
        ) : isTeacher && teacherSubject ? (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  <i className="fas fa-chalkboard-teacher"></i>
                </span>
                <div>
                  <p className="font-extrabold text-amber-900 text-sm flex items-center gap-2">
                    <span>Espace Enseignant • Matière : {teacherSubject}</span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Spécialité</span>
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Connecté en tant que professeur ({userProfile?.first_name} • {teacherSubject} • {userProfile?.level}). Seules les vidéos de votre discipline et de votre niveau vous sont présentées.
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-amber-900 text-xs font-bold border border-amber-200 shadow-xs">
                  <i className="fas fa-check-circle text-amber-600"></i> Cycle : {teacherCycle || "Lycée"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-100">
            {CYCLES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCycle(c.id)}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  selectedCycle === c.id
                    ? "bg-sama-primary text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                }`}
              >
                <i className={c.icon}></i>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Bannière d'accès pour les visiteurs non connectés */}
        {!loading && !userProfile && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
                  <i className="fas fa-lock"></i>
                </span>
                <div>
                  <p className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                    <span>Accès réservé aux membres SAMA ACADÉMIE</span>
                    <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">Connexion Requise</span>
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Le visionnage des leçons vidéos est réservé aux élèves et enseignants inscrits. Créez votre compte gratuitement pour tout débloquer.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition shadow-xs"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition shadow-md shadow-amber-500/20"
                >
                  S&apos;inscrire gratuitement
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grille des vidéos */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100">
          <i className="fas fa-spinner fa-spin text-4xl text-sama-primary mb-3 block"></i>
          <p className="text-gray-500 font-semibold text-sm">Chargement des vidéos...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
          <i className="fas fa-video-slash text-4xl text-gray-300 mb-3 block"></i>
          <h3 className="font-bold text-gray-700">Aucune vidéo disponible pour ce cycle</h3>
          <p className="text-xs text-gray-400 mt-1">Les vidéos publiées par l&apos;Administration apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const embedUrl = getYouTubeEmbedUrl(video.video_url);

            return (
              <div
                key={video.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition hover:shadow-md cursor-pointer group"
                onClick={() => handleVideoClick(video)}
              >
                {/* Thumbnail ou Lecteur — STRICTEMENT BLOQUÉ SI NON CONNECTÉ */}
                <div className="bg-sama-blue h-48 flex items-center justify-center relative overflow-hidden">
                  {activeVideoId === video.id && userProfile && embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={video.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="text-center text-white p-4 w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-br from-sama-blue to-sama-primary">
                      <i className="fas fa-graduation-cap text-4xl mb-3 opacity-60"></i>
                      {userProfile ? (
                        <div className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 transition shadow-lg">
                          <i className="fas fa-play text-white text-sm"></i>
                          <span className="text-xs font-bold">Lancer la leçon</span>
                        </div>
                      ) : (
                        <div className="bg-amber-500/95 hover:bg-amber-400 text-slate-950 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 transition shadow-lg font-black text-xs">
                          <i className="fas fa-lock"></i>
                          <span>Inscription requise</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Durée ou Badge Cadenas */}
                  <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5">
                    {!userProfile && <i className="fas fa-lock text-amber-400 text-[10px]"></i>}
                    <span>{video.duration || "15 min"}</span>
                  </span>
                </div>

                {/* Métadonnées */}
                <div className="p-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-sama-orange uppercase tracking-wider">
                      {video.subject || "Général"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {!userProfile && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <i className="fas fa-lock text-[9px]"></i> Membre
                        </span>
                      )}
                      <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-0.5 rounded-full">
                        {video.level || "Tous niveaux"}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 hover:text-sama-primary transition">
                    {video.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL INVITATION CONNEXION / INSCRIPTION POUR LES VISITEURS */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition cursor-pointer"
              title="Fermer"
            >
              ✕
            </button>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-amber-500/20">
              <i className="fas fa-lock"></i>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900">
                Inscription Requise
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Pour visionner la leçon vidéo {targetVideo?.title ? <strong>« {targetVideo.title} »</strong> : "complète"}, vous devez avoir un compte sur <strong>SAMA ACADÉMIE</strong>.
              </p>
              <p className="text-[11px] text-gray-500">
                L&apos;inscription est <strong>100% gratuite</strong> et vous donne un accès complet aux leçons et cours du programme national.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <Link
                href="/register"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 px-4 rounded-xl transition text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <i className="fas fa-user-plus"></i>
                <span>Créer mon compte gratuit</span>
              </Link>

              <Link
                href="/login"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-xl transition text-sm flex items-center justify-center gap-2"
              >
                <i className="fas fa-sign-in-alt"></i>
                <span>Déjà inscrit ? Se connecter</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
