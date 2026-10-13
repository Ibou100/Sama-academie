"use client";

import { detectCycle, studentCycleOf } from "@/lib/cycle";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ALL_OFFICIAL_EXAMS, EXAMS_BY_KEY, OfficialExamDocument } from "@/data/officialExamsData";

const DEFAULT_DOCUMENTS: any[] = ALL_OFFICIAL_EXAMS;

const CYCLES = [
  { id: "TOUS", label: "Tous les cycles", icon: "fas fa-layer-group" },
  { id: "Primaire", label: "Primaire (CI - CM2, CFEE)", icon: "fas fa-child" },
  { id: "College", label: "Collège (6e - 3e, BFEM)", icon: "fas fa-user-graduate" },
  { id: "Lycee", label: "Lycée (Seconde - Terminale, BAC)", icon: "fas fa-graduation-cap" },
  { id: "Concours", label: "Concours d'État & Grandes Écoles", icon: "fas fa-award" },
];

const CONCOURS = [
  { name: "CREM / CRFPE", full: "Recrutement des Élèves-Maîtres (Primaire)", icon: "🎒", desc: "Instituteurs d'école primaire de l'État (CAP)", couleur: "bg-emerald-700" },
  { name: "FASTEF", full: "Faculté des Sciences de l'Éducation (ex-ENS)", icon: "📚", desc: "CAPES & CAEM : Professeurs de Lycée et Collège", couleur: "bg-indigo-700" },
  { name: "INSEPS", full: "Éducation Populaire et Sport (UCAD)", icon: "🏃🏾‍♂️", desc: "CAPEPS : Professeurs d'Éducation Physique & Sportive (EPS)", couleur: "bg-amber-700" },
  { name: "ENSETP", full: "Enseignement Technique & Professionnel", icon: "📐", desc: "CAPET : Professeurs de Lycées Techniques d'État", couleur: "bg-blue-800" },
  { name: "CFJ", full: "Centre de Formation Judiciaire du Sénégal", icon: "⚖️", desc: "Magistrats (Juges, Procureurs) et Greffiers en Chef", couleur: "bg-slate-800" },
  { name: "ENA", full: "École Nationale d'Administration", icon: "🏛️", desc: "Préfets, Diplomates, Trésor, Impôts & Domaines", couleur: "bg-blue-700" },
  { name: "ENSAE", full: "Statistique et Analyse Économique (ANSD)", icon: "📊", desc: "Ingénieurs Statisticiens Économistes (ISE & ITS)", couleur: "bg-teal-800" },
  { name: "CUGEM", full: "Grandes Écoles Militaires étrangères", icon: "🌍", desc: "Saint-Cyr, Navale, École de l'Air, Meknès (Officiers)", couleur: "bg-red-800" },
  { name: "EMS Dakar", full: "École Militaire de Santé (Camp Dial Diop)", icon: "⚕️", desc: "Médecins, Pharmaciens, Chirurgiens-Dentistes militaires", couleur: "bg-emerald-800" },
  { name: "EAA Thiès", full: "École de l'Armée de l'Air (Base BA 70)", icon: "✈️", desc: "Pilotes de chasse, Transport, Hélicoptères & Avionique", couleur: "bg-sky-800" },
  { name: "CPGE Thiès", full: "Classes Préparatoires aux Grandes Écoles", icon: "🔬", desc: "MPSI, PCSI — Prépas scientifiques d'excellence", couleur: "bg-purple-800" },
  { name: "EPT / ESP", full: "Concours d'Ingénieurs Polytechnique", icon: "💻", desc: "Diplôme d'Ingénieur de Conception d'État (DIC)", couleur: "bg-cyan-800" },
  { name: "Police", full: "Police Nationale du Sénégal", icon: "👮🏾", desc: "Commissaires, Officiers, Sous-Officiers, Agents", couleur: "bg-slate-700" },
  { name: "Gendarmerie", full: "Gendarmerie Nationale", icon: "🎖️", desc: "Sous-officiers et Officiers de Gendarmerie", couleur: "bg-green-700" },
  { name: "Douanes", full: "Douanes Sénégalaises", icon: "🛃", desc: "Inspecteurs, Contrôleurs et Préposés des Douanes", couleur: "bg-yellow-700" },
  { name: "INFAS / ENDSS", full: "Santé Publique & Soins Infirmiers", icon: "🏥", desc: "Infirmiers d'État, Sages-femmes, Techniciens de santé", couleur: "bg-rose-700" },
  { name: "Eaux & Forêts", full: "Eaux, Forêts, Chasse & Parcs", icon: "🌳", desc: "Agents et Inspecteurs forestiers de l'État", couleur: "bg-teal-700" },
  { name: "Sapeurs-Pompiers", full: "Brigade Nationale des Sapeurs-Pompiers", icon: "🚒", desc: "Militaires et Sous-officiers du feu (BNSP)", couleur: "bg-orange-700" }
];

