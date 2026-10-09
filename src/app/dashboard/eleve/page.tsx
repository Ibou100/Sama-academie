"use client";

import { detectCycle, studentCycleOf } from "@/lib/cycle";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getClientSessionAndRole, safeRedirect } from "@/lib/auth-helpers";
import { supabase } from "@/lib/supabase";

const LYCEE_CONCOURS = [
  {
    sigle: "EPT Thiès",
    nom: "École Polytechnique de Thiès",
    domaine: "Ingénieurs de Conception (DIC)",
    series: "S1, S2, S3",
    icon: "💻",
    couleur: "bg-cyan-800",
    badge: "Polytechnique",
    desc: "Le concours d'ingénieurs le plus réputé d'Afrique de l'Ouest. Formation d'élite en Génie Civil, Électromécanique, Informatique et Télécoms.",
    epreuves: "Mathématiques (4h), Physique-Chimie (3h), Français (2h)",
    admissibilite: "Niveau Terminale S ou Bachelier récent. Forte sélectivité nationale.",
    debouches: "Ingénieurs d'État, Directeurs techniques, BTP, Télécoms, Énergie"
  },
  {
    sigle: "ESP Dakar",
    nom: "École Supérieure Polytechnique (UCAD)",
    domaine: "Ingénierie & Technologie",
    series: "S1, S2, S3, T1, T2",
    icon: "⚙️",
    couleur: "bg-blue-800",
    badge: "Ingénieurs & DUT",
    desc: "Grande école technologique de l'UCAD. Concours direct post-Bac pour le cycle DUT et sélection sur concours d'ingénieurs.",
    epreuves: "Mathématiques, Sciences Physiques, Logique & Culture Générale",
    admissibilite: "Bacheliers scientifiques et techniques. Entrée sur épreuves écrites et dossier.",
    debouches: "Informatique, Réseaux, Génie Chimique, Mécanique, Électrique"
  },
  {
    sigle: "CPGE Thiès",
    nom: "Classes Préparatoires aux Grandes Écoles",
    domaine: "Prépas Scientifiques MPSI & PCSI",
    series: "S1, S2 (Mention Bien/TB)",
    icon: "🔬",
    couleur: "bg-purple-800",
    badge: "Filière d'Élite",
    desc: "Prépare en 2 ans aux concours des plus prestigieuses écoles d'ingénieurs (Polytechnique Paris, Mines-Ponts, Centrale, EPT, ESP). 100% gratuit avec bourse d'excellence et hébergement assurés par l'État.",
    epreuves: "Sélection d'excellence sur dossier de Première & Terminale (Maths, PC, Français)",
    admissibilite: "Mention Bien ou Très Bien exigée au Bac S1 ou S2.",
    debouches: "Polytechnique, Mines Paris, CentraleSupélec, EPT, ESP, ENSAE"
  },
  {
    sigle: "CUGEM",
    nom: "Grandes Écoles Militaires & Officiers",
    domaine: "Armée de Terre, Air, Marine & Gendarmerie",
    series: "S1, S2, S3, L (selon filière)",
    icon: "🎖️",
    couleur: "bg-red-800",
    badge: "Officiers d'Élite",
    desc: "Concours Unique des Grandes Écoles Militaires pour intégrer Saint-Cyr Coëtquidan, l'École de l'Air (France), l'École Navale ou l'Académie Militaire de Meknès.",
    epreuves: "Mathématiques, Sciences Physiques, Culture Générale, Langues & Épreuves sportives",
    admissibilite: "Baccalauréat requis, limite d'âge (18 à 22 ans), aptitude physique et médicale stricte.",
    debouches: "Officiers des Forces Armées Sénégalaises et cadres supérieurs de Défense"
  },
  {
    sigle: "EMS Dakar",
    nom: "École Militaire de Santé (Camp Dial Diop)",
    domaine: "Médecine, Pharmacie, Odontologie, Vétérinaire",
    series: "S1, S2",
    icon: "⚕️",
    couleur: "bg-emerald-800",
    badge: "Médecine Militaire",
    desc: "Forme les médecins, chirurgiens-dentistes et pharmaciens des Armées et des hôpitaux militaires de l'État du Sénégal.",
    epreuves: "Sciences de la Vie et de la Terre (SVT), Sciences Physiques, Mathématiques et Français",
    admissibilite: "Excellence académique en Terminale scientifique, test psychotechnique et visite médicale militaire.",
    debouches: "Médecins-Officiers, Praticiens hospitaliers, Santé publique"
  },
  {
    sigle: "Concours Général",
    nom: "Concours Général Sénégalais",
    domaine: "Excellence Académique Nationale",
    series: "Toutes séries (Terminale & 1ère)",
    icon: "🏆",
    couleur: "bg-amber-800",
    badge: "Prestige National",
    desc: "La plus haute distinction scolaire du Sénégal décernée par le Président de la République récompensant les meilleurs élèves de Terminale et Première du pays.",
    epreuves: "Épreuves reines : Mathématiques, Sciences Physiques, SVT, Philosophie, Français, Histoire-Géo, Citoyenneté",
    admissibilite: "Sélection des meilleurs élèves présentés officiellement par chaque lycée du Sénégal.",
    debouches: "Bourses d'excellence du Chef de l'État, accès prioritaire aux meilleures universités mondiales"
  },
  {
    sigle: "ENSAE Dakar",
    nom: "École Nationale de la Statistique (ANSD)",
    domaine: "Statistique, Données & Économie",
    series: "S1, S2, S3, L2",
    icon: "📊",
    couleur: "bg-teal-800",
    badge: "Data & Économie",
    desc: "Forme les Ingénieurs Statisticiens Économistes (ISE) et Techniciens (ITS). École de renommée panafricaine rattachée à l'Agence Nationale de la Statistique et de la Démographie.",
    epreuves: "Mathématiques approfondies (Analyse, Algèbre, Probabilités), Culture Générale & Français",
    admissibilite: "Concours international très sélectif pour bacheliers et étudiants scientifiques.",
    debouches: "Banques centrales (BCEAO), Institutions internationales (ONU, FMI, Banque Mondiale), Data Scientists"
  },
  {
    sigle: "Concours Directs d'État",
    nom: "Fonction Publique d'État (Post-BAC)",
    domaine: "Administration, Douanes, Police & Finances",
    series: "Toutes séries",
    icon: "🏛️",
    couleur: "bg-slate-800",
    badge: "Fonction Publique",
    desc: "Concours de recrutement direct de l'Administration sénégalaise accessibles aux titulaires du Bac : Douanes, Police, Impôts & Domaines, ENA Cycle B, Greffiers.",
    epreuves: "Dissertation d'Ordre Général, Droit Public / Économie, Tests d'aptitude verbale et logique",
    admissibilite: "Nationalité sénégalaise, titulaire du Baccalauréat, casier judiciaire vierge.",
    debouches: "Fonctionnaires d'État titulaires avec titularisation immédiate"
  }
];

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

  // Modal Concours d'État & Grandes Écoles
  const [selectedConcoursModal, setSelectedConcoursModal] = useState<any | null>(null);

  useEffect(() => {
    // Timeout de sécurité : garantit que le spinner ne tourne JAMAIS plus de 3.5 secondes
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 3500);

    fetchStudentData();

    return () => clearTimeout(safetyTimer);
  }, []);

  const fetchStudentData = async () => {
    try {
      const { user, role, profile } = await getClientSessionAndRole(3000);

      if (!user) {
        setLoading(false);
        safeRedirect("/login", router);
        return;
      }

      if (role === "enseignant") {
        setLoading(false);
        safeRedirect("/dashboard/enseignant", router);
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
        first_name: user.user_metadata?.first_name || "Élève",
        last_name: user.user_metadata?.last_name || "",
        role: "eleve",
        level: user.user_metadata?.level || "Lycée",
        phone: user.user_metadata?.phone || "",
        region: user.user_metadata?.region || "Dakar",
        verified: true,
      };

      setCurrentUser(safeProfile);

    // Détermination du cycle de l'élève
    const sc = studentCycleOf(safeProfile.level);
    const detectedCycle: "Primaire" | "Collège" | "Lycée" = sc === "Primaire" ? "Primaire" : sc === "College" ? "Collège" : "Lycée";
    setStudentCycle(detectedCycle);

    // 1. Récupérer l'enseignant assigné (validé par l'administration)
    let requests = null;
    try {
      const { data: reqsWithProfiles, error: joinErr } = await supabase
        .from("tutoring_requests")
        .select(`*, teacher:profiles!teacher_id(id, first_name, last_name, email, phone, subject, region, avatar_url)`)
        .eq("student_id", user.id)
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
          .eq("student_id", user.id)
          .eq("status", "accepted")
          .order("created_at", { ascending: false });
        requests = simpleReqs || [];
      } catch (_) {}
    }

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
          .filter((m: any) => m.content?.startsWith("[SAMA_DOC]"))
          .map((m: any) => {
            const raw = m.content.replace("[SAMA_DOC]", "").trim();
            if (raw.includes(":::")) {
              const p = raw.split(":::");
              return {
                id: m.id,
                type: p[1] || "Support de cours",
                title: p[2] || "Document",
                dueDate: "Prochain cours",
                instructions: p[3] || "Consultez le document",
                fileUrl: p[4] || null,
                fileName: p[2] || "Document joint",
                date: m.created_at,
              };
            }
            const parts = raw.split("|");
            const header = parts[0]?.trim() || "";
            const type = header.includes(":") ? header.split(":")[0]?.trim() : "Devoir";
            const title = header.includes(":") ? header.split(":").slice(1).join(":").trim() : header;
            const duePart = parts.find((p: string) => p.trim().startsWith("Date limite:"));
            const instPart = parts.find((p: string) => p.trim().startsWith("Consignes:"));
            const filePart = parts.find((p: string) => p.trim().startsWith("Fichier:"));
            const namePart = parts.find((p: string) => p.trim().startsWith("Nom:"));

            const fileUrl = filePart ? filePart.replace("Fichier:", "").trim() : null;
            const fileName = namePart ? namePart.replace("Nom:", "").trim() : (title || "Document");

            return {
              id: m.id,
              type: type || "Devoir",
              title: title || "Devoir",
              dueDate: duePart ? duePart.replace("Date limite:", "").trim() : "Prochain cours",
              instructions: instPart ? instPart.replace("Consignes:", "").trim() : (fileUrl ? "Consultez le document joint." : raw),
              fileUrl,
              fileName,
              date: m.created_at
            };
          });
        setHomeworkList(docs);

        const evals = messages
          .filter((m: any) => m.content?.startsWith("[SAMA_PROGRES]"))
          .map((m: any) => {
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
      const filtered = allAnnales.filter((a: any) => detectCycle(a.level) === sc);
      setCycleAnnales(filtered.slice(0, 8));
    }

    // 3. Récupérer les vidéos STRICTEMENT du cycle de l'élève
    const { data: allVideos } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
    if (allVideos) {
      const filteredVids = allVideos.filter((v: any) => detectCycle(v.level) === sc);
      setCycleVideos(filteredVids.slice(0, 6));
    }
    } catch (err) {
      console.error("Erreur chargement Espace Élève:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center py-24">
        <i className="fas fa-spinner fa-spin text-sama-primary text-4xl mb-3"></i>
        <p className="text-gray-500 font-semibold text-sm">Chargement de votre Espace Élève...</p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 bg-blue-50 text-sama-primary rounded-full flex items-center justify-center text-3xl mb-4">
          <i className="fas fa-graduation-cap"></i>
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Espace Élève SAMA ACADÉMIE</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6">
          Veuillez vous connecter avec vos identifiants élève pour consulter vos cours et devoirs.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className="btn-primary text-sm px-6 py-2.5">
            Se connecter
          </Link>
          <Link href="/dashboard/enseignant" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm px-5 py-2.5 rounded-xl transition">
            Espace Enseignant
          </Link>
        </div>
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
            {studentCycle === "Lycée" && (
              <Link
                href="/examens?cycle=Concours"
                className="bg-purple-900 hover:bg-purple-950 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition flex items-center gap-2 shadow-sm border border-purple-400/30"
              >
                <i className="fas fa-landmark text-amber-300"></i> Concours &amp; Grandes Écoles
              </Link>
            )}
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
                  <div key={hw.id} className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 hover:shadow-xs transition space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="bg-sama-primary text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                        {hw.type}
                      </span>
                      <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                        <i className="fas fa-clock"></i> Date limite : {hw.dueDate}
                      </span>
                    </div>

                    {hw.title && (
                      <h4 className="font-extrabold text-sm text-gray-900 leading-snug">
                        {hw.title}
                      </h4>
                    )}

                    <p className="text-xs text-gray-700 font-medium leading-relaxed">
                      {hw.instructions}
                    </p>

                    {hw.fileUrl && (
                      <div className="pt-1">
                        <a
                          href={hw.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={hw.fileName}
                          className="inline-flex items-center gap-2 bg-sama-primary hover:bg-blue-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-xs"
                        >
                          <i className="fas fa-file-download text-sama-orange"></i>
                          <span>Consulter / Télécharger le document ({hw.fileName})</span>
                        </a>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 text-[11px] text-gray-400 border-t border-blue-100/60">
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

      {/* SECTION EXCLUSIVE LYCÉE : CONCOURS D'ÉTAT & GRANDES ÉCOLES DU SÉNÉGAL */}
      {studentCycle === "Lycée" && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-purple-500/20 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-gray-900 text-xs font-black uppercase mb-2 shadow-sm">
                <i className="fas fa-landmark"></i> Spécial Lycée • Préparation Post-BAC
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                <span>Concours d&apos;État &amp; Grandes Écoles du Sénégal</span>
                <span className="text-amber-400 text-lg">⭐</span>
              </h3>
              <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl leading-relaxed">
                Anticipez votre admission post-BAC dans les filières d&apos;élite sénégalaises : Écoles d&apos;Ingénieurs (EPT, ESP), Classes Préparatoires (CPGE Thiès), Grandes Écoles Militaires (CUGEM, EMS), Écoles de Statistique et Concours d&apos;État.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
              <Link
                href="/examens?cycle=Concours"
                className="bg-sama-orange hover:bg-amber-600 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
              >
                <i className="fas fa-file-signature"></i> Annales &amp; Sujets de Concours
              </Link>
              <Link
                href="/orientation"
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition flex items-center gap-2 border border-white/20 backdrop-blur-md"
              >
                <i className="fas fa-compass"></i> Guide Grandes Écoles
              </Link>
            </div>
          </div>

          {/* Grille des 8 Concours Clés pour Lycéens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {LYCEE_CONCOURS.map((concours, index) => (
              <div
                key={index}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl backdrop-blur-sm group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{concours.icon}</span>
                    <span className="bg-white/10 text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-white/10">
                      {concours.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-white group-hover:text-amber-300 transition">
                      {concours.sigle}
                    </h4>
                    <p className="text-[11px] font-bold text-purple-200">{concours.nom}</p>
                    <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider mt-0.5">
                      {concours.domaine}
                    </p>
                  </div>

                  <p className="text-[11px] text-gray-300 line-clamp-3 leading-relaxed">
                    {concours.desc}
                  </p>

                  <div className="bg-black/30 rounded-xl p-2.5 space-y-1 border border-white/5">
                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                      <i className="fas fa-user-graduate text-purple-300 text-[9px]"></i> Séries : <strong className="text-white">{concours.series}</strong>
                    </div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-1 truncate">
                      <i className="fas fa-pen text-amber-300 text-[9px]"></i> Épreuves : <span className="text-gray-200 truncate">{concours.epreuves}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/10 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedConcoursModal(concours)}
                    className="flex-1 bg-white text-gray-900 hover:bg-amber-300 font-extrabold text-[11px] py-2 px-3 rounded-xl transition text-center shadow-sm"
                  >
                    Détails &amp; Épreuves
                  </button>
                  <Link
                    href="/examens?cycle=Concours"
                    className="bg-white/10 hover:bg-white/20 text-white text-[11px] py-2 px-2.5 rounded-xl transition border border-white/10"
                    title="Voir les annales"
                  >
                    <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-200">
            <div className="flex items-center gap-2.5">
              <i className="fas fa-info-circle text-amber-400 text-base"></i>
              <span>
                <strong>Conseil SAMA ACADÉMIE :</strong> Pour les séries S1, S2 et S3, commencez la préparation des concours d&apos;ingénieurs (EPT/ESP/CPGE) dès le premier trimestre de la Terminale.
              </span>
            </div>
            <Link
              href="/orientation"
              className="text-amber-300 hover:underline font-bold whitespace-nowrap flex items-center gap-1 text-xs"
            >
              Voir le calendrier officiel des concours →
            </Link>
          </div>
        </div>
      )}

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

      {/* MODAL DÉTAILS CONCOURS LYCÉE */}
      {selectedConcoursModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedConcoursModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 relative border border-gray-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedConcoursModal.icon}</span>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black uppercase mb-1">
                    {selectedConcoursModal.badge}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                    {selectedConcoursModal.sigle}
                  </h3>
                  <p className="text-xs text-gray-500 font-bold">{selectedConcoursModal.nom}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedConcoursModal(null)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">Présentation</h4>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  {selectedConcoursModal.desc}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sama-primary flex items-center gap-1">
                    <i className="fas fa-graduation-cap"></i> Séries Éligibles
                  </span>
                  <p className="font-bold text-gray-900 text-xs">{selectedConcoursModal.series}</p>
                </div>

                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 flex items-center gap-1">
                    <i className="fas fa-award"></i> Domaine
                  </span>
                  <p className="font-bold text-gray-900 text-xs">{selectedConcoursModal.domaine}</p>
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                  <i className="fas fa-pencil-alt"></i> Nature des Épreuves Écrites
                </span>
                <p className="font-extrabold text-gray-900 text-xs">{selectedConcoursModal.epreuves}</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                  <i className="fas fa-check-circle text-green-600"></i> Conditions &amp; Admissibilité
                </span>
                <p className="text-gray-700 leading-relaxed">{selectedConcoursModal.admissibilite}</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                  <i className="fas fa-briefcase text-blue-600"></i> Débouchés &amp; Métiers
                </span>
                <p className="text-gray-700 font-semibold">{selectedConcoursModal.debouches}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/examens?cycle=Concours"
                className="w-full sm:flex-1 bg-sama-primary hover:bg-blue-800 text-white font-extrabold text-xs py-3 px-4 rounded-xl text-center transition shadow-sm flex items-center justify-center gap-2"
              >
                <i className="fas fa-file-pdf"></i> Voir les Annales &amp; Sujets du Concours
              </Link>
              <Link
                href="/orientation"
                className="w-full sm:flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-3 px-4 rounded-xl text-center transition flex items-center justify-center gap-2"
              >
                <i className="fas fa-compass"></i> Fiche d&apos;Orientation Complète
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
