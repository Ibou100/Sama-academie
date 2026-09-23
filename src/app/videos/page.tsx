"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type AccessLevel = "loading" | "anonymous" | "free" | "premium";

function getYouTubeEmbedUrl(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : null;
}

export default function Videos() {
  const [access, setAccess] = useState<AccessLevel>("loading");
  const [videosList, setVideosList] = useState<any[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  useEffect(() => {
    const checkAccessAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setAccess("anonymous");
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .single();

        setAccess(profile?.is_premium ? "premium" : "free");
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
    if (access === "premium") {
      setActiveVideoId(activeVideoId === videoId ? null : videoId);
    }
  };

  if (access === "loading") {
    return (
      <main className="flex-grow flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-sama-primary text-4xl"></i>
      </main>
    );
  }

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

      {/* En-tête */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
              Vidéos de correction
            </h1>
            <p className="text-gray-500">
              Des vidéos pédagogiques claires pour comprendre chaque exercice en profondeur.
            </p>
          </div>
          {access === "premium" && (
            <span className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-full font-bold text-sm">
              <i className="fas fa-crown"></i> Accès Premium actif
            </span>
          )}
        </div>
      </div>

      {/* Bannière selon le statut */}
      {access === "anonymous" && (
        <div className="bg-gradient-to-r from-sama-blue to-blue-700 rounded-3xl p-8 mb-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              <i className="fas fa-lock mr-2"></i>Contenu réservé aux membres
            </h2>
            <p className="text-blue-200">
              Créez un compte gratuit pour voir les aperçus, ou passez en Premium pour regarder toutes les vidéos.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link href="/register" className="bg-white text-sama-primary font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition">
              Créer un compte
            </Link>
            <Link href="/login" className="border border-white text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-800 transition">
              Se connecter
            </Link>
          </div>
        </div>
      )}

      {access === "free" && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-3xl p-8 mb-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              <i className="fas fa-crown mr-2"></i>Passez en Premium pour débloquer toutes les vidéos !
            </h2>
            <p className="text-yellow-100">
              Vous avez un compte gratuit. Les vidéos de correction sont réservées aux abonnés Premium à partir de <strong>3 500 F/mois</strong>.
            </p>
          </div>
          <Link href="/tarifs" className="bg-white text-orange-600 font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition flex-shrink-0">
            Voir les offres
          </Link>
        </div>
      )}

      {/* Grille des vidéos */}
      {videosList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
          <i className="fas fa-video-slash text-4xl text-gray-300 mb-3 block"></i>
          <h3 className="font-bold text-gray-700">Aucune vidéo en ligne pour le moment</h3>
          <p className="text-xs text-gray-400 mt-1">Ajoutez des vidéos depuis l'Espace Admin !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videosList.map((video) => {
            const embedUrl = getYouTubeEmbedUrl(video.video_url);

            return (
              <div
                key={video.id}
                className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition hover:shadow-md ${
                  access !== "premium" ? "cursor-default" : "cursor-pointer"
                }`}
                onClick={() => handleVideoClick(video.id)}
              >
                {/* Thumbnail ou Lecteur */}
                <div className="bg-sama-blue h-48 flex items-center justify-center relative overflow-hidden">
                  {access === "premium" ? (
                    activeVideoId === video.id && embedUrl ? (
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
                          <span className="text-xs font-bold">Regarder la vidéo</span>
                        </div>
                      </div>
                    )
                  ) : (
                    /* Verrouillé pour non-premium */
                    <div className="relative w-full h-full bg-gradient-to-br from-sama-blue to-gray-900 flex items-center justify-center">
                      <div className="text-center text-white p-4">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 backdrop-blur-md">
                          <i className="fas fa-lock text-xl text-yellow-400"></i>
                        </div>
                        <p className="text-xs font-bold">
                          {access === "anonymous" ? "Connexion requise" : "Réservé aux membres Premium"}
                        </p>
                      </div>
                    </div>
                  )}

                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                    {video.duration}
                  </span>
                </div>

                {/* Infos vidéo */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-sama-primary bg-blue-50 px-2.5 py-0.5 rounded-full">
                      {video.subject}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{video.level}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm leading-snug">
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
