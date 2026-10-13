"use client";

import { detectCycle } from "@/lib/cycle";
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
      const isPrimaire = detectCycle(lvl) === "Primaire";
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
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) {
          setUserProfile(null);
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("first_name, last_name, avatar_url, is_premium, role, level")
          .eq("id", user.id)
          .maybeSingle();

        if (data) {
          setUserProfile(data);
        } else if (user.user_metadata) {
          setUserProfile({
            first_name: user.user_metadata.first_name || "Utilisateur",
            last_name: user.user_metadata.last_name || "",
            role: user.user_metadata.role || "eleve",
            level: user.user_metadata.level || "",
            avatar_url: user.user_metadata.avatar_url || null,
            is_premium: false,
          });
        }
      } catch (e) {
        console.warn("Header fetchUser error:", e);
      }
    };

    fetchUser();

    // Écouter les changements de session (connexion/déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUserProfile(null);
      } else {
        fetchUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    setUserProfile(null);
    setIsDropdownOpen(false);
    if (typeof window !== "undefined") {
      window.location.href = "/";
    } else {
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#00173D] via-[#002868] to-[#0A192F] backdrop-blur-xl bg-opacity-95 border-b border-amber-500/20 shadow-2xl shadow-black/40">
      {/* Barre d'accent luxueuse or/ambre au sommet */}
      <div className="h-[2.5px] w-full bg-gradient-to-r from-transparent via-amber-400 via-amber-300 to-transparent shadow-[0_0_12px_rgba(245,166,35,0.8)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* LOGO & BRANDING PRESTIGE */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="p-1 px-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 hover:border-amber-400/40 transition-all shadow-md group-hover:scale-[1.02]">
                <img src="/assets/logo.png" alt="SAMA ACADÉMIE" className="h-12 sm:h-13 object-contain brightness-105" />
              </div>
              <div className="hidden xl:flex flex-col">
                <span className="text-base font-black tracking-tight text-white leading-tight">
                  SAMA <span className="text-amber-400">ACADÉMIE</span>
                </span>
                <span className="text-[10px] text-amber-300/80 font-semibold tracking-wider uppercase">
                  Excellence &amp; Réussite
                </span>
              </div>
            </Link>

            {/* NAVIGATION DES FONCTIONNALITÉS — DESIGN ROYAL BLEU & OR */}
            <nav className="hidden lg:flex items-center space-x-1.5">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-xl text-xs xl:text-[13px] font-bold transition-all duration-200 flex items-center gap-1.5 ${
                      isActive
                        ? "bg-gradient-to-r from-amber-500/25 to-amber-600/20 text-amber-300 border border-amber-400/40 shadow-sm shadow-amber-500/20 font-black"
                        : "text-slate-200 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* ACTIONS DROITE (CONNEXION / PROFIL / BOUTON INSCRIPTION EXTRAORDINAIRE) */}
          <div className="hidden md:flex items-center space-x-3">
            {/* BADGE SI SUR LA PAGE ADMIN */}
            {pathname.startsWith("/admin") && (
              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider">
                <i className="fas fa-shield-halved text-amber-400"></i>
                <span>Portail Direction</span>
              </div>
            )}

            {userProfile ? (
              // CONNECTÉ — Messagerie & Profil haut de gamme
              <div className="flex items-center gap-3">
                <Link
                  href="/demandes"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-md ${
                    pathname === "/demandes" || pathname === "/messagerie"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-white/10 hover:bg-white/15 text-white border border-white/20"
                  }`}
                  title="Accéder à la messagerie interne"
                >
                  <i className="fas fa-comment-dots text-amber-400 text-sm"></i>
                  <span>Messagerie</span>
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl px-3 py-1.5 transition cursor-pointer"
                  >
                    {userProfile.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-400/70"
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full ${getAvatarBg(userProfile.first_name)} flex items-center justify-center text-white font-bold text-xs ring-2 ring-amber-400/70`}>
                        {getInitials(userProfile.first_name, userProfile.last_name)}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-xs font-bold text-white leading-tight">{userProfile.first_name}</p>
                      <p className="text-[10px] text-amber-300 capitalize leading-none">{userProfile.role || "Membre"}</p>
                    </div>
                    <i className={`fas fa-chevron-down text-[10px] text-slate-300 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}></i>
                  </button>

                  {/* Menu déroulant du profil sombre & luxueux */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-14 w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 text-white backdrop-blur-xl">
                      {pathname.startsWith("/admin") && (
                        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 font-bold flex items-center gap-2">
                          <i className="fas fa-shield-alt text-amber-400"></i> Console Direction active
                        </div>
                      )}
                      {userProfile.role === "enseignant" && (
                        <Link
                          href="/dashboard/enseignant"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-xs text-white hover:bg-slate-800 font-bold border-b border-slate-800"
                        >
                          <i className="fas fa-chalkboard-teacher text-amber-400 w-4"></i> Espace Enseignant
                        </Link>
                      )}
                      {userProfile.role === "eleve" && (
                        <Link
                          href="/dashboard/eleve"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-xs text-white hover:bg-slate-800 font-bold border-b border-slate-800"
                        >
                          <i className="fas fa-graduation-cap text-amber-400 w-4"></i> Mon Espace Élève
                        </Link>
                      )}
                      {userProfile.role === "parent" && (
                        <Link
                          href="/dashboard/parent"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-xs text-white hover:bg-slate-800 font-bold border-b border-slate-800"
                        >
                          <i className="fas fa-child text-amber-400 w-4"></i> Espace Parent &amp; Suivi
                        </Link>
                      )}
                      {userProfile.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-xs text-amber-300 hover:bg-slate-800 font-bold border-b border-slate-800"
                        >
                          <i className="fas fa-shield-alt text-amber-400 w-4"></i> Console Administration
                        </Link>
                      )}

                      <Link
                        href="/demandes"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-xs text-slate-200 hover:bg-slate-800 font-semibold"
                      >
                        <i className="fas fa-comment-dots text-amber-400 w-4"></i> Messagerie &amp; Suivi
                      </Link>
                      <Link
                        href="/profil"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-xs text-slate-200 hover:bg-slate-800 font-semibold"
                      >
                        <i className="fas fa-user-circle text-amber-400 w-4"></i> Mon profil
                      </Link>
                      <div className="border-t border-slate-800 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs text-red-400 hover:bg-red-500/10 font-bold cursor-pointer"
                      >
                        <i className="fas fa-sign-out-alt w-4"></i> Se déconnecter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // NON CONNECTÉ — Boutons prestige SAMA ACADÉMIE
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="text-xs font-bold text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 transition-all transform hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Inscription</span>
                  <i className="fas fa-arrow-right text-[10px]"></i>
                </Link>
              </div>
            )}
          </div>

          {/* BOUTON MOBILE HAMBURGER */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-amber-400 focus:outline-none p-2 rounded-xl bg-white/10 border border-white/15"
              aria-label="Menu"
            >
              <i className={`fas ${isMenuOpen ? "fa-xmark" : "fa-bars"} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* MENU MOBILE DÉROULANT — SOMPTUEUX ROYAL NAVY & OR */}
      {isMenuOpen && (
        <div className="lg:hidden bg-[#00173D]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl absolute w-full z-50 text-white">
          <div className="px-4 pt-3 pb-6 space-y-1.5 flex flex-col">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between transition-all ${
                    isActive
                      ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                      : "text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && <i className="fas fa-check text-xs text-amber-400"></i>}
                </Link>
              );
            })}

            <div className="border-t border-white/10 mt-3 pt-4 flex flex-col gap-2.5">
              {userProfile ? (
                <>
                  <Link
                    href="/demandes"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-3 py-3 text-center text-sm font-black bg-amber-500 text-slate-950 rounded-xl shadow-md"
                  >
                    <i className="fas fa-comment-dots"></i> Messagerie &amp; Suivi
                  </Link>
                  <Link
                    href="/profil"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2.5 text-center text-sm font-bold text-white bg-white/10 border border-white/15 rounded-xl"
                  >
                    Mon profil ({userProfile.first_name})
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="block w-full px-3 py-2.5 text-center text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl cursor-pointer"
                  >
                    Se déconnecter
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2.5 text-center text-xs font-bold text-slate-200 bg-white/10 border border-white/15 rounded-xl"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2.5 text-center text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl shadow-md"
                  >
                    Inscription
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
