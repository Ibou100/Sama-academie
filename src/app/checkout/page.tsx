"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { DEFAULT_SUPPORT_CONFIG } from "@/lib/siteConfig";

type PaymentMethod = "wave" | "orange";

interface PlanDetails {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  badgeColor: string;
}

const ALL_IN_ONE_PLAN: PlanDetails = {
  name: "SAMA Premium (Tout Inclus)",
  price: "3 500 FCFA",
  period: "par mois",
  desc: "L'offre complète débloquant l'intégralité des fonctionnalités et contenus de la plateforme sans restriction.",
  features: [
    "Tous les corrigés détaillés officiels (BAC, BFEM, CFEE)",
    "Accès intégral à toutes les leçons vidéos explicatives",
    "Annales et préparation aux Concours d'État & Grandes Écoles (EPT, ESP, CPGE, CREM...)",
    "Classes virtuelles et visioconférences interactives",
    "Bibliothèque complète et fiches de synthèse téléchargeables",
    "Conseils méthodologiques des inspecteurs et jurys d'examen",
    "Tableau de bord de progression et suivi personnalisé"
  ],
  badgeColor: "bg-sama-primary text-white"
};

const PLANS: Record<string, PlanDetails> = {
  premium: ALL_IN_ONE_PLAN,
  eleve: ALL_IN_ONE_PLAN,
  famille: ALL_IN_ONE_PLAN,
  concours: ALL_IN_ONE_PLAN
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Chargement de votre commande...</div>}>
      <Checkout />
    </Suspense>
  );
}

