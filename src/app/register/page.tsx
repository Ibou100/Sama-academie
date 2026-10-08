"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const SENEGAL_REGIONS = [
  "Dakar", "Thiès", "Saint-Louis", "Diourbel", 
  "Ziguinchor", "Kaolack", "Louga", "Fatick", 
  "Kolda", "Matam", "Kaffrine", "Kédougou", 
  "Sédhiou", "Tambacounda"
];

const SUBJECTS = [
  "Mathématiques", "Physique-Chimie", "SVT", 
  "Français", "Anglais", "Philosophie", "Histoire-Géographie",
  "Économie / Sciences Sociales", "Arabe", "Informatique"
];

const CYCLES = [
  { id: "Primaire", label: "Primaire", classes: ["CI", "CP", "CE1", "CE2", "CM1", "CM2 (Entrée en 6e)"] },
  { id: "College", label: "Collège", classes: ["6ème", "5ème", "4ème", "3ème (BFEM)"] },
  { id: "Lycee", label: "Lycée", classes: ["Seconde L", "Seconde S", "Première L1", "Première L2", "Première S1", "Première S2", "Terminale L1", "Terminale L2", "Terminale S1", "Terminale S2", "Terminale G/STEG"] },
  { id: "Superieur", label: "Supérieur / Concours", classes: ["Licence 1", "Licence 2", "Licence 3", "Master", "Concours d'État / Prépa"] },
];

const DIPLOMAS = [
  "Master / Maîtrise (Bac+5)",
  "FASTEF / École Normale Supérieure",
  "CREM / CRFPE (Instituteur certifié)",
  "Licence (Bac+3)",
  "Doctorat (Bac+8)",
  "Diplôme d'Ingénieur",
  "CAPES / Diplôme Pédagogique d'État",
  "Autre certification d'enseignement",
];

const EXPERIENCES = [
  "Débutant (Moins de 2 ans)",
  "2 à 5 ans d'expérience",
  "5 à 10 ans d'expérience",
  "Plus de 10 ans d'expérience (Professeur Chevronné)",
];

