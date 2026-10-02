"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const DEFAULT_DOCUMENTS = [
  { id: "1", level: "BAC S2", title: "Annales de mathématiques 2015-2025", subject: "Mathématiques", color: "bg-sama-blue", downloads: "2 140", pages_info: "Sujet officiel PDF", file_url: "#" },
  { id: "2", level: "BFEM", title: "Épreuves de SVT et physique", subject: "SVT / Physique", color: "bg-sama-blue", downloads: "1 760", pages_info: "18 sujets et fiches", file_url: "#" },
  { id: "3", level: "CONCOURS", title: "Police nationale — 8 sessions", subject: "Culture générale", color: "bg-purple-700", downloads: "980", pages_info: "Culture générale, tests psy", file_url: "#" },
  { id: "4", level: "PRIMAIRE", title: "CFEE et entrée en 6e", subject: "Maths & Français", color: "bg-sama-blue", downloads: "3 020", pages_info: "24 sujets d'entraînement", file_url: "#" },
];

const FILTER_LEVELS = [
  "Tous les niveaux",
  "Primaire",
  "Collège",
  "Lycée",
  "BAC",
  "BFEM",
  "CFEE",
  "Concours",
];

// Tous les concours de l'État listés dans le cahier des charges et grandes écoles
const CONCOURS = [
  { name: "ENA", full: "École Nationale d'Administration", icon: "🏛️", desc: "Préfets, Diplomates, Administrateurs civils", couleur: "bg-blue-700" },
  { name: "CUGEM", full: "Concours Unique Grandes Écoles Militaires", icon: "🌍", desc: "Saint-Cyr, Navale, École de l'Air, Meknès (Officiers à l'étranger)", couleur: "bg-red-800" },
  { name: "EMS Dakar", full: "École Militaire de Santé (Camp Dial Diop)", icon: "⚕️", desc: "Médecins, Pharmaciens et Vétérinaires militaires (Logés, nourris et rémunérés)", couleur: "bg-emerald-800" },
  { name: "EAA Thiès", full: "École de l'Armée de l'Air (Base Aérienne)", icon: "✈️", desc: "Pilotes de chasse, Transport, Hélicoptères et Mécaniciens (BA 70)", couleur: "bg-sky-800" },
  { name: "CPGE Thiès", full: "Classes Préparatoires aux Grandes Écoles", icon: "📐", desc: "MPSI, PCSI — Bourse d'État d'excellence pour bacheliers S", couleur: "bg-indigo-800" },
  { name: "Police", full: "Police Nationale du Sénégal", icon: "👮🏾", desc: "Commissaires, Officiers, Sous-Officiers, Agents", couleur: "bg-slate-700" },
  { name: "Gendarmerie", full: "Gendarmerie Nationale", icon: "🎖️", desc: "Sous-officiers, Gendarmes de Carrière", couleur: "bg-green-700" },
  { name: "Douanes", full: "Douanes Sénégalaises", icon: "🛃", desc: "Inspecteurs, Contrôleurs des Douanes", couleur: "bg-yellow-700" },
  { name: "INFAS / ENDSS", full: "Santé Publique & Soins Infirmiers", icon: "🏥", desc: "Infirmiers d'État, Sages-femmes, Techniciens de santé", couleur: "bg-rose-700" },
  { name: "FASTEF", full: "Faculté des Sciences et Technologies de l'Éducation", icon: "📚", desc: "CAPES, Professorat de Lycée et Collège, CAEM", couleur: "bg-indigo-700" },
  { name: "Eaux & Forêts", full: "Eaux, Forêts, Chasse & Pêche", icon: "🌳", desc: "Agents forestiers, Inspecteurs des Eaux et Forêts", couleur: "bg-teal-700" },
  { name: "Sapeurs-Pompiers", full: "Brigade Nationale des Sapeurs-Pompiers", icon: "🚒", desc: "Soldats et Sous-officiers du feu (BNSP)", couleur: "bg-orange-700" },
  { name: "EPT / ESP", full: "Concours d'Ingénieurs Polytechnique", icon: "💻", desc: "Concours direct d'entrée ingénieurs de conception (DIC)", couleur: "bg-cyan-800" }
];