function Checkout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planKey = searchParams.get("plan") || "premium";
  const plan = PLANS[planKey] || ALL_IN_ONE_PLAN;

  const [method, setMethod] = useState<PaymentMethod>("wave");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientPhone, setClientPhone] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  const officialNumber = DEFAULT_SUPPORT_CONFIG.phone; // +221 77 467 31 09
  const officialNumberRaw = DEFAULT_SUPPORT_CONFIG.whatsappRaw; // 221774673109

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?redirect=/checkout?plan=${planKey}&message=Connectez-vous pour souscrire.`);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
        setClientPhone(profile.phone || "");
      }
      setLoading(false);
    };

    fetchUser();
  }, [router, planKey]);

  // Message WhatsApp pré-rempli pour souscription directe
  const userName = userProfile ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() : "Client SAMA ACADÉMIE";
  const userEmail = userProfile?.email || "Non renseigné";
  const userLevel = userProfile?.level || "Cycle général";
  const methodName = method === "wave" ? "Wave" : "Orange Money";

  const whatsappMessage = encodeURIComponent(
    `Bonjour SAMA ACADÉMIE 🎓,\n\n` +
    `Je souhaite activer l'abonnement : *${plan.name} (${plan.price})*.\n\n` +
    `👤 Mon Compte : ${userName}\n` +
    `📧 Email : ${userEmail}\n` +
    `🎓 Niveau : ${userLevel}\n` +
    `📱 Mon Téléphone : ${clientPhone || "Non renseigné"}\n` +
    `💳 Mode de paiement choisi : ${methodName}\n\n` +
    `Merci de me confirmer la réception de mon règlement au ${officialNumber} pour activer mon statut Premium ⭐.`
  );

  const whatsappUrl = `https://wa.me/${officialNumberRaw}?text=${whatsappMessage}`;

  const handleNotifyRequest = () => {
    setRequestSent(true);
    // Redirige directement vers WhatsApp
    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <i className="fas fa-spinner fa-spin text-3xl text-sama-primary"></i>
          <p className="text-sm font-bold text-gray-500">Préparation de votre dossier de souscription...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">

      {/* En-tête */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-sama-primary text-xs font-bold mb-3">
          <i className="fas fa-shield-alt text-sama-orange"></i> Souscription Sécurisée &amp; Accompagnée
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Activation de votre Abonnement
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Règlement par transfert direct <strong>Wave</strong> ou <strong>Orange Money</strong> sur la ligne officielle de SAMA ACADÉMIE.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Colonne 1 : Récapitulatif du Forfait */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-6">
          <div>
            <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${plan.badgeColor}`}>
              {plan.name}
            </span>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-gray-950">{plan.price}</span>
              <span className="text-gray-400 text-xs font-semibold">{plan.period}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              {plan.desc}
            </p>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2.5">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Avantages inclus :</h4>
            <ul className="space-y-2 text-xs text-gray-700">
              {plan.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-500 mt-0.5 text-xs"></i>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Profil connecté */}
          {userProfile && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1">
              <p className="text-[10px] uppercase font-bold text-gray-400">Compte bénéficiaire :</p>
              <p className="font-extrabold text-gray-900">{userName}</p>
              <p className="text-gray-500">{userEmail}</p>
              <p className="text-sama-primary font-bold">{userLevel}</p>
            </div>
          )}

          <div className="pt-2 text-center">
            <Link href="/tarifs" className="text-xs text-gray-400 hover:text-sama-primary font-bold transition">
              ← Revoir les détails des offres
            </Link>
          </div>
        </div>

        {/* Colonne 2 : Modalités de Paiement & Contact Direct */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-6">

          {/* Bannière explicative rassurante */}
          <div className="bg-amber-50/80 border-l-4 border-amber-500 p-4 rounded-r-2xl space-y-1 text-xs text-amber-950">
            <p className="font-black flex items-center gap-1.5 text-amber-900 text-sm">
              <i className="fas fa-info-circle text-amber-600"></i> Mode de Règlement Officiel &amp; Transparent
            </p>
            <p className="leading-relaxed text-gray-700">
              Pour garantir la sécurité de vos fonds et un accompagnement personnalisé sans intermédiaire, les règlements s&apos;effectuent par <strong>transfert direct Mobile Money</strong> auprès de la Direction de SAMA ACADÉMIE. Votre statut <strong>⭐ Premium</strong> est activé immédiatement dès réception.
            </p>
          </div>

          {/* Choix du moyen : Wave ou Orange Money */}
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-3">
              1. Choisissez votre moyen de paiement Mobile Money :
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMethod("wave")}
                className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition text-left ${
                  method === "wave"
                    ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-xs flex-shrink-0">
                  🌊
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Wave</h4>
                  <p className="text-xs text-gray-500">Transfert direct sans frais</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod("orange")}
                className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition text-left ${
                  method === "orange"
                    ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20 shadow-xs"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-xs flex-shrink-0">
                  🟠
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Orange Money</h4>
                  <p className="text-xs text-gray-500">Transfert national SN</p>
                </div>
              </button>
            </div>
          </div>

          {/* Les 3 Étapes claires */}
          <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 bg-slate-50/60 space-y-4">
            <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sama-primary text-white flex items-center justify-center text-xs font-bold">2</span>
              Marche à suivre pour activer votre compte :
            </h3>

            <div className="space-y-3.5 text-xs sm:text-sm text-gray-700">
              <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-gray-200">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-sama-primary flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
                  1
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-gray-900">Effectuez le transfert {methodName} :</p>
                  <p className="text-xs text-gray-600">
                    Envoyez exactement <strong>{plan.price}</strong> au numéro officiel SAMA ACADÉMIE :
                  </p>
                  <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-sama-primary font-black px-3 py-1.5 rounded-lg text-sm tracking-wider">
                    <i className="fas fa-phone-alt text-xs"></i> {officialNumber}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-gray-200">
                <span className="w-7 h-7 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
                  2
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-gray-900">Confirmez votre règlement sur WhatsApp :</p>
                  <p className="text-xs text-gray-600">
                    Cliquez sur le bouton ci-dessous pour transmettre automatiquement votre preuve de paiement et le nom de votre compte.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-gray-200">
                <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
                  3
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-gray-900">Activation Immédiate en ⭐ Premium :</p>
                  <p className="text-xs text-gray-600">
                    L&apos;équipe SAMA ACADÉMIE active manuellement votre accès complet en moins de 15 minutes. Vous pourrez immédiatement consulter tous les corrigés et vidéos !
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Numéro de téléphone de contact */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Votre numéro de téléphone (pour vérification de l&apos;activation) :
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">
                🇸🇳 +221
              </span>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="77 000 00 00"
                className="w-full border border-gray-300 rounded-xl p-3 pl-16 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
              />
            </div>
          </div>

          {/* Boutons d'action : WhatsApp & Téléphone */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleNotifyRequest}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 px-6 rounded-2xl transition shadow-md flex items-center justify-center gap-2.5 text-sm sm:text-base group"
            >
              <i className="fab fa-whatsapp text-2xl group-hover:scale-110 transition"></i>
              <span>Finaliser ma souscription sur WhatsApp ({officialNumber})</span>
            </button>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`tel:${officialNumberRaw}`}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-xl transition text-xs text-center flex items-center justify-center gap-2"
              >
                <i className="fas fa-phone-alt text-sama-primary"></i>
                <span>Appeler la Permanence ({officialNumber})</span>
              </a>

              <Link
                href="/examens"
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 font-bold py-3 px-4 rounded-xl transition text-xs text-center"
              >
                Revenir aux examens
              </Link>
            </div>
          </div>

          {requestSent && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 text-center space-y-1 animate-in fade-in">
              <p className="font-black flex items-center justify-center gap-1.5">
                <i className="fas fa-check-circle text-emerald-600"></i> Demande transmise avec succès !
              </p>
              <p>
                Si WhatsApp ne s&apos;est pas ouvert automatiquement, vous pouvez nous écrire directement au <strong>{officialNumber}</strong>.
              </p>
            </div>
          )}

        </div>

      </div>
    </main>
  );
}