export default function Examens() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState("Lycee");

  // Visionneuse Sécurisée In-App
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);
  const [viewerTab, setViewerTab] = useState<"sujet" | "corrige" | "bareme" | "pdf">("sujet");

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profile) {
          setUserProfile(profile);
          setIsPremium(!!profile.is_premium);

          // Détection automatique du cycle de l'utilisateur pour adapter la vue
          const lvl = (profile.level || "").toLowerCase();
          const dc = detectCycle(lvl);
          if (dc) setSelectedCycle(dc);
        }
      }

      // Lecture des paramètres d'URL (ex: /examens?cycle=Concours)
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const urlCycle = urlParams.get("cycle");
        if (urlCycle && (urlCycle === "Concours" || urlCycle === "Lycee" || urlCycle === "College" || urlCycle === "Primaire" || urlCycle === "TOUS")) {
          setSelectedCycle(urlCycle);
        }
      }
    };

    const fetchAnnales = async () => {
      setLoading(true);
      const { data: dbAnnales } = await supabase.from("annales").select("*").order("created_at", { ascending: false });
      const validDbAnnales = (dbAnnales || []).filter((doc: any) => {
        const t = (doc.title || "").toLowerCase();
        return !t.includes("probe") && !t.includes("test");
      });

      if (validDbAnnales.length > 0) {
        // Classifier chaque annale et l'enrichir avec les données officielles
        const mapped = validDbAnnales.map((doc) => {
          const isDocConcours = doc.level && (doc.level.toLowerCase().includes("concours") || doc.level.toLowerCase().includes("ept") || doc.level.toLowerCase().includes("esp") || doc.level.toLowerCase().includes("cpge"));
          const cycle = isDocConcours ? "Concours" : (detectCycle(doc.level) || "Lycee");
          const rich = EXAMS_BY_KEY[doc.id] || EXAMS_BY_KEY[doc.title] || EXAMS_BY_KEY[doc.level];

          return {
            ...doc,
            ...(rich || {}),
            cycle: doc.cycle || (rich as any)?.cycle || cycle
          };
        });

        const existingIds = new Set(mapped.map((d: any) => d.id));
        const combined = [...mapped, ...ALL_OFFICIAL_EXAMS.filter(e => !existingIds.has(e.id))];
        setDocuments(combined);
      } else {
        setDocuments(ALL_OFFICIAL_EXAMS);
      }
      setLoading(false);
    };

    fetchUserData();
    fetchAnnales();
  }, []);

  const openDocumentViewer = (doc: any) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
    } else {
      const match = EXAMS_BY_KEY[doc.id] 
        || EXAMS_BY_KEY[doc.name] 
        || EXAMS_BY_KEY[doc.title] 
        || EXAMS_BY_KEY[doc.level]
        || ALL_OFFICIAL_EXAMS.find(e => e.id === doc.id || (doc.title && e.title.toLowerCase().includes(doc.title.toLowerCase().substring(0, 15))))
        || doc;

      setViewerDoc(match);
      setViewerTab("sujet");
    }
  };

  // Détection du rôle élève et cycle associé
  const isStudent = userProfile?.role === "eleve";
  const studentLevel = (userProfile?.level || "").toLowerCase();
  const studentCycle: "Primaire" | "College" | "Lycee" | null = isStudent ? studentCycleOf(studentLevel) : null;

  // Filtrage intelligent : pour un élève de Lycée, autoriser la consultation des épreuves du BAC ET des Concours d'État / Grandes Écoles
  let effectiveCycle = selectedCycle;
  if (isStudent && studentCycle) {
    if (studentCycle === "Lycee") {
      effectiveCycle = (selectedCycle === "Concours" || selectedCycle === "TOUS") ? selectedCycle : "Lycee";
    } else {
      effectiveCycle = studentCycle;
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const isDocConcours = doc.level && (
      doc.level.toLowerCase().includes("concours") || 
      doc.level.toLowerCase().includes("ept") || 
      doc.level.toLowerCase().includes("esp") || 
      doc.level.toLowerCase().includes("cpge") ||
      doc.level.toLowerCase().includes("grandes")
    );
    const dc = doc.cycle || (isDocConcours ? "Concours" : detectCycle(doc.level));

    // RÈGLE SAMA ACADÉMIE : Cloisonnement strict des élèves par cycle scolaire
    if (isStudent && studentCycle) {
      if (studentCycle === "Primaire") {
        return dc === "Primaire";
      }
      if (studentCycle === "College") {
        return dc === "College";
      }
      if (studentCycle === "Lycee") {
        // RÈGLE ABSOLUE : Un lycéen (comme Karim en Terminale S2) ne doit JAMAIS voir Primaire (CFEE) ou Collège (BFEM)
        if (dc === "Primaire" || dc === "College") {
          return false;
        }

        // Si l'onglet BAC est choisi, afficher uniquement les épreuves du Lycée
        if (selectedCycle === "Lycee") {
          return dc === "Lycee";
        }
        // Si l'onglet Concours est choisi, afficher les concours Grandes Écoles
        if (selectedCycle === "Concours") {
          return dc === "Concours";
        }
        // Si "TOUS" : afficher uniquement Lycée et Concours Grandes Écoles
        return dc === "Lycee" || dc === "Concours";
      }
    }

    // Visiteur ou utilisateur non-élève (enseignant, parent, visiteur)
    if (effectiveCycle === "TOUS") return true;
    return dc === effectiveCycle;
  });

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

      {/* Modal de connexion requise */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAuthModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 text-sama-primary rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                <i className="fas fa-lock"></i>
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900">Espace Document Protégé</h3>
              <p className="text-gray-500 text-sm mt-1">
                La consultation des sujets et corrigés officiels s&apos;effectue dans la visionneuse sécurisée de <strong>SAMA ACADÉMIE</strong>.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-sama-primary">
                <i className="fas fa-shield-alt"></i> Protection contre la fuite des ressources
              </p>
              <p>
                Connectez-vous avec votre compte élève ou parent pour consulter instantanément les épreuves en ligne.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/login?redirect=/examens"
                className="block w-full bg-sama-primary text-white font-bold py-3 text-center rounded-xl hover:bg-blue-800 transition shadow-sm text-sm"
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                className="block w-full bg-gray-100 text-gray-700 font-bold py-3 text-center rounded-xl hover:bg-gray-200 transition text-sm"
              >
                Créer un compte gratuit
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===== VISIONNEUSE SÉCURISÉE IN-APP (DOCUMENT VIEWER) ===== */}
      {viewerDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in" onContextMenu={(e) => e.preventDefault()}>
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">

            {/* Header Visionneuse */}
            <div className="bg-sama-blue text-white p-4 sm:p-5 flex items-center justify-between gap-4 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="bg-sama-orange text-sama-blue font-black text-xs px-2.5 py-1 rounded-full uppercase flex-shrink-0">
                  {viewerDoc.level}
                </span>
                <div className="min-w-0">
                  <h3 className="font-black text-sm sm:text-base leading-tight truncate">{viewerDoc.title}</h3>
                  <p className="text-xs text-blue-200 mt-0.5 truncate">
                    {viewerDoc.institution || "Ministère de l'Éducation Nationale — DEXCO"} • {viewerDoc.session || "Session Officielle"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => window.print()}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition"
                  title="Imprimer cette épreuve pour vos révisions"
                >
                  <i className="fas fa-print"></i> Imprimer
                </button>
                <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold">
                  <i className="fas fa-shield-alt text-sama-orange"></i> Anti-Fuite
                </div>
                <button
                  onClick={() => setViewerDoc(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                  title="Fermer la visionneuse"
                >
                  <i className="fas fa-times text-base"></i>
                </button>
              </div>
            </div>

            {/* Barre de Navigation des Onglets */}
            <div className="bg-gray-100 px-4 sm:px-6 py-2 flex items-center gap-2 border-b border-gray-200 flex-shrink-0 overflow-x-auto">
              <button
                onClick={() => setViewerTab("sujet")}
                className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  viewerTab === "sujet" ? "bg-white text-sama-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="fas fa-file-alt"></i> Épreuve Officielle
              </button>

              <button
                onClick={() => setViewerTab("corrige")}
                className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  viewerTab === "corrige" ? "bg-white text-sama-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="fas fa-check-circle text-sama-orange"></i> Corrigé Détaillé {isPremium ? "⭐" : "🔒"}
              </button>

              <button
                onClick={() => setViewerTab("bareme")}
                className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  viewerTab === "bareme" ? "bg-white text-sama-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="fas fa-tasks text-blue-600"></i> Barème DEXCO
              </button>

              {viewerDoc.file_url && viewerDoc.file_url !== "#" && (
                <button
                  onClick={() => setViewerTab("pdf")}
                  className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                    viewerTab === "pdf" ? "bg-white text-sama-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <i className="fas fa-file-pdf text-red-600"></i> PDF Numérisé
                </button>
              )}

              <div className="ml-auto text-[11px] text-gray-400 hidden lg:block whitespace-nowrap">
                Document certifié • SAMA ACADÉMIE
              </div>
            </div>

            {/* Corps du Document avec Filigrane de Sécurité */}
            <div 
              className="flex-grow overflow-y-auto p-4 sm:p-8 md:p-10 bg-slate-50 relative select-none"
              style={{ userSelect: "none", WebkitUserSelect: "none" }}
            >
              {/* Filigrane discret en fond */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-around items-center opacity-[0.03] select-none text-2xl sm:text-4xl font-black rotate-[-25deg] uppercase">
                <span>SAMA ACADÉMIE - DOCUMENT OFFICIEL DU SÉNÉGAL</span>
                <span>CONSULTATION STRICTEMENT PÉDAGOGIQUE</span>
                <span>REPRODUCTION & DIFFUSION INTERDITES</span>
              </div>

              {viewerTab === "sujet" && (
                /* === ONGLET SUJET OFFICIEL === */
                <div className="max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                  {/* En-tête solennel République du Sénégal */}
                  <div className="border-b-2 border-gray-900 pb-5 text-center space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-gray-700">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600"></span>
                        RÉPUBLIQUE DU SÉNÉGAL
                      </span>
                      <span className="italic text-gray-500 font-serif lowercase tracking-normal">Un Peuple - Un But - Une Foi</span>
                    </div>

                    <p className="text-xs font-black uppercase text-sama-primary tracking-wide">
                      {viewerDoc.institution || "Ministère de l'Éducation Nationale — DEXCO"}
                    </p>

                    <div className="inline-block bg-sama-blue text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {viewerDoc.session || "Session Officielle Nationale"}
                    </div>

                    <h4 className="text-lg sm:text-xl font-black text-gray-950 pt-1 tracking-tight">
                      {viewerDoc.title}
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold text-gray-800 pt-3 border-t border-gray-200 mt-2 text-center bg-gray-50 p-2.5 rounded-xl">
                      <div><span className="text-gray-400 block text-[10px] uppercase">Niveau</span>{viewerDoc.level}</div>
                      <div><span className="text-gray-400 block text-[10px] uppercase">Matière</span>{viewerDoc.subject}</div>
                      <div><span className="text-gray-400 block text-[10px] uppercase">Durée</span>{viewerDoc.duration || "Durée officielle"}</div>
                      <div><span className="text-gray-400 block text-[10px] uppercase">Coefficient</span>Coeff. {viewerDoc.coefficient || 3}</div>
                    </div>
                  </div>

                  {/* Instructions officielles aux candidats */}
                  {viewerDoc.instructions && viewerDoc.instructions.length > 0 && (
                    <div className="bg-amber-50/70 border-l-4 border-amber-500 p-4 rounded-r-xl text-xs text-amber-950 space-y-1.5">
                      <p className="font-black flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-amber-900">
                        <i className="fas fa-exclamation-triangle text-amber-600"></i> Instructions Officielles aux Candidats
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 pl-1">
                        {viewerDoc.instructions.map((inst: string, idx: number) => (
                          <li key={idx} className="leading-relaxed">{inst}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sections de l'épreuve */}
                  {viewerDoc.sections && viewerDoc.sections.length > 0 ? (
                    <div className="space-y-8 pt-2">
                      {viewerDoc.sections.map((section: any, sIdx: number) => (
                        <div key={sIdx} className="space-y-4 pt-6 border-t border-gray-200 first:border-0 first:pt-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-100 p-3.5 rounded-xl border border-slate-200">
                            <h5 className="font-black text-gray-900 text-xs sm:text-sm tracking-wide flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-sama-primary text-white flex items-center justify-center text-xs font-black">
                                {sIdx + 1}
                              </span>
                              {section.title}
                            </h5>
                            {section.points && (
                              <span className="bg-white text-sama-primary font-black text-xs px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
                                {section.points}
                              </span>
                            )}
                          </div>

                          {section.instructions && (
                            <p className="text-xs font-semibold text-gray-600 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                              {section.instructions}
                            </p>
                          )}

                          {section.textExcerpt && (
                            <div className="bg-amber-50/40 border-l-4 border-sama-orange p-5 rounded-r-2xl space-y-2 font-serif text-gray-800 text-xs sm:text-sm leading-relaxed italic shadow-2xs">
                              <div className="flex justify-between items-center text-xs font-sans not-italic text-gray-500 font-bold border-b border-amber-200/60 pb-1.5 mb-2">
                                <span>Texte d&apos;Étude Officiel</span>
                                <span>{section.textExcerpt.author} — <em className="text-gray-700">{section.textExcerpt.work}</em></span>
                              </div>
                              <p className="whitespace-pre-line leading-relaxed">{section.textExcerpt.content}</p>
                            </div>
                          )}

                          <div className="space-y-4">
                            {section.questions.map((q: any, qIdx: number) => (
                              <div key={qIdx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                                <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                                  <span className="font-black text-sama-primary text-xs sm:text-sm">
                                    {q.num}
                                  </span>
                                  {q.points && (
                                    <span className="text-[11px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                                      {q.points}
                                    </span>
                                  )}
                                </div>
                                <p className="font-bold text-gray-900 text-xs sm:text-sm leading-relaxed">
                                  {q.question}
                                </p>
                                {q.details && q.details.length > 0 && (
                                  <div className="space-y-1.5 pl-2 text-xs sm:text-sm text-gray-700 leading-relaxed bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                                    {q.details.map((d: string, dIdx: number) => (
                                      <p key={dIdx} className="leading-relaxed">{d}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Fallback anciens exercices */
                    <div className="space-y-4">
                      {(viewerDoc.exercices || []).map((ex: any, i: number) => (
                        <div key={i} className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <h5 className="font-black text-sama-primary text-sm flex items-center justify-between">
                            <span>{ex.num}</span>
                            <span className="text-[10px] bg-white px-2 py-0.5 rounded border text-gray-500 uppercase font-bold">Session Officielle</span>
                          </h5>
                          <p className="text-gray-700 text-xs sm:text-sm">
                            {ex.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-6 border-t border-gray-200 text-xs text-gray-500 text-center italic space-y-1">
                    <p>Fin du sujet officiel du Sénégal • SAMA ACADÉMIE — Bibliothèque Pédagogique d&apos;Excellence</p>
                    <p className="text-[11px] text-gray-400">Consultez l&apos;onglet &quot;Corrigé Détaillé&quot; pour la résolution intégrale et les astuces du jury.</p>
                  </div>
                </div>
              )}

              {viewerTab === "corrige" && (
                /* === ONGLET CORRIGÉ === */
                <div className="max-w-3xl mx-auto space-y-6">
                  {isPremium ? (
                    <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-lg">
                          <i className="fas fa-check-double"></i>
                        </div>
                        <div>
                          <h4 className="text-base font-black text-gray-900">Corrigé Détaillé & Méthodologie Pédagogique</h4>
                          <p className="text-xs text-gray-500">Rédigé et certifié par le corps professoral de SAMA ACADÉMIE</p>
                        </div>
                      </div>

                      {viewerDoc.corrige?.methodologie && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-1 text-xs text-blue-950">
                          <p className="font-black flex items-center gap-1.5 text-sama-primary">
                            <i className="fas fa-lightbulb"></i> Méthodologie Recommandée
                          </p>
                          <p className="leading-relaxed text-blue-900">{viewerDoc.corrige.methodologie}</p>
                        </div>
                      )}

                      {viewerDoc.corrige?.conseilsJury && (
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-1 text-xs text-emerald-950">
                          <p className="font-black flex items-center gap-1.5 text-emerald-800">
                            <i className="fas fa-award"></i> Recommandations du Jury d&apos;Admission
                          </p>
                          <p className="leading-relaxed text-emerald-900">{viewerDoc.corrige.conseilsJury}</p>
                        </div>
                      )}

                      {viewerDoc.corrige?.sections && viewerDoc.corrige.sections.length > 0 ? (
                        <div className="space-y-6">
                          {viewerDoc.corrige.sections.map((cSec: any, cIdx: number) => (
                            <div key={cIdx} className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                              <h5 className="font-black text-gray-900 text-xs sm:text-sm flex items-center justify-between">
                                <span>{cSec.title}</span>
                                {cSec.points && (
                                  <span className="text-[11px] bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded-full">
                                    {cSec.points}
                                  </span>
                                )}
                              </h5>
                              <div className="text-xs sm:text-sm text-gray-800 font-sans leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-gray-100 shadow-2xs font-mono">
                                {cSec.solution}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 font-mono text-xs text-gray-800 leading-normal whitespace-pre-line">
                          {viewerDoc.sample_corrige || viewerDoc.corrige || "Corrigé en cours de numérisation par l'équipe pédagogique."}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Verrou Premium */
                    <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-amber-200 text-center space-y-5">
                      <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                        <i className="fas fa-crown"></i>
                      </div>
                      <h4 className="text-xl sm:text-2xl font-black text-gray-900">
                        Corrigé Intégral Réservé aux Abonnés Premium
                      </h4>
                      <p className="text-gray-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                        Les explications rédigées pas à pas, les barèmes officiels détaillés et les conseils méthodologiques de nos inspecteurs et professeurs certifiés sont réservés aux membres Premium.
                      </p>
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                          href="/tarifs"
                          className="w-full sm:w-auto bg-sama-primary hover:bg-blue-800 text-white font-bold py-3.5 px-6 rounded-xl transition text-xs shadow-sm"
                        >
                          Passer en mode Premium ⭐
                        </Link>
                        <button
                          onClick={() => setViewerTab("sujet")}
                          className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 px-6 rounded-xl transition text-xs"
                        >
                          Revenir au sujet officiel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewerTab === "bareme" && (
                /* === ONGLET BARÈME OFFICIEL === */
                <div className="max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-sama-primary flex items-center justify-center font-bold text-lg">
                      <i className="fas fa-tasks"></i>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-gray-900">Grille Officielle de Notation & Barème DEXCO</h4>
                      <p className="text-xs text-gray-500">Critères d&apos;évaluation appliqués par les inspecteurs et correcteurs nationaux</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(viewerDoc.bareme || [
                      { critere: "Maîtrise du programme officiel", points: "8 pts", description: "Justesse des connaissances et des définitions." },
                      { critere: "Démarche et rigueur du raisonnement", points: "8 pts", description: "Clarté de la démonstration ou du plan de rédaction." },
                      { critere: "Qualité de l'expression et présentation", points: "4 pts", description: "Orthographe, propreté et soin de la copie." }
                    ]).map((item: any, bIdx: number) => (
                      <div key={bIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h5 className="font-extrabold text-gray-900 text-xs sm:text-sm">{item.critere}</h5>
                          <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
                        </div>
                        <span className="bg-sama-primary text-white font-black text-xs px-3 py-1 rounded-lg flex-shrink-0">
                          {item.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewerTab === "pdf" && viewerDoc.file_url && viewerDoc.file_url !== "#" && (
                /* === ONGLET PDF NUMÉRISÉ === */
                <div className="w-full h-full min-h-[550px] flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200">
                  <iframe
                    src={viewerDoc.file_url}
                    className="w-full h-full flex-grow border-0 min-h-[550px]"
                    title="PDF Officiel"
                  />
                </div>
              )}
            </div>

            {/* Footer Visionneuse */}
            <div className="bg-white border-t border-gray-200 p-3 sm:p-4 px-6 flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
              <span className="flex items-center gap-1.5 font-medium">
                <i className="fas fa-lock text-sama-primary"></i> SAMA ACADÉMIE Secure Document Reader
              </span>
              <button
                onClick={() => setViewerDoc(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl transition text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EN-TÊTE PRINCIPAL ===== */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-sama-primary text-xs font-bold mb-2">
              <i className="fas fa-shield-alt"></i> Consultation Sécurisée In-App
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Annales & Examens Officiels du Sénégal
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Consultez les sujets officiels et leurs corrigés méthodologiques directement sur la plateforme.
            </p>
          </div>

          {userProfile && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs text-gray-700 font-medium">
              Profil connecté : <strong>{userProfile.first_name}</strong> ({userProfile.level || "Cycle général"})
            </div>
          )}
        </div>

        {/* Sélecteur de Cycle Personnalisé (Adapté et enrichi pour le Lycée) */}
        {isStudent && studentCycle ? (
          <div className="mt-6 pt-6 border-t border-gray-100">
            {studentCycle === "Lycee" ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <span className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-amber-300 flex items-center justify-center font-bold text-2xl border border-white/10 shadow-sm flex-shrink-0">
                        🎓
                      </span>
                      <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-black uppercase mb-1">
                          <i className="fas fa-award text-amber-300"></i> Programme Spécial Lycée &amp; Post-BAC
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                          Espace d&apos;Excellence Lycée : BAC &amp; Concours des Grandes Écoles
                        </h2>
                        <p className="text-xs text-blue-100 mt-1 max-w-2xl">
                          Connecté en tant qu&apos;élève ({userProfile?.first_name} • {userProfile?.level || "Lycée"}). Préparez à la fois votre Baccalauréat et l&apos;entrée dans les Grandes Écoles sénégalaises d&apos;ingénieurs, de santé, militaires et de l&apos;État.
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/20 backdrop-blur-md">
                        <i className="fas fa-check-circle text-emerald-400"></i> Cycle Actif : Lycée &amp; Concours
                      </span>
                    </div>
                  </div>
                </div>

                {/* Onglets de bascule spécifiques pour le Lycéen */}
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setSelectedCycle("Lycee")}
                    className={`py-3 px-5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                      effectiveCycle === "Lycee"
                        ? "bg-sama-primary text-white shadow-md ring-2 ring-sama-primary/30"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <i className="fas fa-graduation-cap text-sm"></i>
                    <span>Épreuves du BAC &amp; Lycée (Séries S &amp; L)</span>
                  </button>

                  <button
                    onClick={() => setSelectedCycle("Concours")}
                    className={`py-3 px-5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                      effectiveCycle === "Concours"
                        ? "bg-purple-900 text-white shadow-md ring-2 ring-purple-600/30"
                        : "bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200"
                    }`}
                  >
                    <i className="fas fa-landmark text-sama-orange text-sm"></i>
                    <span>Concours d&apos;État &amp; Grandes Écoles (EPT, ESP, CPGE, CUGEM...)</span>
                    <span className="bg-amber-400 text-gray-900 text-[10px] font-black px-2 py-0.5 rounded-full ml-1">OFFICIEL</span>
                  </button>

                  <button
                    onClick={() => setSelectedCycle("TOUS")}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
                      effectiveCycle === "TOUS"
                        ? "bg-gray-900 text-white shadow-md"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <i className="fas fa-layer-group"></i>
                    <span>Tout afficher (BAC + Concours)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-sama-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    <i className="fas fa-lock"></i>
                  </span>
                  <div>
                    <p className="font-extrabold text-sama-primary text-sm flex items-center gap-2">
                      <span>Bibliothèque Officielle • Cycle {studentCycle === "Primaire" ? "Primaire (CI à CM2, CFEE)" : "Collège (6e à 3e, BFEM)"}</span>
                      <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Cloisonné</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Connecté en tant qu&apos;élève ({userProfile?.first_name} • {userProfile?.level}). Seules les épreuves de votre niveau sont consultables.
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-sama-primary text-xs font-bold border border-blue-200 shadow-xs">
                    <i className="fas fa-check-circle text-green-500"></i> Cycle Actif : {studentCycle}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-100">
            {CYCLES.map((cycle) => (
              <button
                key={cycle.id}
                onClick={() => setSelectedCycle(cycle.id)}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  selectedCycle === cycle.id
                    ? "bg-sama-primary text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                }`}
              >
                <i className={cycle.icon}></i>
                <span>{cycle.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grille des Épreuves Documentaires */}
      {filteredDocuments.length > 0 && (
        <div className="space-y-4 mb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {filteredDocuments.length} épreuve(s) disponible(s) {
                isStudent && studentCycle === "Lycee" 
                  ? (selectedCycle === "Concours" ? "pour les Concours & Grandes Écoles" : (selectedCycle === "Lycee" ? "pour le Lycée (BAC Séries S & L)" : "pour le Lycée (BAC + Concours)"))
                  : (effectiveCycle === "Concours" ? "pour les Concours d'État & Grandes Écoles" : `pour le cycle ${studentCycle || effectiveCycle}`)
              }
            </h2>
            <span className="text-xs text-gray-400">Lecture protégée anti-téléchargement</span>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-gray-100">
              <i className="fas fa-spinner fa-spin text-4xl text-sama-primary mb-3 block"></i>
              <p className="text-gray-500 font-semibold text-sm">Chargement des épreuves officielles...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition group">
                  <div className={`${doc.color || "bg-sama-blue"} text-white p-6 pb-8`}>
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-300 mb-2 block">{doc.level}</span>
                    <h3 className="text-lg font-bold leading-tight group-hover:text-amber-200 transition">{doc.title}</h3>
                  </div>
                  <div className="p-5 flex-grow flex flex-col justify-between bg-white -mt-4 rounded-t-2xl relative">
                    <p className="text-xs text-gray-500 mb-4 font-medium flex items-center gap-1.5">
                      <i className="fas fa-file-contract text-sama-primary"></i> {doc.pages_info || "Sujet officiel + Corrigé"}
                    </p>
                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400 font-medium">{doc.subject}</span>
                      <button
                        onClick={() => openDocumentViewer(doc)}
                        className="flex items-center gap-1.5 font-bold text-xs bg-blue-50 text-sama-primary hover:bg-sama-primary hover:text-white px-3 py-1.5 rounded-xl transition shadow-sm"
                      >
                        <i className="fas fa-eye text-xs"></i> Consulter l&apos;épreuve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== SECTION CONCOURS DE L'ÉTAT & GRANDES ÉCOLES (Accessible à tous et spécialement aux Lycéens) ===== */}
      {(!isStudent || studentCycle === "Lycee") && (effectiveCycle === "TOUS" || effectiveCycle === "Concours" || selectedCycle === "Concours") && (
        <div className="mb-12">
          <div className="mb-6 bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold mb-2">
              <i className="fas fa-landmark text-sama-orange"></i> Fonction Publique &amp; Grandes Écoles
            </div>
            <h2 className="text-2xl font-black mb-1">Concours Officiels de l&apos;État du Sénégal &amp; Grandes Écoles</h2>
            <p className="text-purple-200 text-xs sm:text-sm">
              Annales, épreuves types et préparation d&apos;excellence aux grands concours d&apos;ingénieurs, de santé, militaires et de l&apos;Administration sénégalaise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CONCOURS.map((concours, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition group">
                <div className={`${concours.couleur} text-white p-6 pb-8`}>
                  <span className="text-4xl mb-3 block">{concours.icon}</span>
                  <h3 className="text-xl font-extrabold leading-tight">{concours.name}</h3>
                </div>
                <div className="p-5 flex-grow flex flex-col justify-between bg-white -mt-4 rounded-t-2xl relative">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{concours.full}</p>
                    <p className="text-xs text-gray-600 mb-4">{concours.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      const fullExam = EXAMS_BY_KEY[concours.name] 
                        || EXAMS_BY_KEY[concours.name.split("/")[0].trim()] 
                        || EXAMS_BY_KEY[concours.name.split(" ")[0].trim()]
                        || ALL_OFFICIAL_EXAMS.find(e => e.title.toLowerCase().includes(concours.name.toLowerCase()));
                      if (fullExam) {
                        openDocumentViewer(fullExam);
                      } else {
                        openDocumentViewer({
                          id: `concours-${index}`,
                          level: "CONCOURS",
                          title: `Concours ${concours.name} — ${concours.full}`,
                          subject: "Culture Générale & Spécialité",
                          institution: "Ministère de la Fonction Publique — DEXCO",
                          session: "Session Officielle 2024 / 2025",
                          duration: "3 heures",
                          coefficient: 3,
                          instructions: [
                            "L'usage du dictionnaire et des téléphones portables est formellement interdit sous peine d'élimination.",
                            "Le candidat doit développer une réflexion ordonnée et rigoureuse avec introduction, développement et conclusion."
                          ],
                          sections: [
                            {
                              title: `ÉPREUVE MAJEURE : DISSERTATION DE CULTURE GÉNÉRALE & SPÉCIALITÉ (${concours.name})`,
                              points: "20 points (Coeff. 3)",
                              questions: [
                                {
                                  num: "Sujet 1 (Dissertation de Concours)",
                                  points: "20 points",
                                  question: `En vous appuyant sur les grands défis de développement du Sénégal, analysez le rôle stratégique de l'institution (${concours.full}) dans la modernisation des services de l'État et la protection de l'intérêt général.`,
                                  details: [
                                    "1. Montrez comment les missions de ce corps de métier s'inscrivent dans la souveraineté nationale et le pacte républicain.",
                                    "2. Analysez les compétences éthiques, managériales et techniques requises pour répondre aux attentes citoyennes."
                                  ]
                                }
                              ]
                            }
                          ],
                          corrige: {
                            methodologie: `Méthodologie pour le concours ${concours.name} : Structure académique rigoureuse, style administratif mesuré et maîtrise des textes réglementaires sénégalais.`,
                            conseilsJury: "Le jury valorise l'esprit de synthèse, la pertinence des propositions concrètes et l'orthographe irréprochable.",
                            sections: [
                              {
                                title: "Pistes de Rédaction & Arguments Clés",
                                points: "20 points",
                                solution: `I. Le rôle fondamental dans l'architecture institutionnelle sénégalaise :
- Préservation de l'intérêt général et application des politiques publiques.
- Contribution à l'émergence économique et à la stabilité démocratique.

II. Les réformes et perspectives d'avenir :
- Transition numérique, transparence et gouvernance vertueuse.
- Renforcement des compétences professionnelles au service de la nation.`
                              }
                            ]
                          },
                          bareme: [
                            { critere: "Compréhension du rôle institutionnel", points: "6 pts", description: "Maîtrise des missions du corps de métier." },
                            { critere: "Rigueur du raisonnement et illustrations", points: "8 pts", description: "Pertinence des arguments ancrés dans les réalités du Sénégal." },
                            { critere: "Correction de la langue et style", points: "6 pts", description: "Qualité rédactionnelle et clarté de la pensée." }
                          ]
                        });
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 font-bold text-xs bg-purple-50 text-purple-800 hover:bg-purple-800 hover:text-white py-2 px-3 rounded-xl transition shadow-sm w-full"
                  >
                    <i className="fas fa-eye text-xs"></i> Consulter l&apos;épreuve officielle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
