import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* HERO SECTION */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 mb-8 relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="z-10">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">🇸🇳</span>
              <span className="text-sm font-bold tracking-wide text-gray-500 uppercase">
                La plateforme éducative n°1 au Sénégal
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-sama-blue leading-[1.1] mb-6">
              Réviser aujourd&apos;hui,<br />
              réussir demain,<br />
              construire son avenir.
            </h1>
            <p className="text-lg text-gray-500 mb-8 max-w-md">
              Trouvez un enseignant vérifié près de chez vous, révisez avec des annales corrigées et préparez le BFEM,
              le BAC et les concours du Sénégal.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/enseignants"
                className="bg-sama-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-sm text-center"
              >
                Trouver un enseignant
              </Link>
              <Link
                href="/examens"
                className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm text-center"
              >
                Voir les annales gratuites
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex text-yellow-400 text-sm">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star-half-alt"></i>
              </div>
              <p className="text-sm font-semibold text-gray-600">
                4,8/5 — <span className="font-normal text-gray-500">+10 000 avis d&apos;élèves et de parents</span>
              </p>
            </div>
          </div>

          {/* Hero image */}
          <div className="hidden md:block relative z-10">
            <img
              src="/assets/hero-students-v2.jpg"
              alt="Deux étudiants sénégalais qui révisent ensemble"
              className="w-full h-80 object-cover rounded-2xl shadow-xl"
            />
            <div className="absolute -bottom-4 -left-8 bg-white px-4 py-2 rounded-lg shadow-lg transform -rotate-6 font-semibold text-sama-primary border-l-4 border-sama-orange text-sm">
              ✨ Ensemble vers la réussite !
            </div>
          </div>
        </div>
      </div>

      {/* STATS BANNERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-sama-blue text-white p-6 rounded-2xl shadow-sm">
          <h3 className="text-3xl font-bold mb-1">+10 000</h3>
          <p className="text-blue-200 text-sm font-medium">élèves inscrits</p>
        </div>
        <div className="bg-sama-blue text-white p-6 rounded-2xl shadow-sm">
          <h3 className="text-3xl font-bold mb-1">+500</h3>
          <p className="text-blue-200 text-sm font-medium">enseignants vérifiés</p>
        </div>
        <div className="bg-sama-blue text-white p-6 rounded-2xl shadow-sm">
          <h3 className="text-3xl font-bold mb-1">+200</h3>
          <p className="text-blue-200 text-sm font-medium">matières disponibles</p>
        </div>
        <div className="bg-sama-blue text-white p-6 rounded-2xl shadow-sm">
          <h3 className="text-3xl font-bold mb-1">94%</h3>
          <p className="text-blue-200 text-sm font-medium">taux de réussite</p>
        </div>
      </div>

      {/* MATIÈRES QUICK START */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Choisissez une matière pour commencer</h2>
          <Link href="/matieres" className="text-sama-primary font-semibold text-sm hover:underline">
            Voir toutes les matières
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="border border-gray-100 rounded-xl p-4 text-center hover:shadow-md transition bg-gray-50 cursor-pointer">
            <h4 className="font-bold text-gray-900 mb-1">Mathématiques</h4>
            <p className="text-xs text-gray-500">Primaire à Université</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-4 text-center hover:shadow-md transition bg-gray-50 cursor-pointer">
            <h4 className="font-bold text-gray-900 mb-1">Physique-Chimie</h4>
            <p className="text-xs text-gray-500">Collège et Lycée</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-4 text-center hover:shadow-md transition bg-gray-50 cursor-pointer">
            <h4 className="font-bold text-gray-900 mb-1">Français</h4>
            <p className="text-xs text-gray-500">Primaire à Lycée</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-4 text-center hover:shadow-md transition bg-gray-50 cursor-pointer">
            <h4 className="font-bold text-gray-900 mb-1">SVT</h4>
            <p className="text-xs text-gray-500">Collège et Lycée</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-4 text-center hover:shadow-md transition bg-gray-50 cursor-pointer">
            <h4 className="font-bold text-gray-900 mb-1">Anglais</h4>
            <p className="text-xs text-gray-500">Tous niveaux</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-4 text-center hover:shadow-md transition bg-gray-50 cursor-pointer">
            <h4 className="font-bold text-gray-900 mb-1">Économie</h4>
            <p className="text-xs text-gray-500">Lycée et Supérieur</p>
          </div>
        </div>
      </div>

      {/* NOTRE ÉQUIPE */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">NOTRE ÉQUIPE — Nos Co-fondateurs</h2>
          <p className="text-gray-500">Une équipe passionnée, un objectif commun : votre réussite.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition overflow-hidden">
            <div className="w-full h-52 overflow-hidden bg-gray-100">
              <img src="/assets/founder-1.jpg" alt="ELHADJI ABDOU NDOUR" className="w-full h-full object-cover object-top" />
            </div>
            <div className="p-4">
              <h4 className="font-bold text-gray-900 text-sm uppercase leading-tight">ELHADJI ABDOU NDOUR</h4>
              <p className="text-xs font-bold text-sama-primary mb-2 mt-1">Directeur Pédagogique</p>
              <p className="text-xs text-gray-500 italic">« L&apos;excellence dans l&apos;éducation est notre priorité. »</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition overflow-hidden">
            <div className="w-full h-52 overflow-hidden bg-gray-100">
              <img src="/assets/founder-2.jpg" alt="OUSMANE KA" className="w-full h-full object-cover object-top" />
            </div>
            <div className="p-4">
              <h4 className="font-bold text-gray-900 text-sm uppercase leading-tight">OUSMANE KA</h4>
              <p className="text-xs font-bold text-sama-primary mb-2 mt-1">Directeur Exécutif & Président</p>
              <p className="text-xs text-gray-500 italic">« Ensemble, construisons le futur de l&apos;éducation. »</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition overflow-hidden">
            <div className="w-full h-52 overflow-hidden bg-gray-100">
              <img src="/assets/founder-3.jpg" alt="MOUHAMADOU MAKHTAR NDOUR" className="w-full h-full object-cover object-top" />
            </div>
            <div className="p-4">
              <h4 className="font-bold text-gray-900 text-sm uppercase leading-tight">MOUHAMADOU M. NDOUR</h4>
              <p className="text-xs font-bold text-sama-primary mb-2 mt-1">Directeur Technique & Digital</p>
              <p className="text-xs text-gray-500 italic">« Le numérique au service de votre réussite. »</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition overflow-hidden">
            <div className="w-full h-52 overflow-hidden bg-gray-100">
              <img src="/assets/founder-4.jpg" alt="SAPHIETOU CISS" className="w-full h-full object-cover object-top" />
            </div>
            <div className="p-4">
              <h4 className="font-bold text-gray-900 text-sm uppercase leading-tight">SAPHIETOU CISS</h4>
              <p className="text-xs font-bold text-sama-primary mb-2 mt-1">Directrice Marketing & Com.</p>
              <p className="text-xs text-gray-500 italic">« Une bonne communication pour un meilleur impact. »</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition overflow-hidden">
            <div className="w-full h-52 overflow-hidden bg-gray-100">
              <img src="/assets/founder-5.jpg" alt="ABABACAR FAYE" className="w-full h-full object-cover object-top" />
            </div>
            <div className="p-4">
              <h4 className="font-bold text-gray-900 text-sm uppercase leading-tight">ABABACAR FAYE</h4>
              <p className="text-xs font-bold text-sama-primary mb-2 mt-1">Directeur Général</p>
              <p className="text-xs text-gray-500 italic">« Stratégie, vision et action pour un avenir meilleur. »</p>
            </div>
          </div>
        </div>
      </div>

      {/* RÉASSURANCE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 mx-auto bg-blue-50 text-sama-primary rounded-full flex items-center justify-center text-xl mb-4">
            <i className="fas fa-clock"></i>
          </div>
          <h4 className="font-bold text-gray-900 mb-2">Accessible 24h/24</h4>
          <p className="text-sm text-gray-500">Apprenez quand vous voulez, où vous voulez.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 mx-auto bg-blue-50 text-sama-primary rounded-full flex items-center justify-center text-xl mb-4">
            <i className="fas fa-shield-alt"></i>
          </div>
          <h4 className="font-bold text-gray-900 mb-2">Paiement sécurisé</h4>
          <p className="text-sm text-gray-500">Wave, Orange Money, Free Money, Carte bancaire.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 mx-auto bg-blue-50 text-sama-primary rounded-full flex items-center justify-center text-xl mb-4">
            <i className="fas fa-file-alt"></i>
          </div>
          <h4 className="font-bold text-gray-900 mb-2">Qualité garantie</h4>
          <p className="text-sm text-gray-500">Des programmes officiels et des profils vérifiés.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 mx-auto bg-blue-50 text-sama-primary rounded-full flex items-center justify-center text-xl mb-4">
            <i className="fas fa-headset"></i>
          </div>
          <h4 className="font-bold text-gray-900 mb-2">Support réactif</h4>
          <p className="text-sm text-gray-500">Notre équipe vous accompagne au quotidien.</p>
        </div>
      </div>
    </main>
  );
}
