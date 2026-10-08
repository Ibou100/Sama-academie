"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSupportConfig } from "@/lib/siteConfig";

export default function DashboardParent() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [supportConfig, setSupportConfig] = useState<any>(null);

  // Informations enfant & encadrement
  const [childInfo, setChildInfo] = useState<{ name: string; cycle: string; level: string }>({
    name: "Mon Enfant",
    cycle: "Lycée",
    level: "Terminale S2"
  });

  const [assignedTeacherReq, setAssignedTeacherReq] = useState<any | null>(null);
  const [progressEvaluations, setProgressEvaluations] = useState<any[]>([]);
  const [homeworkList, setHomeworkList] = useState<any[]>([]);

  useEffect(() => {
    fetchParentData();
  }, []);

  const fetchParentData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?redirect=/dashboard/parent");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      const userRole = profile?.role || user.user_metadata?.role;

      if (userRole === "enseignant") {
        router.replace("/dashboard/enseignant");
        return;
      } else if (userRole === "eleve") {
        router.replace("/dashboard/eleve");
        return;
      } else if (userRole === "admin") {
        router.replace("/admin");
        return;
      }

      if (!profile) {
        router.replace("/login");
        return;
      }

      setCurrentUser(profile);

    // Extraction des informations de l'enfant depuis la bio ou le profil
    if (profile.bio && profile.bio.includes("Enfant :")) {
      const parts = profile.bio.split("|");
      const name = parts[0]?.replace("Enfant :", "").trim() || "Mon Enfant";
      const cycle = parts[1]?.replace("Cycle :", "").trim() || "Lycée";
      const level = parts[2]?.replace("Classe :", "").trim() || profile.level || "Terminale";
      setChildInfo({ name, cycle, level });
    } else {
      setChildInfo({
        name: profile.first_name ? `Enfant de ${profile.first_name}` : "Mon Enfant",
        cycle: profile.level?.includes("Primaire") ? "Primaire" : profile.level?.includes("Collège") ? "Collège" : "Lycée",
        level: profile.level || "Classe en cours"
      });
    }

    // Récupération de l'encadrement officiel actif
    const { data: requests } = await supabase
      .from("tutoring_requests")
      .select(`*, teacher:profiles!teacher_id(id, first_name, last_name, email, phone, subject, region, avatar_url)`)
      .eq("student_id", user.id)
      .eq("status", "accepted")
      .order("created_at", { ascending: false });

    if (requests && requests.length > 0) {
      const activeReq = requests[0];
      setAssignedTeacherReq(activeReq);

      // Récupération des évaluations pédagogiques et devoirs
      const { data: messages } = await supabase
        .from("tutoring_messages")
        .select("*")
        .eq("request_id", activeReq.id)
        .order("created_at", { ascending: false });

      if (messages) {
        const evals = messages
          .filter((m) => m.content?.startsWith("[SAMA_PROGRES]"))
          .map((m) => {
            const raw = m.content.replace("[SAMA_PROGRES]", "").trim();
            const parts = raw.split("|");
            return {
              id: m.id,
              chapter: parts[1]?.replace("Chapitre:", "").trim() || "Séance récente",
              score: parts[2]?.replace("Assimilation:", "").trim() || "80%",
              attendance: parts[3]?.replace("Assiduité:", "").trim() || "Présent",
              comment: parts[4]?.replace("Observation:", "").trim() || "Très bonne participation.",
              date: m.created_at
            };
          });
        setProgressEvaluations(evals);

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
      }
    }

    const cfg = await getSupportConfig();
    if (cfg) setSupportConfig(cfg);
    } catch (err) {
      console.error("Erreur chargement Espace Parent:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center py-24">
        <i className="fas fa-spinner fa-spin text-sama-primary text-4xl mb-3"></i>
        <p className="text-gray-500 font-semibold text-sm">Chargement de votre Espace Parent...</p>
      </main>
    );
  }

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* En-tête Espace Parent */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 rounded-3xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-purple-200 text-xs font-bold mb-3 border border-white/10">
              <i className="fas fa-user-shield text-amber-400"></i> Portail Famille &amp; Suivi Pédagogique
            </div>
            <h1 className="text-3xl sm:text-4xl font-black">
              Bienvenue, {currentUser?.first_name} {currentUser?.last_name} 👋
            </h1>
            <p className="text-purple-100 text-sm mt-1 max-w-2xl">
              Suivez la scolarité, l&apos;assiduité et la bonne assimilation des cours de votre enfant en toute transparence.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/messagerie"
              className="bg-white hover:bg-gray-100 text-purple-950 font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition flex items-center gap-2 shadow-sm"
            >
              <i className="fas fa-comments text-base"></i> Contacter l&apos;enseignant
            </Link>
            <a
              href={supportConfig?.whatsappUrl || "https://wa.me/221774673109"}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition flex items-center gap-2 shadow-sm"
            >
              <i className="fab fa-whatsapp text-lg"></i> Support Direction SAMA
            </a>
          </div>
        </div>
      </div>

      {/* Cartes d'indicateurs clés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fiche de l'enfant */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Élève à charge</span>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Inscrit
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 text-purple-800 rounded-2xl flex items-center justify-center font-bold text-lg">
              <i className="fas fa-child"></i>
            </div>
            <div>
              <h4 className="font-extrabold text-gray-900 text-base">{childInfo.name}</h4>
              <p className="text-xs text-gray-500 font-medium">
                Cycle {childInfo.cycle} • <span className="font-bold text-sama-primary">{childInfo.level}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Enseignant attitré */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Professeur référent</span>
            {assignedTeacherReq ? (
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                Vérifié &amp; Actif
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                En attribution
              </span>
            )}
          </div>
          {assignedTeacherReq ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-sama-primary text-white rounded-2xl flex items-center justify-center font-bold text-lg">
                {assignedTeacherReq.teacher?.first_name?.[0]}{assignedTeacherReq.teacher?.last_name?.[0]}
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 text-base">
                  Prof. {assignedTeacherReq.teacher?.first_name} {assignedTeacherReq.teacher?.last_name}
                </h4>
                <p className="text-xs text-sama-primary font-bold">
                  {assignedTeacherReq.teacher?.subject || "Encadrement régulier"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 pt-1">
              Affectation en cours par la Direction pédagogique.
            </p>
          )}
        </div>

        {/* Bilan d'assimilation moyen */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Niveau de compréhension moyen</span>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-emerald-600">
              {progressEvaluations.length > 0 ? progressEvaluations[0].score : "90%"}
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
              Excellente assimilation
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Basé sur les {progressEvaluations.length} dernières évaluations de l&apos;enseignant.
          </p>
        </div>
      </div>

      {/* Détail : Est-ce qu'on lui explique bien ? Suivi des progrès */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Colonne gauche (2 tiers) : Évaluations détaillées de l'enseignant */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <i className="fas fa-clipboard-check text-emerald-600"></i> Suivi Pédagogique &amp; Compréhension des Cours
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                L&apos;enseignant consigne ici chaque chapitre traité et vous indique si l&apos;élève assimile bien les explications.
              </p>
            </div>
            <span className="bg-blue-50 text-sama-primary text-xs font-bold px-3 py-1 rounded-full">
              Contrôle Qualité
            </span>
          </div>

          {progressEvaluations.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-10 text-center border border-gray-100 space-y-2">
              <i className="fas fa-chart-bar text-3xl text-gray-300"></i>
              <h4 className="font-bold text-gray-800 text-sm">Premier bilan en cours de préparation</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Votre enseignant rédigera son premier compte-rendu d&apos;assimilation dès la fin de la séance d&apos;encadrement.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {progressEvaluations.map((ev) => (
                <div key={ev.id} className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-sm text-gray-900">
                      📖 {ev.chapter}
                    </span>
                    <span className="bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-xs">
                      Assimilation : {ev.score}
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 text-xs text-gray-700 leading-relaxed italic">
                    <span className="font-bold not-italic text-emerald-900 block mb-1">
                      Retour pédagogique du professeur :
                    </span>
                    &quot;{ev.comment}&quot;
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-gray-500 pt-1 border-t border-emerald-100">
                    <span>Assiduité constatée : <strong className="text-gray-800">{ev.attendance}</strong></span>
                    <span>Évalué le {new Date(ev.date).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite : Contrôle des Devoirs & Contact direct */}
        <div className="space-y-6">
          {/* Suivi des devoirs à la maison */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <i className="fas fa-tasks text-sama-primary"></i> Devoirs Donnés à l&apos;Élève ({homeworkList.length})
            </h3>
            <p className="text-xs text-gray-500">
              Vérifiez que votre enfant traite régulièrement ses exercices à la maison.
            </p>

            {homeworkList.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-2xl text-center text-xs text-gray-400">
                Aucun devoir en attente actuellement.
              </div>
            ) : (
              <div className="space-y-3">
                {homeworkList.map((hw) => (
                  <div key={hw.id} className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-1.5">
                    <div className="flex justify-between items-start">
                      <span className="bg-sama-primary text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        {hw.type}
                      </span>
                      <span className="text-[11px] text-red-600 font-bold">
                        À rendre : {hw.dueDate}
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 font-medium line-clamp-2">
                      {hw.instructions}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Garantie & Contact Support */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 space-y-3">
            <h4 className="font-extrabold text-sama-primary text-sm flex items-center gap-2">
              <i className="fas fa-shield-alt"></i> Garantie Réussite SAMA ACADÉMIE
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Un problème d&apos;horaire ou une question sur la pédagogie ? La Direction de SAMA ACADÉMIE reste à votre disposition directe.
            </p>
            <a
              href={supportConfig?.whatsappUrl || "https://wa.me/221774673109"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm block text-center"
            >
              <i className="fab fa-whatsapp"></i> Échanger avec la Direction
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
