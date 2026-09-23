"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function PreviewGreenRoom() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;

  const [virtualClass, setVirtualClass] = useState<any>(null);
  const [userName, setUserName] = useState<string>("Utilisateur");
  const [userRole, setUserRole] = useState<string>("eleve");
  const [loading, setLoading] = useState(true);

  // WebRTC Hardware test state
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchClassAndProfile();
  }, [classId]);

  const fetchClassAndProfile = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?redirect=/classes/${classId}/preview&message=Vous devez être connecté pour accéder à la classe virtuelle.`);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      setUserName(`${profile.first_name} ${profile.last_name}`);
      setUserRole(profile.role);
    }

    const { data: vClass } = await supabase
      .from("virtual_classes")
      .select("*, teacher:profiles(first_name, last_name)")
      .eq("id", classId)
      .single();

    if (vClass) {
      setVirtualClass(vClass);
    }

    setLoading(false);
  };

  // Test Webcam & Micro dans la Green Room
  useEffect(() => {
    if (!loading && isCamOn) {
      navigator.mediaDevices?.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
        .then((stream) => {
          setMediaStream(stream);
          setErrorMsg(null);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Accès caméra/micro refusé :", err);
          setErrorMsg("Impossible d'accéder à votre caméra ou microphone. Veuillez autoriser l'accès dans votre navigateur.");
        });
    } else {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
        setMediaStream(null);
      }
    }
  }, [loading, isCamOn]);

  const toggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((t) => (t.enabled = next));
    }
  };

  const toggleCam = () => {
    setIsCamOn(!isCamOn);
  };

  const handleJoinRoom = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }
    // Stocker les préférences utilisateur dans la session
    sessionStorage.setItem("user_mic_pref", isMicOn ? "on" : "off");
    sessionStorage.setItem("user_cam_pref", isCamOn ? "on" : "off");

    router.push(`/classes/${classId}/room`);
  };

  if (loading) {
    return (
      <main className="flex-grow flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-sama-primary text-4xl"></i>
      </main>
    );
  }

  if (!virtualClass) {
    return (
      <main className="flex-grow flex items-center justify-center">
        <p className="text-gray-500">Classe virtuelle introuvable.</p>
      </main>
    );
  }

  return (
    <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-6">
        <Link href="/classes" className="text-xs font-bold text-sama-primary hover:underline flex items-center gap-1">
          <i className="fas fa-arrow-left"></i> Retour aux classes virtuelles
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-3">
        
        {/* Colonne Gauche : Aperçu Caméra (2/3 de largeur) */}
        <div className="md:col-span-2 bg-gray-950 p-6 flex flex-col justify-between min-h-[420px] relative">
          
          {/* Tag de statut */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-2 z-10">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Prévisualisation matérielle
          </div>

          {/* Flux Vidéo ou Avatar */}
          <div className="flex-grow flex items-center justify-center relative overflow-hidden rounded-2xl bg-gray-900 border border-gray-800">
            {isCamOn ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100"></video>
            ) : (
              <div className="text-center text-white p-6">
                <div className="w-24 h-24 rounded-full bg-sama-primary text-white font-extrabold text-3xl flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-blue-400">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
                <h4 className="font-bold text-base">{userName}</h4>
                <p className="text-xs text-gray-400 mt-1">La caméra est désactivée</p>
              </div>
            )}
          </div>

          {/* Message d'erreur d'accès */}
          {errorMsg && (
            <div className="mt-3 bg-red-900/80 text-red-200 text-xs p-3 rounded-xl border border-red-700 flex items-center gap-2">
              <i className="fas fa-exclamation-triangle text-sm"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Barre de contrôle prévisualisation */}
          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition shadow-md ${
                isMicOn ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-red-600 text-white"
              }`}
            >
              <i className={`fas ${isMicOn ? "fa-microphone" : "fa-microphone-slash"}`}></i>
            </button>

            <button
              onClick={toggleCam}
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition shadow-md ${
                isCamOn ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-red-600 text-white"
              }`}
            >
              <i className={`fas ${isCamOn ? "fa-video" : "fa-video-slash"}`}></i>
            </button>
          </div>
        </div>

        {/* Colonne Droite : Infos du cours & Bouton d'entrée */}
        <div className="p-8 flex flex-col justify-between bg-white">
          <div>
            <span className="text-xs font-bold bg-blue-50 text-sama-primary px-3 py-1 rounded-full uppercase tracking-wider">
              {virtualClass.subject}
            </span>
            <h2 className="text-2xl font-extrabold text-gray-900 mt-4 mb-2 leading-snug">{virtualClass.title}</h2>
            <p className="text-xs text-gray-500 mb-4">
              Professeur : <strong>{virtualClass.teacher?.first_name} {virtualClass.teacher?.last_name}</strong>
            </p>

            <div className="bg-gray-50 rounded-2xl p-4 text-xs space-y-2 text-gray-600 mb-6">
              <p className="flex justify-between">
                <span>Connecté en tant que :</span>
                <strong className="text-gray-900">{userName}</strong>
              </p>
              <p className="flex justify-between">
                <span>Rôle :</span>
                <span className="capitalize font-bold text-sama-primary">{userRole === "enseignant" ? "Professeur (Hôte)" : "Élève"}</span>
              </p>
              <p className="flex justify-between">
                <span>Code de réunion :</span>
                <span className="font-mono font-bold text-gray-800">{virtualClass.meeting_code}</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleJoinRoom}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition shadow-lg text-base flex justify-center items-center gap-2"
            >
              <i className="fas fa-sign-in-alt"></i> Rejoindre la classe
            </button>
            <p className="text-[11px] text-gray-400 text-center">
              Votre micro est {isMicOn ? "activé 🟢" : "coupé 🔴"} et votre caméra est {isCamOn ? "activée 🟢" : "coupée 🔴"}.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
