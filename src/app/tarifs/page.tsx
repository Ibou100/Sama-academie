import Link from "next/link";

export default function Tarifs() {
  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Des tarifs adaptés à chaque famille</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Les annales restent gratuites. L&apos;abonnement débloque les corrigés, les vidéos et le suivi personnalisé.
        </p>

        <div className="mt-8 inline-flex bg-gray-100 p-1 rounded-full items-center">
          <button className="bg-sama-blue text-white px-6 py-2 rounded-full font-bold text-sm shadow-sm">Mensuel</button>
          <button className="text-gray-500 px-6 py-2 rounded-full font-bold text-sm hover:text-gray-900 transition">
            Annuel <span className="ml-1 text-[10px] bg-white text-gray-800 px-2 py-0.5 rounded-full shadow-sm">— 2 mois offerts</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch mb-16">
        {/* Gratuit */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Gratuit</h3>
          <div className="mb-6 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-gray-900">0 F</span>
            <span className="text-gray-400 text-sm font-medium">pour toujours</span>
          </div>
          <ul className="space-y-4 mb-8 flex-grow text-sm text-gray-600 font-medium">
            <li>Annales et sujets d&apos;examens</li>
            <li>Recherche d&apos;enseignants</li>
            <li>3 fiches de révision par mois</li>
            <li>Messagerie après réservation</li>
          </ul>
          <Link href="/register" className="w-full btn-outline py-3 border-gray-300 block text-center">
            Créer un compte gratuit
          </Link>
        </div>

        {/* Premium Élève */}
        <div className="bg-white rounded-3xl p-8 border-2 border-sama-primary shadow-lg flex flex-col relative transform md:-translate-y-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Premium Élève</h3>
          <div className="mb-6 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-gray-900">3 500 F</span>
            <span className="text-gray-400 text-sm font-medium">par mois</span>
          </div>
          <ul className="space-y-4 mb-8 flex-grow text-sm text-gray-600 font-medium">
            <li className="text-gray-900">Tous les corrigés détaillés</li>
            <li>Vidéos de correction</li>
            <li>Bibliothèque complète</li>
            <li>Tests et suivi de progression</li>
            <li>Classes virtuelles</li>
          </ul>
          <Link href="/checkout?plan=eleve" className="w-full bg-sama-primary text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition block text-center">
            Souscrire (3 500 F/mois)
          </Link>
        </div>

        {/* Premium Famille */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Premium Famille</h3>
          <div className="mb-6 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-gray-900">6 000 F</span>
            <span className="text-gray-400 text-sm font-medium">jusqu&apos;à 3 enfants</span>
          </div>
          <ul className="space-y-4 mb-8 flex-grow text-sm text-gray-600 font-medium">
            <li className="text-gray-900">Tout le Premium Élève</li>
            <li className="text-gray-900">Tableau de bord parent</li>
            <li>Suivi des cours et paiements</li>
            <li>Enseignants vérifiés en priorité</li>
          </ul>
          <Link href="/checkout?plan=famille" className="w-full btn-outline py-3 border-gray-300 block text-center">
            Souscrire (6 000 F/mois)
          </Link>
        </div>

        {/* Pack Concours */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Pack Concours</h3>
          <div className="mb-6 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-gray-900">9 000 F</span>
          </div>
          <p className="text-gray-400 text-sm font-medium -mt-4 mb-6">paiement unique, par concours</p>
          <ul className="space-y-4 mb-8 flex-grow text-sm text-gray-600 font-medium">
            <li className="text-gray-900">Toutes les sessions disponibles</li>
            <li>Corrigés et méthodologie</li>
            <li>Tests psychotechniques</li>
            <li>Accès valable 12 mois</li>
          </ul>
          <Link href="/checkout?plan=concours" className="w-full btn-outline py-3 border-gray-300 block text-center">
            Acheter ce pack (9 000 F)
          </Link>
        </div>
      </div>

      {/* Guide de Règlement Direct Wave / Orange Money */}
      <div className="bg-gradient-to-r from-blue-900 via-sama-primary to-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-10 shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-sama-orange text-white text-xs font-black uppercase px-3 py-1 rounded-full">
              <i className="fas fa-lock"></i> Règlement Direct &amp; Accompagné
            </div>
            <h3 className="text-xl sm:text-2xl font-black">Comment s&apos;effectue le paiement de votre abonnement ?</h3>
            <p className="text-blue-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Pour une sécurité totale et un service de proximité sans frais cachés, les abonnements sont réglés directement par transfert <strong>Wave</strong> ou <strong>Orange Money</strong> sur la ligne officielle de SAMA ACADÉMIE (<strong>+221 77 467 31 09</strong>). L&apos;équipe active votre statut Premium immédiatement après confirmation.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0 w-full sm:w-auto">
            <a
              href="https://wa.me/221774673109?text=Bonjour%20SAMA%20ACADÉMIE,%20je%20souhaite%20m'abonner%20au%20service%20Premium."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-6 py-3.5 rounded-2xl transition shadow flex items-center justify-center gap-2 text-sm"
            >
              <i className="fab fa-whatsapp text-lg"></i>
              <span>Souscrire via WhatsApp</span>
            </a>
            <a
              href="tel:221774673109"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-5 py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm"
            >
              <i className="fas fa-phone-alt"></i>
              <span>+221 77 467 31 09</span>
            </a>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h4 className="font-bold text-gray-900 mb-2">Cours particuliers &amp; Encadrement</h4>
          <p className="text-sm text-gray-500">
            Aucun abonnement nécessaire : le tarif de l&apos;encadrement est fixé sur mesure directement par la Direction de SAMA ACADÉMIE lors de votre échange, selon les besoins de l&apos;élève et la rémunération convenue avec l&apos;enseignant.
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h4 className="font-bold text-gray-900 mb-2">Écoles et établissements</h4>
          <p className="text-sm text-gray-500">
            Accès groupé pour une classe ou un établissement, tableau de bord du chef d&apos;établissement et facturation annuelle. Nous contacter.
          </p>
        </div>
      </div>
    </main>
  );
}
