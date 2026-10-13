import Link from "next/link";

export default function Tarifs() {
  return (
    <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* En-tête */}
      <div className="text-center mb-12 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-sama-primary text-xs font-bold mb-3">
          <i className="fas fa-gem text-sama-orange"></i> Tarif Simple &amp; Transparent
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
          Une formule unique pour toutes les fonctionnalités
        </h1>
        <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
          Les sujets d&apos;examens restent 100% gratuits. L&apos;abonnement unique à <strong>3 500 FCFA/mois</strong> débloque l&apos;intégralité des corrigés, vidéos, concours et classes de la plateforme.
        </p>
      </div>

      {/* Grille des 2 formules : Gratuit vs Premium Tout Inclus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch mb-14">
        
        {/* Formule 1 : Gratuit */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                Découverte
              </span>
              <span className="text-xs text-gray-400 font-semibold">Sans engagement</span>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mb-1">Compte Gratuit</h3>
            <p className="text-xs text-gray-500 mb-6">Pour s&apos;entraîner en autonomie sur les sujets officiels.</p>

            <div className="mb-6 flex items-baseline gap-1.5 pb-6 border-b border-gray-100">
              <span className="text-4xl sm:text-5xl font-black text-gray-950">0 F</span>
              <span className="text-gray-400 text-xs sm:text-sm font-semibold">pour toujours</span>
            </div>

            <ul className="space-y-3.5 mb-8 text-xs sm:text-sm text-gray-700 font-medium">
              <li className="flex items-start gap-2.5">
                <i className="fas fa-check-circle text-sama-primary mt-0.5 text-sm"></i>
                <span>Tous les sujets d&apos;examens officiels (BAC, BFEM, CFEE)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <i className="fas fa-check-circle text-sama-primary mt-0.5 text-sm"></i>
                <span>Recherche et annuaire des enseignants certifiés</span>
              </li>
              <li className="flex items-start gap-2.5">
                <i className="fas fa-check-circle text-sama-primary mt-0.5 text-sm"></i>
                <span>Guide national d&apos;orientation scolaire et universitaire</span>
              </li>
              <li className="flex items-start gap-2.5">
                <i className="fas fa-check-circle text-sama-primary mt-0.5 text-sm"></i>
                <span>3 fiches de synthèse de révision</span>
              </li>
              <li className="flex items-start gap-2.5">
                <i className="fas fa-check-circle text-sama-primary mt-0.5 text-sm"></i>
                <span>Messagerie après réservation de cours</span>
              </li>
            </ul>
          </div>

          <Link
            href="/register"
            className="w-full btn-outline py-3.5 rounded-xl border-gray-300 block text-center font-bold text-sm hover:border-sama-primary hover:text-sama-primary transition"
          >
            Créer un compte gratuit
          </Link>
        </div>

        {/* Formule 2 : SAMA Premium — TOUT INCLUS (3 500 F) */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-sama-primary shadow-xl flex flex-col justify-between relative transform md:-translate-y-2 ring-4 ring-blue-500/10">
          {/* Badge Offre Complète */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sama-orange to-amber-500 text-white text-[11px] font-black uppercase px-4 py-1 rounded-full shadow-md tracking-wider flex items-center gap-1.5 whitespace-nowrap">
            <i className="fas fa-crown text-xs"></i> Offre Complète • Tout Inclus
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-sama-primary text-white">
                SAMA Premium
              </span>
              <span className="text-xs text-sama-orange font-bold">⭐ Recommandé</span>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mb-1">Abonnement Complet</h3>
            <p className="text-xs text-gray-500 mb-6">Accès illimité à 100% des contenus et outils de réussite.</p>

            <div className="mb-6 flex items-baseline gap-1.5 pb-6 border-b border-gray-100">
              <span className="text-4xl sm:text-5xl font-black text-gray-950 text-sama-primary">3 500 F</span>
              <span className="text-gray-500 text-xs sm:text-sm font-semibold">CFA / mois</span>
            </div>

            <ul className="space-y-3.5 mb-8 text-xs sm:text-sm text-gray-800 font-medium">
              <li className="flex items-start gap-2.5 font-bold text-gray-950">
                <i className="fas fa-check-circle text-green-500 mt-0.5 text-sm"></i>
                <span>Tous les corrigés détaillés rédigés pas à pas (BAC, BFEM, CFEE)</span>
              </li>
              <li className="flex items-start gap-2.5 font-bold text-gray-950">
                <i className="fas fa-check-circle text-green-500 mt-0.5 text-sm"></i>
                <span>Toutes les leçons vidéos explicatives par chapitre</span>
              </li>
              <li className="flex items-start gap-2.5 font-bold text-gray-950">
                <i className="fas fa-check-circle text-green-500 mt-0.5 text-sm"></i>
                <span>Préparation aux Concours d&apos;État &amp; Grandes Écoles (EPT, ESP, CPGE...)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <i className="fas fa-check-circle text-green-500 mt-0.5 text-sm"></i>
                <span>Classes virtuelles et visioconférences interactives en direct</span>
              </li>
              <li className="flex items-start gap-2.5">
                <i className="fas fa-check-circle text-green-500 mt-0.5 text-sm"></i>
                <span>Bibliothèque officielle complète et fiches de cours téléchargeables</span>
              </li>
              <li className="flex items-start gap-2.5">
                <i className="fas fa-check-circle text-green-500 mt-0.5 text-sm"></i>
                <span>Conseils méthodologiques des inspecteurs et jurys d&apos;examen</span>
              </li>
              <li className="flex items-start gap-2.5">
                <i className="fas fa-check-circle text-green-500 mt-0.5 text-sm"></i>
                <span>Tableau de bord de progression et suivi personnalisé</span>
              </li>
            </ul>
          </div>

          <Link
            href="/checkout?plan=premium"
            className="w-full bg-sama-primary hover:bg-blue-800 text-white font-extrabold py-4 rounded-xl shadow-md transition block text-center text-sm tracking-wide"
          >
            Souscrire à l&apos;offre complète (3 500 F/mois)
          </Link>
        </div>

      </div>

      {/* Guide de Règlement Direct Wave / Orange Money */}
      <div className="bg-gradient-to-r from-blue-900 via-sama-primary to-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-10 shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-sama-orange text-white text-xs font-black uppercase px-3 py-1 rounded-full">
              <i className="fas fa-shield-alt"></i> Règlement Direct Wave / Orange Money
            </div>
            <h3 className="text-xl sm:text-2xl font-black">Comment s&apos;effectue le paiement de votre abonnement ?</h3>
            <p className="text-blue-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Pour une sécurité totale et un service de proximité sans intermédiaire, votre abonnement unique (<strong>3 500 FCFA</strong>) est réglé directement par transfert <strong>Wave</strong> ou <strong>Orange Money</strong> sur la ligne officielle de SAMA ACADÉMIE (<strong>+221 77 467 31 09</strong>). Notre équipe active votre statut Premium dès confirmation de votre virement !
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0 w-full sm:w-auto">
            <a
              href="https://wa.me/221774673109?text=Bonjour%20SAMA%20ACADÉMIE,%20je%20souhaite%20activer%20l'abonnement%20complet%20à%203%20500%20FCFA."
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

      {/* Info Banner Complémentaire */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h4 className="font-bold text-gray-900 mb-2">Cours particuliers à domicile &amp; Encadrement</h4>
          <p className="text-sm text-gray-500">
            Aucun abonnement nécessaire : le tarif de l&apos;encadrement est fixé sur mesure directement par la Direction de SAMA ACADÉMIE lors de votre échange, selon les besoins de l&apos;élève et la rémunération convenue avec l&apos;enseignant certifié.
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h4 className="font-bold text-gray-900 mb-2">Écoles et établissements partenaires</h4>
          <p className="text-sm text-gray-500">
            Accès groupé pour une classe ou un établissement scolaire, tableau de bord pour la direction d&apos;établissement et facturation annuelle. Contactez notre permanence.
          </p>
        </div>
      </div>
    </main>
  );
}
