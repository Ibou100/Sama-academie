"use client";

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
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState("TOUS");
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const checkAccessAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profile) {
          setUserProfile(profile);
          const lvl = (profile.level || "").toLowerCase();
          if (lvl.includes("primaire") || lvl.includes("ci") || lvl.includes("cm2")) {
            setSelectedCycle("Primaire");
          } else if (lvl.includes("collège") || lvl.includes("college") || lvl.includes("6e") || lvl.includes("3e") || lvl.includes("bfem")) {
            setSelectedCycle("College");
          } else if (lvl.includes("lycée") || lvl.includes("lycee") || lvl.includes("terminale") || lvl.includes("seconde") || lvl.includes("bac")) {
            setSelectedCycle("Lycee");
          }
        }
      }

      // Charger les vidéos depuis Supabase
      const { data: dbVideos } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
      if (dbVideos && dbVideos.length > 0) {
        setVideosList(dbVideos);
      }
    };

    checkAccessAndFetch();
  }, []);

  const handleVideoClick = (videoId: string) => {
    setActiveVideoId(activeVideoId === videoId ? null : videoId);
  };

  const filteredVideos = videosList.filter((vid) => {
    if (selectedCycle === "TOUS") return true;
    const vLevel = (vid.level || "").toLowerCase();
    if (selectedCycle === "Primaire") return vLevel.includes("primaire") || vLevel.includes("cm2") || vLevel.includes("ci") || vLevel.includes("cp") || vLevel.includes("ce");
    if (selectedCycle === "College") return vLevel.includes("collège") || vLevel.includes("college") || vLevel.includes("6e") || vLevel.includes("5e") || vLevel.includes("4e") || vLevel.includes("3e") || vLevel.includes("bfem");
    if (selectedCycle === "Lycee") return vLevel.includes("lycée") || vLevel.includes("lycee") || vLevel.includes("seconde") || vLevel.includes("première") || vLevel.includes("terminale") || vLevel.includes("bac");
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

        {/* Sélecteur de Cycle (Primaire / Collège / Lycée) */}
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
      </div>

      {/* Grille des vidéos */}
      {filteredVideos.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
          <i className="fas fa-video-slash text-4xl text-gray-300 mb-3 block"></i>
          <h3 className="font-bold text-gray-700">Aucune vidéo pour ce cycle actuellement</h3>
          <p className="text-xs text-gray-400 mt-1">Sélectionnez un autre cycle pour explorer les cours disponibles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const embedUrl = getYouTubeEmbedUrl(video.video_url);

            return (
              <div
                key={video.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition hover:shadow-md cursor-pointer"
                onClick={() => handleVideoClick(video.id)}
              >
                {/* Thumbnail ou Lecteur */}
                <div className="bg-sama-blue h-48 flex items-center justify-center relative overflow-hidden">
                  {activeVideoId === video.id && embedUrl ? (
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
                      <div className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 transition shadow-lg">
                        <i className="fas fa-play text-white text-sm"></i>
                        <span className="text-xs font-bold">Lancer la leçon</span>
                      </div>
                    </div>
                  )}

                  {/* Durée */}
                  <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-md font-bold">
                    {video.duration || "15 min"}
                  </span>
                </div>

                {/* Métadonnées */}
                <div className="p-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-sama-orange uppercase tracking-wider">
                      {video.subject || "Général"}
                    </span>
                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-0.5 rounded-full">
                      {video.level || "Tous niveaux"}
                    </span>
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
    </main>
  );
}
