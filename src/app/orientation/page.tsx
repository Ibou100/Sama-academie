import Link from "next/link";

export default function OrientationPage() {
  const filieres = [
    { title: "Universités Publiques", desc: "UCAD, UGB, UADB, USSEIN...", icon: "🎓" },
    { title: "Écoles d'Ingénieurs", desc: "ESP, Thiès, Informatique, Génie Civil...", icon: "💻" },
    { title: "Santé & Médecine", desc: "Médecine, Pharmacie, Odontologie, INFAS...", icon: "⚕️" },
    { title: "Commerce & Gestion", desc: "Management, Banque, Finance, Marketing...", icon: "📊" },
    { title: "Armée & Sécurité", desc: "Police, Gendarmerie, Douanes, Sapeurs-pompiers...", icon: "🛡️" },
    { title: "Formation Professionnelle", desc: "ISEP, BTS, CAP, Métiers techniques...", icon: "🔧" }
  ];

  const conseils = [
    { title: "Réussir ses examens", desc: "Méthodologie pour le jour J et gestion des épreuves.", icon: "📝" },
    { title: "Mieux réviser", desc: "Techniques de mémorisation et d'apprentissage actif.", icon: "🧠" },
    { title: "Organiser son temps", desc: "Créer un planning de révision efficace et réaliste.", icon: "⏳" },
    { title: "Lutter contre le stress", desc: "Exercices de respiration, sommeil et hygiène de vie.", icon: "🧘🏾‍♂️" }
  ];

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* HEADER SECTION */}
      <div className="bg-sama-blue text-white rounded-3xl p-10 mb-12 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-extrabold mb-4">Orientation & Conseils Pédagogiques</h1>
          <p className="text-blue-100 text-lg">
            Découvrez les filières qui vous correspondent, explorez les métiers de demain et profitez de nos meilleurs conseils pour réussir vos examens et concours au Sénégal.
          </p>
        </div>
        <div className="absolute top-0 right-0 h-full w-1/3 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] hidden md:block"></div>
      </div>

      {/* ORIENTATION SCOLAIRE (Section K) */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sama-primary text-xl">
            🧭
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Orientation Scolaire & Professionnelle</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filieres.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm mb-4">{item.desc}</p>
              <span className="text-sama-primary font-semibold text-sm group-hover:underline">Voir les détails &rarr;</span>
            </div>
          ))}
        </div>
      </div>

      {/* CONSEILS PEDAGOGIQUES (Section L) */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-sama-orange text-xl">
            💡
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Conseils Pédagogiques</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {conseils.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-5 hover:shadow-md transition">
              <div className="text-4xl bg-gray-50 p-4 rounded-xl">{item.icon}</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
                <button className="mt-3 text-sama-primary font-semibold text-sm hover:underline">Lire l'article</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* CTA EN BAS */}
      <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Besoin d'un accompagnement sur mesure ?</h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Nos enseignants et conseillers d'orientation sont là pour vous aider à faire les bons choix et à préparer vos concours dans les meilleures conditions.
        </p>
        <Link href="/enseignants" className="btn-primary">
          Trouver un enseignant vérifié
        </Link>
      </div>

    </main>
  );
}
