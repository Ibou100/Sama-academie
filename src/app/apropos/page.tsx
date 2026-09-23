import Link from "next/link";

export default function Apropos() {
  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">Faire de SAMA ACADÉMIE la référence de l&apos;éducation au Sénégal</h1>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Notre Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            L&apos;éducation occupe une place essentielle dans le développement du Sénégal. Pourtant, de nombreux élèves
            rencontrent des difficultés pour trouver rapidement des enseignants compétents ou accéder à des documents de qualité.
            Les cours de renforcement sont souvent difficiles à organiser, les épreuves des concours sont dispersées.
          </p>
          <p className="text-gray-600 leading-relaxed">
            SAMA ACADÉMIE est une plateforme éducative innovante qui ambitionne de devenir le partenaire privilégié des élèves,
            étudiants, enseignants et parents, en centralisant tous les outils d&apos;apprentissage.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">L&apos;Équipe Fondatrice</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
          {/* Founder 1 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-center hover:shadow-md transition">
            <div className="w-full h-64 overflow-hidden bg-gray-100">
              <img src="/assets/founder-1.jpg" alt="ELHADJI ABDOU NDOUR" className="w-full h-full object-cover object-top" />
            </div>
            <div className="p-5 border-t-4 border-sama-primary">
              <h4 className="font-bold text-gray-900 uppercase">ELHADJI ABDOU NDOUR</h4>
              <p className="text-sm font-bold text-sama-primary mt-1">Directeur Pédagogique</p>
              <p className="text-xs text-gray-500 italic mt-3">« L&apos;excellence dans l&apos;éducation est notre priorité. »</p>
            </div>
          </div>
          {/* Founder 2 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-center hover:shadow-md transition">
            <div className="w-full h-64 overflow-hidden bg-gray-100">
              <img src="/assets/founder-2.jpg" alt="OUSMANE KA" className="w-full h-full object-cover object-top" />
            </div>
            <div className="p-5 border-t-4 border-sama-primary">
              <h4 className="font-bold text-gray-900 uppercase">OUSMANE KA</h4>
              <p className="text-sm font-bold text-sama-primary mt-1">Directeur Exécutif & Président</p>
              <p className="text-xs text-gray-500 italic mt-3">« Ensemble, construisons le futur de l&apos;éducation. »</p>
            </div>
          </div>
          {/* Founder 3 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-center hover:shadow-md transition">
            <div className="w-full h-64 overflow-hidden bg-gray-100">
              <img src="/assets/founder-3.jpg" alt="MOUHAMADOU MAKHTAR NDOUR" className="w-full h-full object-cover object-top" />
            </div>
            <div className="p-5 border-t-4 border-sama-primary">
              <h4 className="font-bold text-gray-900 uppercase">MOUHAMADOU M. NDOUR</h4>
              <p className="text-sm font-bold text-sama-primary mt-1">Directeur Technique & Digital</p>
              <p className="text-xs text-gray-500 italic mt-3">« Le numérique au service de votre réussite. »</p>
            </div>
          </div>
        </div>

        {/* Deuxième ligne centrée pour les 2 derniers fondateurs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Founder 4 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-center hover:shadow-md transition">
            <div className="w-full h-64 overflow-hidden bg-gray-100">
              <img src="/assets/founder-4.jpg" alt="SAPHIETOU CISS" className="w-full h-full object-cover object-top" />
            </div>
            <div className="p-5 border-t-4 border-sama-primary">
              <h4 className="font-bold text-gray-900 uppercase">SAPHIETOU CISS</h4>
              <p className="text-sm font-bold text-sama-primary mt-1">Directrice Marketing & Com.</p>
              <p className="text-xs text-gray-500 italic mt-3">« Une bonne communication pour un meilleur impact. »</p>
            </div>
          </div>
          {/* Founder 5 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-center hover:shadow-md transition">
            <div className="w-full h-64 overflow-hidden bg-gray-100">
              <img src="/assets/founder-5.jpg" alt="ABABACAR FAYE" className="w-full h-full object-cover object-top" />
            </div>
            <div className="p-5 border-t-4 border-sama-primary">
              <h4 className="font-bold text-gray-900 uppercase">ABABACAR FAYE</h4>
              <p className="text-sm font-bold text-sama-primary mt-1">Directeur Général</p>
              <p className="text-xs text-gray-500 italic mt-3">« Stratégie, vision et action pour un avenir meilleur. »</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
