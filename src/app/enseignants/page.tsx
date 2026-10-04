"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSupportConfig } from "@/lib/siteConfig";

const SENEGAL_REGIONS = [
  "Toutes les régions", "Dakar", "Thiès", "Saint-Louis", "Diourbel",
  "Ziguinchor", "Kaolack", "Louga", "Fatick", "Kolda", "Matam",
  "Kaffrine", "Kédougou", "Sédhiou", "Tambacounda"
];

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function getAvatarBg(firstName: string) {
  const colors = ["bg-pink-400", "bg-blue-400", "bg-green-400", "bg-purple-400", "bg-orange-400", "bg-teal-400"];
  const index = (firstName?.charCodeAt(0) ?? 0) % colors.length;
  return colors[index];
}

export default function Enseignants() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportConfig, setSupportConfig] = useState<any>(null);

  // Filtres
  const [selectedSubject, setSelectedSubject] = useState("Toutes");
  const [selectedRegion, setSelectedRegion] = useState("Toutes les régions");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal de contact
  const [contactTeacher, setContactTeacher] = useState<any | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [bookedSuccess, setBookedSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      if (user) setCurrentUser(user);
    });

    const fetchTeachers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "enseignant");

      if (data && !error) {
        setTeachers(data);
      }
      setLoading(false);
    };
    fetchTeachers();
    getSupportConfig().then(setSupportConfig);
  }, []);

  const handleContactClick = (teacher: any) => {
    if (!isLoggedIn) {
      router.push("/login?redirect=/enseignants&message=Vous devez être connecté pour contacter un enseignant.");
    } else {
      setContactTeacher(teacher);
      setBookedSuccess(false);
      setIsRequesting(false);
      setRequestMessage("");
    }
  };

  const handleSendRequest = async () => {
    if (!currentUser || !contactTeacher) return;
    setSubmittingRequest(true);

    const { error } = await supabase.from("tutoring_requests").insert([{
      student_id: currentUser.id,
      teacher_id: contactTeacher.id,
      message: requestMessage.trim() || null,
      status: "en_attente_admin"
    }]);

    if (!error) {
      setBookedSuccess(true);
    } else {
      alert("Erreur lors de l'envoi : " + error.message);
    }
    setSubmittingRequest(false);
  };

  // Filtrage dynamique
  const filteredTeachers = teachers.filter((teacher) => {
    const tSubject = teacher.subject || "";
    const tRegion = teacher.region || "";
    const tName = `${teacher.first_name} ${teacher.last_name}`;

    const matchSubject = selectedSubject === "Toutes" || tSubject.toLowerCase().includes(selectedSubject.toLowerCase());
    const matchRegion = selectedRegion === "Toutes les régions" || tRegion === selectedRegion;
    const matchQuery =
      searchQuery === "" ||
      tName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tSubject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tRegion.toLowerCase().includes(searchQuery.toLowerCase());

    return matchSubject && matchRegion && matchQuery;
  });

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

      {/* Modal Contact */}
      {contactTeacher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative space-y-6">
            <button
              onClick={() => setContactTeacher(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-lg"
            >
              <i className="fas fa-times"></i>
            </button>

            {!bookedSuccess ? (
              <>
                <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                  {contactTeacher.avatar_url ? (
                    <img src={contactTeacher.avatar_url} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                  ) : (
                    <div className={`w-16 h-16 rounded-2xl ${getAvatarBg(contactTeacher.first_name)} text-white flex items-center justify-center font-bold text-2xl shadow-sm`}>
                      {getInitials(contactTeacher.first_name, contactTeacher.last_name)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900">{contactTeacher.first_name} {contactTeacher.last_name}</h3>
                    <p className="text-xs text-gray-500 font-medium">{contactTeacher.subject || "Matière non précisée"} • {contactTeacher.region || "Région non précisée"}</p>
                    <p className="text-sama-primary font-bold text-sm mt-0.5">{contactTeacher.price || "Tarif non précisé"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {!isRequesting ? (
                    <>
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-gray-700 leading-relaxed space-y-1">
                        <p className="font-bold text-sama-primary flex items-center gap-1.5">
                          <i className="fas fa-shield-alt"></i> Encadrement Sécurisé SAMA ACADÉMIE
                        </p>
                        <p className="text-gray-600">
                          Pour assurer un suivi pédagogique rigoureux et garantir votre sécurité, les demandes de cours et les échanges s&apos;effectuent exclusivement via la plateforme.
                        </p>
                      </div>

                      {/* Grille Tarifaire Officielle SAMA ACADÉMIE */}
                      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-amber-900 font-extrabold">
                          <span className="flex items-center gap-1.5"><i className="fas fa-tags text-sama-orange"></i> Grille Tarifaire Officielle SAMA ACADÉMIE</span>
                          <span className="text-[10px] bg-amber-200/70 text-amber-800 px-2 py-0.5 rounded-full font-bold">Régulé</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center pt-1">
                          <div className="bg-white p-2 rounded-xl border border-amber-100 shadow-xs">
                            <p className="text-[10px] text-gray-500 font-bold">Primaire</p>
                            <p className="text-xs font-black text-gray-900">25 000 F</p>
                            <p className="text-[9px] text-gray-400">/ mois</p>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-amber-100 shadow-xs">
                            <p className="text-[10px] text-gray-500 font-bold">Collège</p>
                            <p className="text-xs font-black text-gray-900">35 000 F</p>
                            <p className="text-[9px] text-gray-400">/ mois</p>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-amber-100 shadow-xs">
                            <p className="text-[10px] text-gray-500 font-bold">Lycée / BAC</p>
                            <p className="text-xs font-black text-gray-900">45 000 F</p>
                            <p className="text-[9px] text-gray-400">/ mois</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-amber-800/80 leading-tight italic pt-0.5">
                          * Règlement sécurisé auprès de SAMA ACADÉMIE incluant le suivi pédagogique continu.
                        </p>
                      </div>

                      <button
                        onClick={() => setIsRequesting(true)}
                        className="w-full bg-sama-primary hover:bg-blue-800 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition shadow-md text-sm"
                      >
                        <i className="fas fa-calendar-check text-base"></i> Demander cet enseignant via SAMA ACADÉMIE
                      </button>

                      <a
                        href={supportConfig?.whatsappUrl || "https://wa.me/221774673109"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition text-xs"
                      >
                        <i className="fab fa-whatsapp text-green-600 text-base"></i> Besoin d&apos;orientation ? Contacter le Support
                      </a>
                    </>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <p className="text-sm font-bold text-gray-900">Demande d&apos;encadrement avec {contactTeacher.first_name}</p>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Précisez vos besoins (Classe, objectifs, disponibilités)</label>
                        <textarea 
                          rows={3} 
                          value={requestMessage}
                          onChange={(e) => setRequestMessage(e.target.value)}
                          placeholder="Ex: Bonjour, je prépare le Bac S2 et je souhaite 2 séances par semaine de renforcement en Maths..."
                          className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-sama-primary resize-none"
                        ></textarea>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setIsRequesting(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm transition">
                          Annuler
                        </button>
                        <button onClick={handleSendRequest} disabled={submittingRequest} className="flex-1 bg-sama-primary hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-sm transition flex justify-center items-center gap-2">
                          {submittingRequest ? <i className="fas fa-spinner fa-spin"></i> : "Transmettre à la Direction"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-blue-100 text-sama-primary rounded-full flex items-center justify-center mx-auto text-3xl">
                  <i className="fas fa-clipboard-check"></i>
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900">Demande transmise à la Direction !</h3>
                <p className="text-gray-600 text-sm">
                  Votre demande d&apos;encadrement avec <strong>{contactTeacher.first_name} {contactTeacher.last_name}</strong> a bien été reçue par l&apos;Administration de SAMA ACADÉMIE.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 text-left space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <i className="fas fa-shield-alt"></i> Procédure Officielle SAMA ACADÉMIE
                  </p>
                  <p>
                    Un conseiller pédagogique va vérifier la disponibilité, convenir des créneaux officiels et valider votre inscription.
                  </p>
                </div>
                <button
                  onClick={() => setContactTeacher(null)}
                  className="w-full bg-sama-primary text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition text-sm"
                >
                  Compris, fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* En-tête + Recherche */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Trouvez l&apos;enseignant idéal</h1>
        <p className="text-gray-500 text-sm mb-6">
          Des professeurs particuliers disponibles dans les 14 régions du Sénégal.
        </p>

        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher par nom..." className="w-full border border-gray-200 rounded-2xl p-3 pl-11 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition" />
          </div>
          <div className="relative">
            <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-sama-primary text-sm"></i>
            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="w-full border border-gray-200 rounded-2xl p-3 pl-11 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition font-medium text-gray-700">
              {SENEGAL_REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
          </div>
          <div className="relative">
            <i className="fas fa-book absolute left-4 top-1/2 -translate-y-1/2 text-sama-primary text-sm"></i>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full border border-gray-200 rounded-2xl p-3 pl-11 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition font-medium text-gray-700">
              <option value="Toutes">Toutes les matières</option>
              <option value="Mathématiques">Mathématiques</option>
              <option value="SVT">SVT</option>
              <option value="Physique">Physique-Chimie</option>
              <option value="Français">Français</option>
              <option value="Anglais">Anglais</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <i className="fas fa-spinner fa-spin text-sama-primary text-3xl"></i>
          <p className="text-gray-500 mt-3 text-sm">Chargement des enseignants...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{filteredTeachers.length} enseignant(s) disponible(s)</h2>
            {(selectedSubject !== "Toutes" || selectedRegion !== "Toutes les régions" || searchQuery !== "") && (
              <button onClick={() => { setSelectedSubject("Toutes"); setSelectedRegion("Toutes les régions"); setSearchQuery(""); }} className="text-xs text-sama-primary font-bold hover:underline">
                Réinitialiser les filtres
              </button>
            )}
          </div>

          {filteredTeachers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
              <i className="fas fa-user-slash text-4xl text-gray-300 mb-3 block"></i>
              <h3 className="font-bold text-gray-700">Aucun enseignant ne correspond à ces critères</h3>
              <p className="text-xs text-gray-400 mt-1">Essayez de modifier votre recherche ou la région sélectionnée.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTeachers.map((teacher) => (
                <div key={teacher.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row gap-6 items-start hover:shadow-md transition">
                  
                  {teacher.avatar_url ? (
                    <img src={teacher.avatar_url} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover border flex-shrink-0 shadow-sm" />
                  ) : (
                    <div className={`w-24 h-24 rounded-2xl border flex items-center justify-center flex-shrink-0 font-extrabold text-3xl shadow-sm text-white ${getAvatarBg(teacher.first_name)}`}>
                      {getInitials(teacher.first_name, teacher.last_name)}
                    </div>
                  )}

                  <div className="flex-grow w-full">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          {teacher.first_name} {teacher.last_name}
                          {teacher.verified && <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">Vérifié</span>}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">
                          {teacher.subject || "Matière non spécifiée"} • {teacher.experience || "Expérience non spécifiée"}
                        </p>
                        <p className="text-sama-primary text-xs font-semibold mt-1">
                          📍 {teacher.region || "Région inconnue"} {teacher.quarter ? `(${teacher.quarter})` : ""}
                        </p>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-sama-primary text-[10px] font-black uppercase tracking-wider">
                          Tarif Officiel SAMA
                        </span>
                        <p className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
                          {teacher.level?.toLowerCase().includes("primaire")
                            ? "25 000 FCFA"
                            : teacher.level?.toLowerCase().includes("collège") || teacher.level?.toLowerCase().includes("college")
                            ? "35 000 FCFA"
                            : "45 000 FCFA"}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium">/ mois • Suivi Garanti</p>
                      </div>
                    </div>
                    
                    {teacher.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 italic">"{teacher.bio}"</p>
                    )}

                    <div className="flex sm:justify-end mt-4">
                      <button
                        onClick={() => handleContactClick(teacher)}
                        className="bg-sama-primary hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-sm"
                      >
                        <i className="fas fa-calendar-plus"></i> Demander un encadrement
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