export default function Register() {
  const [role, setRole] = useState<"eleve" | "enseignant" | "parent">("eleve");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("Dakar");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Spécifique Élève
  const [selectedCycle, setSelectedCycle] = useState("Lycee");
  const [selectedClass, setSelectedClass] = useState("Terminale S2");

  // Spécifique Parent
  const [childName, setChildName] = useState("");
  const [childCycle, setChildCycle] = useState("Lycee");
  const [childClass, setChildClass] = useState("Terminale S2");

  // Spécifique Enseignant
  const [subject, setSubject] = useState("Mathématiques");
  const [teachingCycle, setTeachingCycle] = useState("Lycée (Seconde à Terminale)");
  const [diploma, setDiploma] = useState(DIPLOMAS[0]);
  const [experienceYears, setExperienceYears] = useState(EXPERIENCES[1]);
  const [teacherBio, setTeacherBio] = useState("");
  const [teacherPrice, setTeacherPrice] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const activeClasses = CYCLES.find((c) => c.id === selectedCycle)?.classes || [];
  const activeChildClasses = CYCLES.find((c) => c.id === childCycle)?.classes || [];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (!phone) {
      setError("Le numéro de téléphone WhatsApp est obligatoire.");
      return;
    }
    if (role === "parent" && !childName.trim()) {
      setError("Veuillez indiquer le nom et prénom de votre enfant.");
      return;
    }

    setLoading(true);

    try {
      // Déconnecter toute session active locale pour éviter les conflits d'authentification
      try {
        await supabase.auth.signOut();
      } catch (_) {}

      const isTeacher = role === "enseignant";
      const isParent = role === "parent";

      const cycleLabel = selectedCycle === "Lycee" ? "Lycée" : selectedCycle === "College" ? "Collège" : selectedCycle;
      const childCycleLabel = childCycle === "Lycee" ? "Lycée" : childCycle === "College" ? "Collège" : childCycle;

      const userLevel = isParent 
        ? `Enfant : ${childName.trim()} (${childCycleLabel} - ${childClass})`
        : isTeacher 
          ? teachingCycle 
          : `${cycleLabel} - ${selectedClass}`;

      const userBio = isParent
        ? `Parent d'élève : ${childName.trim()} (Classe : ${childClass})`
        : isTeacher
          ? (teacherBio.trim() || `Diplôme : ${diploma} • Expérience : ${experienceYears}`)
          : null;

      const userExperience = isTeacher ? `${experienceYears} (${diploma})` : null;
      const isVerified = !isTeacher; // Les enseignants démarrent à false (en attente de validation admin)

      const normalizedEmail = email.trim().toLowerCase();

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            role: role,
            email: normalizedEmail,
            phone: phone.trim(),
            region: region,
            level: userLevel,
            subject: isTeacher ? subject : null,
            experience: userExperience,
            price: isTeacher ? (teacherPrice.trim() || null) : null,
            bio: userBio,
            verified: isVerified,
          }
        }
      });

      if (signUpError) {
        const msg = signUpError.message || "";
        if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already in use") || msg.toLowerCase().includes("user already exists")) {
          setError("Cette adresse email est déjà enregistrée. Veuillez vous connecter directement.");
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      // Si Supabase renvoie un user avec identities vide (compte existant sans confirmation requise)
      if (signUpData?.user && Array.isArray(signUpData.user.identities) && signUpData.user.identities.length === 0) {
        setError("Cette adresse email est déjà enregistrée. Vous pouvez vous connecter directement avec votre mot de passe.");
        setLoading(false);
        return;
      }

      // Synchronisation directe avec profiles
      if (signUpData?.user) {
        try {
          const profilePayload = {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            role: role,
            email: normalizedEmail,
            phone: phone.trim(),
            region: region,
            level: userLevel,
            subject: isTeacher ? subject : null,
            experience: userExperience,
            price: isTeacher ? (teacherPrice.trim() || null) : null,
            bio: userBio,
            verified: isVerified,
          };

          // Mise à jour directe sur l'enregistrement créé par le trigger d'authentification
          const { error: updateErr } = await supabase
            .from("profiles")
            .update(profilePayload)
            .eq("id", signUpData.user.id);

          if (updateErr) {
            console.warn("Premier update profiles:", updateErr.message);
            // En cas de micro-délai du trigger PostgreSQL, retenter après 350ms
            await new Promise((resolve) => setTimeout(resolve, 350));
            await supabase
              .from("profiles")
              .update(profilePayload)
              .eq("id", signUpData.user.id);
          }
        } catch (err) {
          console.error("Profile sync error:", err);
        }
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("Registration error:", err);
      const errMsg = err?.message || err?.toString() || "";
      if (errMsg.includes("Failed to fetch")) {
        setError("Session réinitialisée. Votre précédente connexion a été nettoyée. Veuillez cliquer à nouveau sur 'Créer mon compte'.");
      } else {
        setError(errMsg || "Une erreur est survenue lors de l'inscription. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center space-y-5">
          {role === "enseignant" ? (
            <>
              <div className="w-16 h-16 bg-blue-100 text-sama-primary rounded-full flex items-center justify-center mx-auto text-3xl">
                <i className="fas fa-user-clock"></i>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Dossier Enseignant Soumis !</h2>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 text-left space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-sama-primary text-sm">
                  <i className="fas fa-shield-alt"></i> Contrôle Qualité Pédagogique
                </p>
                <p>
                  Votre inscription a bien été reçue. Conformément aux directives de <strong>SAMA ACADÉMIE</strong>, l&apos;administration vérifie chaque profil d&apos;enseignant (diplômes, spécialité) avant publication dans l&apos;annuaire officiel.
                </p>
                <p className="text-gray-500">
                  Notre équipe pédagogique vous contactera sous 24h à 48h au <strong>{phone}</strong> pour confirmer votre compte.
                </p>
              </div>
              <Link href="/login" className="block w-full bg-sama-primary text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition">
                Accéder à la connexion
              </Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                <i className="fas fa-check"></i>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Bienvenue sur SAMA ACADÉMIE !</h2>
              <p className="text-gray-600 text-sm">
                Votre compte {role === "parent" ? "Parent" : "Élève"} a bien été créé. Vous pouvez désormais vous connecter et bénéficier de notre accompagnement d&apos;excellence.
              </p>
              <Link href="/login" className="block w-full bg-sama-primary text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition">
                Me connecter maintenant
              </Link>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sama-primary/10 text-sama-primary text-xs font-bold mb-3">
            Plateforme Éducative Sénégalaise
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Rejoignez SAMA ACADÉMIE</h2>
          <p className="mt-1 text-sm text-gray-500">Choisissez votre profil pour une expérience personnalisée</p>
        </div>

        {/* Sélecteur de rôle en 3 cartes */}
        <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole("eleve")}
            className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex flex-col items-center gap-1 ${
              role === "eleve"
                ? "bg-white text-sama-primary shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <i className="fas fa-user-graduate text-base"></i>
            <span>Élève</span>
          </button>

          <button
            type="button"
            onClick={() => setRole("parent")}
            className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex flex-col items-center gap-1 ${
              role === "parent"
                ? "bg-white text-sama-primary shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <i className="fas fa-user-friends text-base"></i>
            <span>Parent</span>
          </button>

          <button
            type="button"
            onClick={() => setRole("enseignant")}
            className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex flex-col items-center gap-1 ${
              role === "enseignant"
                ? "bg-white text-sama-primary shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <i className="fas fa-chalkboard-teacher text-base"></i>
            <span>Enseignant</span>
          </button>
        </div>

        {/* Bannière explicative selon le rôle */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs text-gray-600">
          {role === "eleve" && (
            <p>
              🎓 <strong>Espace Élève :</strong> Accédez aux cours vidéos, annales officielles, orientation et séances d&apos;encadrement personnalisées adaptées à votre niveau.
            </p>
          )}
          {role === "parent" && (
            <p>
              👨‍👩‍👧 <strong>Espace Parent :</strong> Suivez la progression de vos enfants, demandez des professeurs certifiés et bénéficiez d&apos;un point régulier avec l&apos;administration.
            </p>
          )}
          {role === "enseignant" && (
            <p>
              📚 <strong>Espace Enseignant Certifié :</strong> Rejoignez le corps professoral de SAMA ACADÉMIE. Votre profil sera vérifié par notre équipe avant d&apos;être accrédité.
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3.5 rounded-xl text-center space-y-1.5">
            <p className="font-semibold">{error}</p>
            {(error.includes("déjà") || error.includes("connecter")) && (
              <div>
                <Link href="/login" className="inline-flex items-center gap-1 text-xs font-bold text-sama-primary hover:underline bg-white px-3 py-1 rounded-lg border border-red-200 shadow-xs">
                  <span>Accéder à la page de connexion</span>
                  <i className="fas fa-arrow-right text-[10px]"></i>
                </Link>
              </div>
            )}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleRegister}>
          {/* Prénom / Nom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {role === "parent" ? "Prénom du Parent" : "Prénom"}
              </label>
              <input
                type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex: Modou"
                className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {role === "parent" ? "Nom du Parent" : "Nom"}
              </label>
              <input
                type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Ndiaye"
                className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
              />
            </div>
          </div>

          {/* Email / Téléphone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@sama.sn"
                className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Téléphone (WhatsApp)
              </label>
              <input
                type="tel" required placeholder="+221 77 000 00 00" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
              />
            </div>
          </div>

          {/* Région */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Région de résidence</label>
            <select
              value={region} onChange={(e) => setRegion(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
            >
              {SENEGAL_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* === CAS 1 : ÉLÈVE (Cycle & Classe) === */}
          {role === "eleve" && (
            <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cycle d&apos;études</label>
                <select
                  value={selectedCycle}
                  onChange={(e) => {
                    const c = e.target.value;
                    setSelectedCycle(c);
                    const classes = CYCLES.find((item) => item.id === c)?.classes || [];
                    if (classes.length > 0) setSelectedClass(classes[0]);
                  }}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-sama-primary transition"
                >
                  {CYCLES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Classe actuelle</label>
                <select
                  value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-sama-primary transition"
                >
                  {activeClasses.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* === CAS 2 : PARENT (Infos de l'enfant) === */}
          {role === "parent" && (
            <div className="space-y-3 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
              <p className="text-xs font-extrabold text-purple-900 flex items-center gap-1.5">
                <i className="fas fa-child"></i> Informations sur l&apos;élève à charge
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Prénom & Nom de l&apos;enfant</label>
                <input
                  type="text" required value={childName} onChange={(e) => setChildName(e.target.value)}
                  placeholder="Ex: Fatou Ndiaye"
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-sama-primary transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cycle de l&apos;enfant</label>
                  <select
                    value={childCycle}
                    onChange={(e) => {
                      const c = e.target.value;
                      setChildCycle(c);
                      const classes = CYCLES.find((item) => item.id === c)?.classes || [];
                      if (classes.length > 0) setChildClass(classes[0]);
                    }}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-sama-primary transition"
                  >
                    {CYCLES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Classe de l&apos;enfant</label>
                  <select
                    value={childClass} onChange={(e) => setChildClass(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-sama-primary transition"
                  >
                    {activeChildClasses.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* === CAS 3 : ENSEIGNANT (Qualifications, Diplôme & Expérience) === */}
          {role === "enseignant" && (
            <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
              <p className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                <i className="fas fa-certificate"></i> Dossier Pédagogique & Diplômes
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Matière principale</label>
                  <select
                    value={subject} onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-sama-primary transition"
                  >
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cycle d&apos;intervention</label>
                  <select
                    value={teachingCycle} onChange={(e) => setTeachingCycle(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-sama-primary transition"
                  >
                    <option>Primaire (CI à CM2)</option>
                    <option>Collège (6e à 3e)</option>
                    <option>Lycée (Seconde à Terminale)</option>
                    <option>Collège & Lycée</option>
                    <option>Supérieur & Classes Prépa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Diplôme le plus élevé</label>
                <select
                  value={diploma} onChange={(e) => setDiploma(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-sama-primary transition"
                >
                  {DIPLOMAS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Expérience dans l&apos;enseignement</label>
                <select
                  value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-sama-primary transition"
                >
                  {EXPERIENCES.map((exp) => <option key={exp} value={exp}>{exp}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Rémunération souhaitée par élève (optionnel)
                </label>
                <input
                  type="text"
                  value={teacherPrice}
                  onChange={(e) => setTeacherPrice(e.target.value)}
                  placeholder="Ex: 30 000 FCFA / mois ou 5 000 FCFA / heure"
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-sama-primary transition"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Transmis à l&apos;Administration de SAMA ACADÉMIE comme base de négociation avec les parents d&apos;élèves.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Courte présentation / Lycées ou établissements fréquentés (optionnel)
                </label>
                <textarea
                  rows={2}
                  value={teacherBio}
                  onChange={(e) => setTeacherBio(e.target.value)}
                  placeholder="Ex: Professeur de Mathématiques certifié FASTEF, ayant enseigné aux lycées Lamine Guèye et Seydina Limamoulaye..."
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-sama-primary transition"
                />
              </div>
            </div>
          )}

          {/* Mots de passe */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 caractères"
                  className="w-full border border-gray-300 rounded-xl p-3 pr-10 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Confirmer</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez"
                  className={`w-full border rounded-xl p-3 pr-10 text-sm bg-gray-50 outline-none focus:bg-white transition ${
                    confirmPassword && confirmPassword !== password ? "border-red-400 focus:border-red-400" : confirmPassword && confirmPassword === password ? "border-green-400 focus:border-green-400" : "border-gray-300 focus:border-sama-primary"
                  }`}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-sama-primary hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold py-3.5 rounded-xl transition shadow-sm mt-4 flex justify-center items-center gap-2"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : role === "enseignant" ? "Soumettre mon dossier enseignant" : "Créer mon compte"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ? <Link href="/login" className="font-bold text-sama-primary hover:underline">Connectez-vous</Link>
        </div>
      </div>
    </main>
  );
}
