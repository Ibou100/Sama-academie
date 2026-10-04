"use client";

import { detectCycle, studentCycleOf } from "@/lib/cycle";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardEleve() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [studentCycle, setStudentCycle] = useState<"Primaire" | "Collège" | "Lycée">("Lycée");
  
  // Enseignant assigné
  const [assignedTeacherReq, setAssignedTeacherReq] = useState<any | null>(null);

  // Devoirs & Progrès reçus
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [progressEvaluations, setProgressEvaluations] = useState<any[]>([]);
  const [webinarsList, setWebinarsList] = useState<any[]>([]);

  // Documents & Vidéos du cycle
  const [cycleAnnales, setCycleAnnales] = useState<any[]>([]);
  const [cycleVideos, setCycleVideos] = useState<any[]>([]);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?redirect=/dashboard/eleve");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "eleve") {
      router.push("/dashboard");
      return;
    }

    setCurrentUser(profile);

    // Détermination du cycle de l'élève
    const sc = studentCycleOf(profile.level);
    const detectedCycle: "Primaire" | "Collège" | "Lycée" = sc === "Primaire" ? "Primaire" : sc === "College" ? "Collège" : "Lycée";
    setStudentCycle(detectedCycle);

    // 1. Récupérer l'enseignant assigné (validé par l'administration)
    const { data: requests } = await supabase
      .from("tutoring_requests")
      .select(`*, teacher:profiles!teacher_id(id, first_name, last_name, email, phone, subject, region, avatar_url)`)
      .eq("student_id", user.id)
      .eq("status", "accepted")
      .order("created_at", { ascending: false });

    if (requests && requests.length > 0) {
      const activeReq = requests[0];
      setAssignedTeacherReq(activeReq);

      // Récupérer les messages pour extraire les devoirs et bilans de progrès
      const { data: messages } = await supabase
        .from("tutoring_messages")
        .select("*")
        .eq("request_id", activeReq.id)
        .order("created_at", { ascending: false });

      if (messages) {
        const docs = messages
          .filter((m) => m.content?.startsWith("[SAMA_DOC]"))
          .map((m) => {
            const raw = m.content.replace("[SAMA_DOC]", "").trim();
            const parts = raw.split("|");
            return {
              id: m.id,
              type: parts[0]?.trim() || "Devoir",
              dueDate: parts[1]?.replace("Date limite:", "").trim() || "Prochain cours",
              instructions: parts[2]?.replace("Consignes:", "").trim() || raw,
              date: m.created_at
            };
          });
        setHomeworkList(docs);

        const evals = messages
          .filter((m) => m.content?.startsWith("[SAMA_PROGRES]"))
          .map((m) => {
            const raw = m.content.replace("[SAMA_PROGRES]", "").trim();
            const parts = raw.split("|");
            return {
              id: m.id,
              chapter: parts[1]?.replace("Chapitre:", "").trim() || "Chapitre récent",
              score: parts[2]?.replace("Assimilation:", "").trim() || "80%",
              attendance: parts[3]?.replace("Assiduité:", "").trim() || "Présent",
              comment: parts[4]?.replace("Observation:", "").trim() || "Bon travail",
              date: m.created_at
            };
          });
        setProgressEvaluations(evals);
      }

      // Webinaires spécifiques programmés par le professeur assigné
      const { data: vClasses } = await supabase
        .from("virtual_classes")
        .select("*")
        .eq("teacher_id", activeReq.teacher_id)
        .order("scheduled_at", { ascending: true });

      if (vClasses) setWebinarsList(vClasses);
    }

    // 2. Récupérer les documents officiels STRICTEMENT du cycle de l'élève
    const { data: allAnnales } = await supabase.from("annales").select("*").order("created_at", { ascending: false });
    if (allAnnales) {
      const filtered = allAnnales.filter((a) => detectCycle(a.level) === sc);
      setCycleAnnales(filtered.slice(0, 8));
    }

    // 3. Récupérer les vidéos STRICTEMENT du cycle de l'élève
    const { data: allVideos } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
    if (allVideos) {
      const filteredVids = allVideos.filter((v) => detectCycle(v.level) === sc);
      setCycleVideos(filteredVids.slice(0, 6));
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center py-24">
        <i className="fas fa-spinner fa-spin text-sama-primary text-4xl mb-3"></i>
        <p className="text-gray-500 font-semibold text-sm">Chargement de votre Espace Élève...</p>
      </main>
    );
  }

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Bannière personnalisée par cycle */}
      <div className="bg-gradient-to-r from-sama-primary via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-bold mb-3 border border-white/10">
              <i className="fas fa-graduation-cap text-amber-400"></i> Espace Élève • Cycle {studentCycle}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black">
              Bienvenue, {currentUser?.first_name} ! 🚀
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              Classe : <strong className="text-white">{currentUser?.level || "Non précisée"}</strong> • Vos cours, devoirs et révisions sont adaptés exclusivement à votre cycle d&apos;études.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/messagerie"
              className="bg-white hover:bg-gray-100 text-sama-primary font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition flex items-center gap-2 shadow-sm"
            >
              <i className="fas fa-comment-dots text-base"></i> Messagerie Professeur
            </Link>
            <Link
              href="/examens"
              className="bg-sama-orange hover:bg-amber-600 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition flex items-center gap-2 shadow-sm"
            >
              <i className="fas fa-book-open"></i> Annales {studentCycle}
            </Link>
          </div>
        </div>
      </div>

      {/* Grille principale : Professeur attitré & Devoirs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Colonne gauche : Mon Enseignant Attitré */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <i className="fas fa-chalkboard-teacher text-sama-primary"></i> Mon Enseignant Référent
              </h3>
              {assignedTeacherReq && (
                <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                  Actif
                </span>
              )}
            </div>

            {assignedTeacherReq ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="w-14 h-14 bg-sama-primary text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm">
                    {assignedTeacherReq.teacher?.first_name?.[0]}{assignedTeacherReq.teacher?.last_name?.[0]}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base">
                      Prof. {assignedTeacherReq.teacher?.first_name} {assignedTeacherReq.teacher?.last_name}
                    </h4>
                    <p className="text-xs text-sama-primary font-bold">
                      {assignedTeacherReq.teacher?.subject || "Encadrement Général"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      📍 {assignedTeacherReq.teacher?.region || "Sénégal"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link
                    href="/messagerie"
                    className="w-full bg-sama-primary hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <i className="fas fa-comments"></i> Échanger avec mon professeur
                  </Link>
                  <p className="text-[11px] text-gray-400 text-center">
                    🔒 Messagerie sécurisée intégrée à SAMA ACADÉMIE
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto text-xl">
                  <i className="fas fa-user-plus"></i>
                </div>
                <h4 className="font-bold text-gray-800 text-sm">Aucun enseignant attitré pour l&apos;instant</h4>
                <p className="text-xs text-gray-500">
                  Demandez un enseignant vérifié de niveau <strong>{studentCycle}</strong> pour commencer votre suivi personnalisé.
                </p>
                <Link
                  href="/enseignants"
                  className="inline-block bg-sama-primary hover:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm"
                >
                  Trouver un enseignant {studentCycle}
                </Link>
              </div>
            )}
          </div>

          {/* Webinaires & Cours en Direct */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <i className="fas fa-broadcast-tower text-sama-orange"></i> Mes Cours Live & Webinaires
            </h3>

            {webinarsList.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100 space-y-1.5">
                <i className="fas fa-video-slash text-2xl text-gray-300"></i>
                <p className="text-xs text-gray-600 font-semibold">Aucune séance en direct programmée</p>
                <p className="text-[11px] text-gray-400">
                  Votre enseignant vous transmettra l&apos;accès lorsqu&apos;une session sera fixée.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {webinarsList.map((w) => (
                  <div key={w.id} className="p-3 bg-blue-50 border border-blue-100 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                      <h5 className="font-bold text-xs text-gray-900">{w.title}</h5>
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Prévu</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      📅 {new Date(w.scheduled_at).toLocaleDateString("fr-FR")} à {new Date(w.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <Link
                      href={`/classes/${w.id}/room`}
                      className="block w-full bg-sama-primary hover:bg-blue-800 text-white font-bold py-2 text-center rounded-xl text-xs transition"
                    >
                      Rejoindre le cours live
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite (2 tiers) : Devoirs reçus & Évaluations de Progrès */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Devoirs & Fiches d'exercices */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <i className="fas fa-file-signature text-sama-primary"></i> Devoirs &amp; Exercices Assignés ({homeworkList.length})
              </h3>
              <span className="text-xs text-gray-400">Donnés par votre professeur</span>
            </div>

            {homeworkList.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100 space-y-2">
                <i className="fas fa-check-circle text-3xl text-green-500"></i>
                <p className="text-xs font-bold text-gray-700">Aucun devoir en attente !</p>
                <p className="text-[11px] text-gray-400">
                  Les devoirs à la maison et fiches de TD donnés par votre enseignant s&apos;afficheront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {homeworkList.map((hw) => (
                  <div key={hw.id} className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 hover:shadow-xs transition space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="bg-sama-primary text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                        {hw.type}
                      </span>
                      <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                        <i className="fas fa-clock"></i> Date limite : {hw.dueDate}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 font-medium leading-relaxed">
                      {hw.instructions}
                    </p>
                    <div className="flex justify-between items-center pt-1 text-[11px] text-gray-400 border-t border-blue-100/60">
                      <span>Donné le {new Date(hw.date).toLocaleDateString("fr-FR")}</span>
                      <Link href="/messagerie" className="text-sama-primary font-bold hover:underline">
                        Répondre dans la messagerie →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Évaluations & Progrès enregistrés */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <i className="fas fa-chart-line text-green-600"></i> Mes Évaluations &amp; Progrès
            </h3>

            {progressEvaluations.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 text-xs text-gray-500">
                Votre enseignant consigne ici votre niveau d&apos;assimilation après chaque chapitre pour mesurer vos progrès.
              </div>
            ) : (
              <div className="space-y-3">
                {progressEvaluations.map((ev) => (
                  <div key={ev.id} className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-gray-900 text-xs">{ev.chapter}</h4>
                      <span className="bg-emerald-600 text-white font-black text-xs px-2.5 py-0.5 rounded-lg">
                        {ev.score}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 italic">
                      &quot;{ev.comment}&quot;
                    </p>
                    <div className="flex justify-between text-[11px] text-gray-400 pt-1 border-t border-emerald-100">
                      <span>Assiduité : <strong>{ev.attendance}</strong></span>
                      <span>Évalué le {new Date(ev.date).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documents & Annales spécifiques du cycle */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <i className="fas fa-file-pdf text-red-500"></i> Documents &amp; Sujets Officiels — Cycle {studentCycle}
            </h3>
            <p className="text-xs text-gray-500">
              Ces annales et cours correspondent exclusivement à votre cycle d&apos;études.
            </p>
          </div>
          <Link href="/examens" className="text-xs text-sama-primary font-bold hover:underline">
            Voir toute la bibliothèque {studentCycle} →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cycleAnnales.map((annale) => (
            <div key={annale.id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition bg-gray-50/60 space-y-2">
              <span className="bg-blue-100 text-sama-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                {annale.subject}
              </span>
              <h5 className="font-bold text-gray-900 text-xs line-clamp-2">{annale.title}</h5>
              <p className="text-[11px] text-gray-500">Niveau : {annale.level}</p>
              <Link
                href="/examens"
                className="block text-center bg-white border border-gray-200 hover:border-sama-primary text-sama-primary font-bold py-1.5 rounded-xl text-xs transition"
              >
                Consulter in-app
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Vidéos de révision du cycle */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <i className="fas fa-play-circle text-sama-primary"></i> Cours Vidéo — Cycle {studentCycle}
            </h3>
            <p className="text-xs text-gray-500">Explications détaillées en vidéo pour votre niveau.</p>
          </div>
          <Link href="/videos" className="text-xs text-sama-primary font-bold hover:underline">
            Voir toutes les vidéos {studentCycle} →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {cycleVideos.map((video) => (
            <div key={video.id} className="border border-gray-100 rounded-2xl p-4 bg-gray-50 space-y-2 hover:shadow-md transition">
              <div className="h-32 bg-gray-900 rounded-xl flex items-center justify-center text-white relative">
                <i className="fas fa-play-circle text-4xl text-sama-orange"></i>
                <span className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-bold">
                  {video.duration || "15 min"}
                </span>
              </div>
              <h5 className="font-bold text-xs text-gray-900 line-clamp-1">{video.title}</h5>
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>{video.subject}</span>
                <span className="font-bold text-sama-primary">{video.level}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
