import Link from "next/link";

export default function Matieres() {
  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Matières & Niveaux</h1>
        <p className="text-gray-500">Parcourez les matières enseignées par nos professeurs pour tous les niveaux scolaires.</p>
      </div>

      <div className="space-y-12">
        {/* Section Primaire */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-200 pb-2">
            <span className="bg-blue-50 text-sama-primary p-2 rounded-lg"><i className="fas fa-child"></i></span>
            Primaire <span className="text-sm font-normal text-gray-400 ml-2">CI au CM2</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition text-center shadow-sm">
              <h4 className="font-bold text-gray-800">Mathématiques</h4>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition text-center shadow-sm">
              <h4 className="font-bold text-gray-800">Français</h4>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition text-center shadow-sm">
              <h4 className="font-bold text-gray-800">Éveil / Découverte</h4>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 hover:shadow-md transition text-center shadow-sm">
              <h4 className="font-bold text-sama-primary">Préparation CFEE</h4>
            </div>
          </div>
        </div>

        {/* Section Collège */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-200 pb-2">
            <span className="bg-blue-50 text-sama-primary p-2 rounded-lg"><i className="fas fa-school"></i></span>
            Collège <span className="text-sm font-normal text-gray-400 ml-2">6e à 3e</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition text-center shadow-sm">
              <h4 className="font-bold text-gray-800">Mathématiques</h4>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition text-center shadow-sm">
              <h4 className="font-bold text-gray-800">Physique-Chimie</h4>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition text-center shadow-sm">
              <h4 className="font-bold text-gray-800">SVT</h4>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition text-center shadow-sm">
              <h4 className="font-bold text-gray-800">Français</h4>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition text-center shadow-sm">
              <h4 className="font-bold text-gray-800">Anglais</h4>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition text-center shadow-sm">
              <h4 className="font-bold text-gray-800">Histoire-Géo</h4>
            </div>
            <div className="col-span-1 sm:col-span-2 bg-blue-50 border border-blue-100 rounded-2xl p-5 hover:shadow-md transition flex items-center justify-center gap-2 shadow-sm">
              <i className="fas fa-award text-sama-orange"></i>
              <h4 className="font-bold text-sama-primary">Préparation BFEM</h4>
            </div>
          </div>
        </div>

        {/* Section Lycée */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-200 pb-2">
            <span className="bg-blue-50 text-sama-primary p-2 rounded-lg"><i className="fas fa-university"></i></span>
            Lycée <span className="text-sm font-normal text-gray-400 ml-2">Seconde à Terminale</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition shadow-sm">
              <h4 className="font-bold text-gray-900 mb-3 text-lg">Séries Scientifiques (S)</h4>
              <ul className="text-sm text-gray-500 space-y-2 font-medium">
                <li>• Mathématiques Avancées</li>
                <li>• Physique-Chimie</li>
                <li>• Sciences de la Vie et de la Terre</li>
              </ul>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition shadow-sm">
              <h4 className="font-bold text-gray-900 mb-3 text-lg">Séries Littéraires (L)</h4>
              <ul className="text-sm text-gray-500 space-y-2 font-medium">
                <li>• Philosophie</li>
                <li>• Français</li>
                <li>• Langues (Anglais, Espagnol, Arabe...)</li>
                <li>• Histoire-Géographie</li>
              </ul>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition shadow-sm">
              <h4 className="font-bold text-gray-900 mb-3 text-lg">Séries Éco/Gestion (G)</h4>
              <ul className="text-sm text-gray-500 space-y-2 font-medium">
                <li>• Économie et Gestion</li>
                <li>• Comptabilité</li>
                <li>• Mathématiques Appliquées</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
