import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <img src="/assets/logo.png" alt="SAMA ACADÉMIE" className="h-16 object-contain" />
          <p className="text-sm text-gray-500 font-medium mt-4">
            Réviser aujourd'hui, réussir demain, construire son avenir.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Plateforme</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>
              <Link href="/enseignants" className="hover:text-sama-primary">
                Trouver un enseignant
              </Link>
            </li>
            <li>
              <Link href="/examens" className="hover:text-sama-primary">
                Annales gratuites
              </Link>
            </li>
            <li>
              <Link href="/matieres" className="hover:text-sama-primary">
                Matières
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 mb-4">SAMA ACADÉMIE</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>
              <Link href="/apropos" className="hover:text-sama-primary">
                À propos de nous
              </Link>
            </li>
            <li>
              <Link href="/tarifs" className="hover:text-sama-primary">
                Tarifs
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-sama-primary">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/admin" className="text-sama-primary font-bold hover:underline flex items-center gap-1">
                <i className="fas fa-cog text-xs"></i> Espace Admin
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Légal</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>
              <Link href="#" className="hover:text-sama-primary">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-sama-primary">
                Confidentialité
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-sama-primary">
                CGU
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
        &copy; 2026 SAMA ACADÉMIE. Tous droits réservés.
      </div>
    </footer>
  );
}