export default function Examens() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("Tous les niveaux");
  const [activeTab, setActiveTab] = useState<"annales" | "concours">("annales");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });

    const fetchAnnales = async () => {
      const { data: dbAnnales } = await supabase.from("annales").select("*").order("created_at", { ascending: false });
      if (dbAnnales && dbAnnales.length > 0) {
        setDocuments(dbAnnales);
      } else {
        setDocuments(DEFAULT_DOCUMENTS);
      }
    };

    fetchAnnales();
  }, []);

  const handleDownload = (fileUrl: string) => {
    if (!isLoggedIn) {
      setShowModal(true);
    } else {
      if (fileUrl && fileUrl !== "#") {
        window.open(fileUrl, "_blank");
      } else {
        alert("Document disponible au téléchargement.");
      }
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (selectedFilter === "Tous les niveaux") return true;
    return doc.level.toUpperCase().includes(selectedFilter.toUpperCase());
  });

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

      {/* Modal de connexion requise */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 text-sama-primary rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                <i className="fas fa-lock"></i>
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Compte requis</h3>
              <p className="text-gray-500 text-sm">
                Créez un compte gratuit pour télécharger les annales et accéder aux sujets d&apos;examens.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/register" className="block w-full bg-sama-primary text-white font-bold py-3.5 rounded-xl text-center hover:bg-blue-800 transition">
                Créer un compte gratuit
              </Link>
              <Link href="/login" className="block w-full border border-gray-200 text-gray-700 font-bold py-3 rounded-xl text-center hover:bg-gray-50 transition text-sm">
                Déjà un compte ? Se connecter
              </Link>
              <button onClick={() => setShowModal(false)} className="text-sm text-gray-400 hover:text-gray-600 mt-2">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENTÊTE */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exercices & Examens</h1>
        <p className="text-gray-500 text-sm mb-6">
          Annales corrigées, sujets officiels et préparation aux concours de l&apos;État sénégalais.
        </p>

        {/* Onglets Annales / Concours */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("annales")}
            className={`px-5 py-2 rounded-full font-bold text-sm transition ${activeTab === "annales" ? "bg-sama-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            📄 Annales scolaires
          </button>
          <button
            onClick={() => setActiveTab("concours")}
            className={`px-5 py-2 rounded-full font-bold text-sm transition ${activeTab === "concours" ? "bg-purple-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            🏆 Concours de l'État
          </button>
        </div>

        {/* Filtres niveaux (seulement pour annales) */}
        {activeTab === "annales" && (
          <div className="flex flex-wrap gap-2">
            {FILTER_LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedFilter(lvl)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition shadow-sm ${
                  selectedFilter === lvl
                    ? "bg-sama-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bannière inscription */}
      {!isLoggedIn && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <i className="fas fa-info-circle text-sama-primary text-xl"></i>
            <p className="text-sm text-gray-700 font-medium">
              <strong>Compte gratuit requis</strong> pour télécharger les annales. L&apos;inscription prend moins d&apos;une minute !
            </p>
          </div>
          <Link href="/register" className="bg-sama-primary text-white font-bold px-5 py-2 rounded-lg text-sm hover:bg-blue-800 transition flex-shrink-0">
            S&apos;inscrire gratuitement
          </Link>
        </div>
      )}

      {/* ===== ONGLET ANNALES ===== */}
      {activeTab === "annales" && (
        <>
          {filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 mb-8">
              <i className="fas fa-folder-open text-4xl text-gray-300 mb-3 block"></i>
              <h3 className="font-bold text-gray-700">Aucun document ne correspond à ce filtre</h3>
              <p className="text-xs text-gray-400 mt-1">Sélectionnez un autre niveau ou réinitialisez les filtres.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
                  <div className="bg-sama-blue text-white p-6 pb-8">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2 block">{doc.level}</span>
                    <h3 className="text-lg font-bold leading-tight">{doc.title}</h3>
                  </div>
                  <div className="p-5 flex-grow flex flex-col justify-between bg-white -mt-4 rounded-t-2xl relative">
                    <p className="text-sm text-gray-500 mb-4 font-medium">{doc.pages_info || "Sujet officiel PDF"}</p>
                    <div className="flex justify-between items-center mt-auto">
                      <span className="text-xs text-gray-400 font-medium">{doc.subject}</span>
                      <button
                        onClick={() => handleDownload(doc.file_url)}
                        className={`flex items-center gap-1 font-bold text-sm ${isLoggedIn ? "text-sama-primary hover:underline" : "text-gray-400 hover:text-sama-primary"}`}
                      >
                        {isLoggedIn ? (
                          <><i className="fas fa-download text-xs"></i> Télécharger</>
                        ) : (
                          <><i className="fas fa-lock text-xs"></i> Télécharger</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== ONGLET CONCOURS DE L'ÉTAT ===== */}
      {activeTab === "concours" && (
        <div className="mb-12">
          <div className="mb-8 bg-purple-50 border border-purple-100 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-purple-900 mb-2">🏆 Concours de l'État — Sénégal</h2>
            <p className="text-purple-700 text-sm">
              Retrouvez les annales et les ressources de préparation pour tous les grands concours de la Fonction Publique sénégalaise.
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
                    <p className="text-sm text-gray-600 mb-4">{concours.desc}</p>
                  </div>
                  <button
                    onClick={() => handleDownload("#")}
                    className="flex items-center gap-1 font-bold text-sm text-purple-700 hover:underline"
                  >
                    <i className="fas fa-file-alt text-xs"></i> Voir les sujets
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
