"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type UserProfile = {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  is_premium: boolean;
  role: string;
  level?: string | null;
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function getAvatarBg(firstName: string) {
  const colors = ["bg-pink-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-teal-500"];
  return colors[(firstName?.charCodeAt(0) ?? 0) % colors.length];
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Navigation dynamique selon le profil
  const getNavLinks = () => {
    if (userProfile?.role === "enseignant") {
      return [
        { href: "/", label: "Accueil" },
        { href: "/dashboard/enseignant", label: "Espace Professeur" },
        { href: "/classes", label: "Classes 🎥" },
        { href: "/examens", label: "Exercices & Examens" },
        { href: "/videos", label: "Vidéos ⭐" },
        { href: "/orientation", label: "Orientation 🧭" },
        { href: "/apropos", label: "À propos" },
      ];
    }
    if (userProfile?.role === "eleve") {
      const lvl = (userProfile.level || "").toLowerCase();
      const isPrimaire = lvl.includes("primaire") || lvl.includes("ci") || lvl.includes("cp") || lvl.includes("ce") || lvl.includes("cm") || lvl.includes("cfee");
      return [
        { href: "/", label: "Accueil" },
        { href: "/dashboard/eleve", label: "Mon Espace" },
        { href: "/enseignants", label: isPrimaire ? "Enseignants Primaire" : "Enseignants" },
        { href: "/examens", label: isPrimaire ? "Épreuves Primaire" : "Exercices & Examens" },
        { href: "/videos", label: isPrimaire ? "Vidéos Primaire ⭐" : "Vidéos ⭐" },
        ...(!isPrimaire ? [{ href: "/orientation", label: "Orientation 🧭" }] : []),
      ];
    }
    if (userProfile?.role === "parent") {
      return [
        { href: "/", label: "Accueil" },
        { href: "/dashboard/parent", label: "Espace Parent & Suivi" },
        { href: "/enseignants", label: "Enseignants" },
        { href: "/examens", label: "Exercices & Examens" },
        { href: "/tarifs", label: "Tarifs" },
        { href: "/apropos", label: "À propos" },
      ];
    }
    return [
      { href: "/", label: "Accueil" },
      { href: "/enseignants", label: "Enseignants" },
      { href: "/matieres", label: "Matières & Niveaux" },
      { href: "/examens", label: "Exercices & Examens" },
      { href: "/videos", label: "Vidéos ⭐" },
      { href: "/classes", label: "Classes 🎥" },
      { href: "/orientation", label: "Orientation 🧭" },
      { href: "/apropos", label: "À propos" },
    ];
  };

  const links = getNavLinks();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url, is_premium, role, level")
        .eq("id", user.id)
        .single();

      if (data) setUserProfile(data);
    };

    fetchUser();

    // Écouter les changements de session (connexion/déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setIsDropdownOpen(false);
    router.push("/");
  };

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <img src="/assets/logo.png" alt="SAMA ACADÉMIE" className="h-14 object-contain" />
            </Link>
            <nav className="hidden md:flex space-x-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${pathname === link.href ? "active" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Boutons droite — Dynamiques selon l'état de connexion */}
          <div className="hidden md:flex items-center space-x-3">
            {userProfile ? (
              // CONNECTÉ — Bouton Messagerie bien visible + Avatar
              <div className="flex items-center gap-3">
                <Link
                  href="/demandes"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-extrabold transition shadow-sm ${
                    pathname === "/demandes" || pathname === "/messagerie"
                      ? "bg-sama-primary text-white"
                      : "bg-blue-50 text-sama-primary hover:bg-blue-100 border border-blue-100"
                  }`}
                  title="Accéder à la messagerie interne"
                >
                  <i className="fas fa-comment-dots text-base"></i>
                  <span>Messagerie</span>
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-3 py-2 transition"
                  >
                    {userProfile.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt="Avatar"
                        className="w-9 h-9 rounded-full object-cover border-2 border-sama-primary"
                      />
                    ) : (
                      <div className={`w-9 h-9 rounded-full ${getAvatarBg(userProfile.first_name)} flex items-center justify-center text-white font-bold text-sm`}>
                        {getInitials(userProfile.first_name, userProfile.last_name)}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900 leading-tight">{userProfile.first_name}</p>
                    </div>
                    <i className={`fas fa-chevron-down text-xs text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}></i>
                  </button>

                  {/* Menu déroulant du profil */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-14 w-60 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                      {/* Tableau de bord selon le rôle */}
                      {userProfile.role === "enseignant" && (
                        <Link
                          href="/dashboard/enseignant"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-sama-primary hover:bg-blue-50 font-black border-b border-gray-100"
                        >
                          <i className="fas fa-chalkboard-teacher w-4"></i> Espace Enseignant
                        </Link>
                      )}
                      {userProfile.role === "eleve" && (
                        <Link
                          href="/dashboard/eleve"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-sama-primary hover:bg-blue-50 font-black border-b border-gray-100"
                        >
                          <i className="fas fa-graduation-cap w-4"></i> Mon Espace Élève
                        </Link>
                      )}
                      {userProfile.role === "parent" && (
                        <Link
                          href="/dashboard/parent"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-purple-700 hover:bg-purple-50 font-black border-b border-gray-100"
                        >
                          <i className="fas fa-child w-4"></i> Espace Parent &amp; Suivi
                        </Link>
                      )}
                      {userProfile.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-sama-primary hover:bg-blue-50 font-black border-b border-gray-100"
                        >
                          <i className="fas fa-cog w-4"></i> Espace Administration
                        </Link>
                      )}

                      <Link
                        href="/demandes"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 font-bold"
                      >
                        <i className="fas fa-comment-dots text-sama-primary w-4"></i> Messagerie & Suivi
                      </Link>
                      <Link
                        href="/profil"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                      >
                        <i className="fas fa-user-circle text-sama-primary w-4"></i> Mon profil
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 font-medium"
                      >
                        <i className="fas fa-sign-out-alt w-4"></i> Se déconnecter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // NON CONNECTÉ — Affiche les boutons classiques
              <>
                <Link href="/login" className="text-gray-600 hover:text-gray-900 font-semibold text-sm">
                  Connexion
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* Menu Hamburger Mobile */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-sama-primary focus:outline-none p-2"
            >
              <i className="fas fa-bars text-2xl"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile Déroulant */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full z-50">
          <div className="px-4 pt-2 pb-6 space-y-2 flex flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-sama-primary hover:bg-gray-50 ${
                  pathname === link.href ? "active" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 mt-4 pt-4 flex flex-col gap-3">
              {userProfile ? (
                <>
                  {userProfile.role === "enseignant" && (
                    <Link
                      href="/dashboard/enseignant"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 text-center text-base font-black bg-blue-800 text-white rounded-xl shadow-sm"
                    >
                      <i className="fas fa-chalkboard-teacher"></i> Espace Enseignant
                    </Link>
                  )}
                  {userProfile.role === "eleve" && (
                    <Link
                      href="/dashboard/eleve"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 text-center text-base font-black bg-blue-800 text-white rounded-xl shadow-sm"
                    >
                      <i className="fas fa-graduation-cap"></i> Mon Espace Élève
                    </Link>
                  )}
                  {userProfile.role === "parent" && (
                    <Link
                      href="/dashboard/parent"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 text-center text-base font-black bg-purple-900 text-white rounded-xl shadow-sm"
                    >
                      <i className="fas fa-child"></i> Espace Parent &amp; Suivi
                    </Link>
                  )}

                  <Link
                    href="/demandes"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 text-center text-base font-bold bg-sama-primary text-white rounded-xl shadow-sm"
                  >
                    <i className="fas fa-comment-dots"></i> Messagerie & Suivi
                  </Link>
                  <Link
                    href="/profil"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 text-center text-base font-medium text-sama-primary border border-sama-primary rounded-xl"
                  >
                    Mon profil ({userProfile.first_name})
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="block w-full px-3 py-2 text-center text-base font-medium text-red-500 border border-red-200 rounded-lg"
                  >
                    Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-center text-base font-medium text-gray-600 border border-gray-300 rounded-lg">
                    Connexion
                  </Link>
                  <Link href="/register" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-center text-base font-medium text-white bg-sama-primary rounded-lg">
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
