"use client";

export default function Contact() {
  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Contactez SAMA ACADÉMIE</h1>
          <p className="text-gray-500">Nous sommes là pour répondre à vos questions et vous accompagner.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Fonctionnalité en cours de développement.");
            }}
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Prénom</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                  placeholder="Votre prénom"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                  placeholder="Votre nom"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                placeholder="votre.email@exemple.com"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Sujet</label>
              <select className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition">
                <option>Information générale</option>
                <option>Support technique</option>
                <option>Problème de paiement</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
              <textarea
                rows={5}
                className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                placeholder="Comment pouvons-nous vous aider ?"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-sama-primary hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition shadow-sm"
            >
              Envoyer le message
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
