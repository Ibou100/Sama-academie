"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const DEFAULT_DOCUMENTS = [
  // Primaire
  { 
    id: "prim-1", 
    level: "Primaire (CM2/CFEE)", 
    cycle: "Primaire",
    title: "Épreuve CFEE & Entrée en 6e - Mathématiques & Résolution de Problèmes", 
    subject: "Mathématiques", 
    color: "bg-sama-blue", 
    downloads: "3 420", 
    pages_info: "Sujet officiel Ministère + Barème", 
    file_url: "#",
    exercices: [
      { num: "Épreuve 1 (Ressources - 40 pts)", desc: "Numération décimale, calcul de fractions, pourcentages et conversion d'unités de mesures métriques." },
      { num: "Épreuve 2 (Compétence - 60 pts)", desc: "Résolution de problème de la vie courante : Calcul du budget d'achat familial, dépenses et bénéfice commercial." }
    ],
    sample_corrige: "Solution du problème : 1) Calcul de la longueur totale du grillage nécessaire : Périmètre = (Longueur + Largeur) × 2 = (45m + 25m) × 2 = 140 m. 2) Dépense totale pour l'achat du grillage : 140 m × 1 500 FCFA = 210 000 FCFA..."
  },
  { 
    id: "prim-2", 
    level: "Primaire (CM2/CFEE)", 
    cycle: "Primaire",
    title: "Épreuve CFEE & Entrée en 6e - Français (Texte suivi de questions & Dictée)", 
    subject: "Français", 
    color: "bg-sama-blue", 
    downloads: "2 890", 
    pages_info: "Sujet officiel Ministère + Grille de correction", 
    file_url: "#",
    exercices: [
      { num: "Compréhension & Vocabulaire", desc: "Explication de texte, recherche de synonymes, contraires et formation de mots dérivés." },
      { num: "Grammaire & Conjugaison", desc: "Analyse logique de propositions, accords du participe passé et conjugaison au plus-que-parfait et futur simple." },
      { num: "Production d'Écrits", desc: "Rédaction d'une lettre amicale décrivant une fête traditionnelle de votre village ou quartier." }
    ],
    sample_corrige: "Barème officiel de notation : Respect du thème (4 points), cohérence du récit et connecteurs temporels (3 points), correction de la langue et accords grammaticaux (3 points)..."
  },
  { 
    id: "prim-3", 
    level: "Primaire (CE1/CE2)", 
    cycle: "Primaire",
    title: "Évaluation Trimestrielle CE1/CE2 - Opérations, Géométrie et Vocabulaire", 
    subject: "Maths & Français", 
    color: "bg-sama-blue", 
    downloads: "2 150", 
    pages_info: "Fiche d'évaluation nationale", 
    file_url: "#",
    exercices: [
      { num: "Activités numériques", desc: "Addition et soustraction avec retenue, tables de multiplication de 2 à 5 et ordre croissant." },
      { num: "Activités géométriques", desc: "Reconnaissance du carré, du rectangle et du triangle à l'aide de la règle graduée et de l'équerre." }
    ],
    sample_corrige: "Corrigé CE1/CE2 : Vérifier que l'enfant utilise correctement les alignements de chiffres en colonnes (unités sous unités, dizaines sous dizaines) et n'omet pas la retenue..."
  },
  { 
    id: "prim-4", 
    level: "Primaire (CI - CM2)", 
    cycle: "Primaire",
    title: "Fiche d'Éveil & Sciences d'Observation - Milieu Physique & Vivant", 
    subject: "Sciences & Éveil", 
    color: "bg-sama-blue", 
    downloads: "1 940", 
    pages_info: "Programme officiel sénégalais", 
    file_url: "#",
    exercices: [
      { num: "Le corps humain & l'hygiène", desc: "Les organes des sens, le rôle des dents et les règles d'hygiène alimentaire au Sénégal." },
      { num: "L'environnement", desc: "Le cycle de l'eau, la protection des arbres et la gestion des ordures ménagères." }
    ],
    sample_corrige: "Les 5 organes des sens : les yeux (la vue), les oreilles (l'ouïe), le nez (l'odorat), la langue (le goût), la peau (le toucher). Règle d'or : se laver les mains avant et après chaque repas..."
  },

  // Collège
  { 
    id: "col-1", 
    level: "Collège (3e/BFEM)", 
    cycle: "College",
    title: "Épreuve BFEM Mathématiques - Exercices & Problème de synthèse", 
    subject: "Mathématiques", 
    color: "bg-sama-blue", 
    downloads: "3 840", 
    pages_info: "Sujet officiel Brevet + Corrigé", 
    file_url: "#",
    exercices: [
      { num: "Exercice 1 (5 points)", desc: "Calcul littéral, factorisation par identités remarquables et équations produits-nuls." },
      { num: "Exercice 2 (5 points)", desc: "Géométrie dans l'espace : Cône de révolution, calcul de volume et section par un plan parallèle à la base." },
      { num: "Problème (10 points)", desc: "Théorème de Thalès, trigonométrie et fonctions affines appliquées à une facture de carburant." }
    ],
    sample_corrige: "Exercice 1 : A(x) = (2x - 3)² - (x + 1)². En appliquant a² - b² = (a - b)(a + b), on obtient A(x) = (2x - 3 - x - 1)(2x - 3 + x + 1) = (x - 4)(3x - 2). Les solutions de A(x) = 0 sont x = 4 et x = 2/3..."
  },
  { 
    id: "col-2", 
    level: "Collège (3e/BFEM)", 
    cycle: "College",
    title: "Épreuves de SVT et Sciences Physiques (BFEM Récent)", 
    subject: "SVT / Physique-Chimie", 
    color: "bg-sama-blue", 
    downloads: "2 760", 
    pages_info: "Sujets officiels brevet", 
    file_url: "#",
    exercices: [
      { num: "Partie 1 (8 points)", desc: "Maîtrise des connaissances : Reproduction chez les mammifères et immunologie." },
      { num: "Partie 2 (12 points)", desc: "Compétences méthodologiques : Analyse de graphiques sur la glycémie et la digestion." }
    ],
    sample_corrige: "Partie 1 : L'immunité non spécifique fait intervenir les barrières naturelles (peau, muqueuses) ainsi que la phagocytose assurée par les polynucléaires..."
  },

  // Lycée
  { 
    id: "lyc-1", 
    level: "BAC S2", 
    cycle: "Lycee",
    title: "Annales de Mathématiques 2015-2025 - Séries S1/S2", 
    subject: "Mathématiques", 
    color: "bg-sama-blue", 
    downloads: "4 140", 
    pages_info: "Sujet officiel + Barème", 
    file_url: "#",
    exercices: [
      { num: "Exercice 1 (4 points)", desc: "Nombres complexes, transformations géométriques du plan et similitudes directes." },
      { num: "Exercice 2 (5 points)", desc: "Probabilités conditionnelles, variables aléatoires discrètes et loi binomiale." },
      { num: "Problème (11 points)", desc: "Étude d'une fonction exponentielle, tracé de la courbe (C) et calcul d'intégrales/aires." }
    ],
    sample_corrige: "Pour la question 1.a : Résolution dans C de l'équation z² - 2(√3)z + 4 = 0. Le discriminant Δ' = 3 - 4 = -1 = i². Donc z1 = √3 - i et z2 = √3 + i. Module |z1| = 2, argument θ = -π/6..."
  },
  { 
    id: "lyc-2", 
    level: "BAC L", 
    cycle: "Lycee",
    title: "Dissertations & Commentaires de Philosophie (Séries L & S)", 
    subject: "Philosophie", 
    color: "bg-sama-blue", 
    downloads: "2 450", 
    pages_info: "Sujets & plans détaillés", 
    file_url: "#",
    exercices: [
      { num: "Sujet 1", desc: "L'État est-il nécessairement un obstacle à la liberté des citoyens ?" },
      { num: "Sujet 2", desc: "L'art doit-il chercher à imiter la nature ou à la réinventer ?" },
      { num: "Sujet 3", desc: "Commentaire de texte : Extrait de Kant, Idée d'une histoire universelle." }
    ],
    sample_corrige: "Plan détaillé Sujet 1 : I. L'État perçu comme contrainte et appareil coercitif (thèse anarchiste et marxiste). II. Mais sans État, la liberté dégénère en loi du plus fort (Hobbes). III. L'État de droit comme garant effectif de la liberté citoyenne (Rousseau)..."
  }
];

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
  const [selectedCycle, setSelectedCycle] = useState("TOUS");

  // Visionneuse Sécurisée In-App
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);
  const [viewerTab, setViewerTab] = useState<"sujet" | "corrige">("sujet");

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
          if (lvl.includes("primaire") || lvl.includes("ci") || lvl.includes("cp") || lvl.includes("ce") || lvl.includes("cm") || lvl.includes("cfee")) {
            setSelectedCycle("Primaire");
          } else if (lvl.includes("collège") || lvl.includes("college") || lvl.includes("6") || lvl.includes("5") || lvl.includes("4") || lvl.includes("3") || lvl.includes("bfem")) {
            setSelectedCycle("College");
          } else if (lvl.includes("lycée") || lvl.includes("lycee") || lvl.includes("bac") || lvl.includes("terminale") || lvl.includes("seconde") || lvl.includes("première")) {
            setSelectedCycle("Lycee");
          }
        }
      }
    };

    const fetchAnnales = async () => {
      const { data: dbAnnales } = await supabase.from("annales").select("*").order("created_at", { ascending: false });
      if (dbAnnales && dbAnnales.length > 0) {
        // Classifier chaque annale de façon précise
        const merged = dbAnnales.map((doc, idx) => {
          const lvl = (doc.level || "").toLowerCase();
          const cycle = (lvl.includes("cfee") || lvl.includes("primaire") || lvl.includes("cm") || lvl.includes("ce") || lvl.includes("ci") || lvl.includes("cp"))
            ? "Primaire"
            : (lvl.includes("bfem") || lvl.includes("collège") || lvl.includes("college") || lvl.includes("6") || lvl.includes("5") || lvl.includes("4") || lvl.includes("3"))
            ? "College"
            : "Lycee";

          return {
            ...doc,
            cycle,
            exercices: DEFAULT_DOCUMENTS[idx % DEFAULT_DOCUMENTS.length]?.exercices || DEFAULT_DOCUMENTS[0].exercices,
            sample_corrige: DEFAULT_DOCUMENTS[idx % DEFAULT_DOCUMENTS.length]?.sample_corrige || DEFAULT_DOCUMENTS[0].sample_corrige
          };
        });

        // Combiner avec DEFAULT_DOCUMENTS pour assurer un contenu complet dans tous les cycles
        const allDocs = [...merged];
        DEFAULT_DOCUMENTS.forEach((def) => {
          if (!allDocs.some((d) => d.title?.toLowerCase().trim() === def.title?.toLowerCase().trim())) {
            allDocs.push(def);
          }
        });
        setDocuments(allDocs);
      } else {
        setDocuments(DEFAULT_DOCUMENTS);
      }
    };

    fetchUserData();
    fetchAnnales();
  }, []);

  const openDocumentViewer = (doc: any) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
    } else {
      setViewerDoc(doc);
      setViewerTab("sujet");
    }
  };

  // Détection du rôle élève et cycle associé
  const isStudent = userProfile?.role === "eleve";
  const studentLevel = (userProfile?.level || "").toLowerCase();
  const studentCycle: "Primaire" | "College" | "Lycee" | null = isStudent
    ? (studentLevel.includes("primaire") || studentLevel.includes("ci") || studentLevel.includes("cp") || studentLevel.includes("ce") || studentLevel.includes("cm") || studentLevel.includes("cfee")
      ? "Primaire"
      : studentLevel.includes("collège") || studentLevel.includes("college") || studentLevel.includes("6") || studentLevel.includes("5") || studentLevel.includes("4") || studentLevel.includes("3") || studentLevel.includes("bfem")
      ? "College"
      : "Lycee")
    : null;

  // Filtrage strict selon le cycle sélectionné ou imposé à l'élève
  const effectiveCycle = isStudent && studentCycle ? studentCycle : selectedCycle;

  const filteredDocuments = documents.filter((doc) => {
    if (effectiveCycle === "TOUS") return true;
    const dCycle = doc.cycle;
    const dLvl = (doc.level || "").toLowerCase();

    if (effectiveCycle === "Primaire") {
      return dCycle === "Primaire" || dLvl.includes("primaire") || dLvl.includes("cfee") || dLvl.includes("cm") || dLvl.includes("ce") || dLvl.includes("ci") || dLvl.includes("cp");
    }
    if (effectiveCycle === "College") {
      return dCycle === "College" || dLvl.includes("bfem") || dLvl.includes("collège") || dLvl.includes("college") || dLvl.includes("6") || dLvl.includes("5") || dLvl.includes("4") || dLvl.includes("3");
    }
    if (effectiveCycle === "Lycee") {
      return dCycle === "Lycee" || dLvl.includes("bac") || dLvl.includes("lycée") || dLvl.includes("lycee") || dLvl.includes("seconde") || dLvl.includes("première") || dLvl.includes("terminale");
    }
    return true;
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
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">

            {/* Header Visionneuse */}
            <div className="bg-sama-blue text-white p-4 sm:p-5 flex items-center justify-between gap-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="bg-sama-orange text-sama-blue font-black text-xs px-2.5 py-1 rounded-full uppercase">
                  {viewerDoc.level}
                </span>
                <div>
                  <h3 className="font-black text-sm sm:text-base leading-tight line-clamp-1">{viewerDoc.title}</h3>
                  <p className="text-xs text-blue-200 mt-0.5">{viewerDoc.subject} • Consultation en Ligne Protégée</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold">
                  <i className="fas fa-shield-alt text-sama-orange"></i> Anti-Fuite Activé
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

            {/* Onglets Sujet vs Corrigé */}
            <div className="bg-gray-100 px-6 py-2 flex items-center gap-2 border-b border-gray-200 flex-shrink-0">
              <button
                onClick={() => setViewerTab("sujet")}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  viewerTab === "sujet" ? "bg-white text-sama-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="fas fa-file-alt"></i> Épreuve Officielle
              </button>

              <button
                onClick={() => setViewerTab("corrige")}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  viewerTab === "corrige" ? "bg-white text-sama-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="fas fa-check-circle text-sama-orange"></i> Corrigé Pédagogique {isPremium ? "⭐" : "🔒"}
              </button>

              <div className="ml-auto text-[11px] text-gray-400 hidden md:block">
                Téléchargement bloqué • Document sous licence exclusive SAMA ACADÉMIE
              </div>
            </div>

            {/* Corps du Document avec Filigrane de Sécurité */}
            <div 
              className="flex-grow overflow-y-auto p-6 sm:p-10 bg-slate-50 relative select-none"
              style={{ userSelect: "none", WebkitUserSelect: "none" }}
            >
              {/* Filigrane discret en fond */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-around items-center opacity-[0.03] select-none text-2xl sm:text-4xl font-black rotate-[-25deg] uppercase">
                <span>SAMA ACADÉMIE - DOCUMENT OFFICIEL PROTÉGÉ</span>
                <span>CONSULTATION STRICTEMENT PERSONNELLE</span>
                <span>REPRODUCTION & DIFFUSION INTERDITES</span>
              </div>

              {viewerTab === "sujet" ? (
                /* === ONGLET SUJET === */
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                  {/* En-tête République du Sénégal */}
                  <div className="border-b-2 border-gray-900 pb-4 text-center space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">RÉPUBLIQUE DU SÉNÉGAL</p>
                    <p className="text-[10px] font-bold text-gray-500">Ministère de l&apos;Éducation Nationale — DEXCO</p>
                    <h4 className="text-base sm:text-lg font-black text-gray-900 pt-2 uppercase tracking-wide">
                      {viewerDoc.title}
                    </h4>
                    <div className="flex justify-between text-xs font-bold text-gray-700 pt-2 border-t border-gray-200">
                      <span>Niveau : {viewerDoc.level}</span>
                      <span>Matière : {viewerDoc.subject}</span>
                      <span>Durée officielle</span>
                    </div>
                  </div>

                  {/* Exercices & Énoncés */}
                  <div className="space-y-6 text-gray-800 text-sm leading-relaxed">
                    {(viewerDoc.exercices || DEFAULT_DOCUMENTS[0].exercices).map((ex: any, i: number) => (
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

                    <div className="pt-4 border-t border-gray-200 text-xs text-gray-500 text-center italic">
                      Fin du sujet officiel. Retrouvez la résolution étape par étape dans l&apos;onglet &quot;Corrigé Pédagogique&quot;.
                    </div>
                  </div>
                </div>
              ) : (
                /* === ONGLET CORRIGÉ === */
                <div className="max-w-2xl mx-auto space-y-6">
                  {isPremium ? (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-lg">
                          <i className="fas fa-check-double"></i>
                        </div>
                        <div>
                          <h4 className="text-base font-black text-gray-900">Corrigé Détaillé & Méthodologie</h4>
                          <p className="text-xs text-gray-500">Rédigé par le corps professoral de SAMA ACADÉMIE</p>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed font-sans">
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2">
                          <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                            <i className="fas fa-lightbulb"></i> Conseils de rédaction de l&apos;inspecteur
                          </p>
                          <p className="text-emerald-800 text-xs">
                            Toujours préciser le domaine de définition et expliciter chaque théorème avant d&apos;appliquer la formule.
                          </p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 font-mono text-xs text-gray-800 leading-normal">
                          {viewerDoc.sample_corrige || DEFAULT_DOCUMENTS[0].sample_corrige}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Verrou Premium */
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-amber-200 text-center space-y-5">
                      <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                        <i className="fas fa-crown"></i>
                      </div>
                      <h4 className="text-xl font-extrabold text-gray-900">
                        Corrigé Détaillé Réservé aux Abonnés Premium
                      </h4>
                      <p className="text-gray-600 text-xs sm:text-sm max-w-md mx-auto">
                        Les explications rédigées pas à pas, les barèmes officiels et les astuces méthodologiques de nos enseignants certifiés sont réservés aux membres Premium.
                      </p>
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                          href="/tarifs"
                          className="w-full sm:w-auto bg-sama-primary hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-xl transition text-xs shadow-sm"
                        >
                          Passer en mode Premium ⭐
                        </Link>
                        <button
                          onClick={() => setViewerTab("sujet")}
                          className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl transition text-xs"
                        >
                          Revenir au sujet
                        </button>
                      </div>
                    </div>
                  )}
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

        {/* Sélecteur de Cycle Personnalisé (Cloisonné pour les élèves) */}
        {isStudent && studentCycle ? (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-sama-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  <i className="fas fa-lock"></i>
                </span>
                <div>
                  <p className="font-extrabold text-sama-primary text-sm flex items-center gap-2">
                    <span>Bibliothèque Officielle • Cycle {studentCycle === "Primaire" ? "Primaire (CI à CM2, CFEE)" : studentCycle === "College" ? "Collège (6e à 3e, BFEM)" : "Lycée (Seconde à Terminale, BAC)"}</span>
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
      {selectedCycle !== "Concours" && (
        <div className="space-y-4 mb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {filteredDocuments.length} épreuve(s) disponible(s) pour ce cycle
            </h2>
            <span className="text-xs text-gray-400">Lecture protégée anti-téléchargement</span>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
              <i className="fas fa-folder-open text-4xl text-gray-300 mb-3 block"></i>
              <h3 className="font-bold text-gray-700">Aucun document pour ce filtre</h3>
              <p className="text-xs text-gray-400 mt-1">Sélectionnez un autre cycle pour explorer les ressources.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
                  <div className="bg-sama-blue text-white p-6 pb-8">
                    <span className="text-xs font-bold uppercase tracking-widest text-sama-orange mb-2 block">{doc.level}</span>
                    <h3 className="text-lg font-bold leading-tight">{doc.title}</h3>
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

      {/* ===== SECTION CONCOURS DE L'ÉTAT (Masqué pour les élèves) ===== */}
      {!isStudent && (selectedCycle === "TOUS" || selectedCycle === "Concours") && (
        <div className="mb-12">
          <div className="mb-6 bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold mb-2">
              <i className="fas fa-landmark text-sama-orange"></i> Fonction Publique & Grandes Écoles
            </div>
            <h2 className="text-2xl font-black mb-1">Concours Officiels de l&apos;État du Sénégal</h2>
            <p className="text-purple-200 text-xs sm:text-sm">
              Annales et préparation aux grands concours de recrutement de l&apos;Administration sénégalaise.
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
                    onClick={() => openDocumentViewer({
                      id: `concours-${index}`,
                      level: "CONCOURS",
                      title: `Concours ${concours.name} — ${concours.full}`,
                      subject: "Culture Générale & Spécialité",
                      pages_info: "Sujets d'admissibilité",
                      exercices: [
                        { num: "Épreuve 1 (Admissibilité)", desc: `Dissertation de culture générale / Épreuve de spécialité propre au concours ${concours.name}.` },
                        { num: "Épreuve 2 (Tests psychotechniques)", desc: "Logique, raisonnement verbal, numérique et aptitudes professionnelles." }
                      ],
                      sample_corrige: `Méthodologie spécifique au concours ${concours.name} : Structure type, critères de notation du jury d'État et références bibliographiques officielles recommandées...`
                    })}
                    className="flex items-center justify-center gap-1.5 font-bold text-xs bg-purple-50 text-purple-800 hover:bg-purple-800 hover:text-white py-2 px-3 rounded-xl transition shadow-sm w-full"
                  >
                    <i className="fas fa-eye text-xs"></i> Consulter les sujets
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
