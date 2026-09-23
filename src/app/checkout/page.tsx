"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type PaymentMethod = "wave" | "orange" | "free" | "card";

const PLANS: Record<string, { name: string; price: string; period: string }> = {
  eleve: { name: "Premium Élève", price: "3 500 F", period: "par mois" },
  famille: { name: "Premium Famille", price: "6 000 F", period: "par mois" },
  concours: { name: "Pack Concours", price: "9 000 F", period: "paiement unique" },
};

export default function Checkout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planKey = searchParams.get("plan") || "eleve";
  const plan = PLANS[planKey] || PLANS.eleve;

  const [method, setMethod] = useState<PaymentMethod>("wave");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"form" | "confirming" | "success">("form");
  const [countdown, setCountdown] = useState(5);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login?redirect=/checkout&message=Connectez-vous pour souscrire un abonnement.");
      } else {
        setUser(user);
      }
    });
  }, [router]);

  // Gestion du décompte lors de la validation du téléphone
  useEffect(() => {
    let timer: any;
    if (step === "confirming" && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (step === "confirming" && countdown === 0) {
      // Validation finale du paiement et passage en Premium
      const completePayment = async () => {
        if (user) {
          await supabase
            .from("profiles")
            .update({ is_premium: true })
            .eq("id", user.id);
        }
        setStep("success");
      };
      completePayment();
    }
    return () => clearTimeout(timer);
  }, [step, countdown, user]);

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCountdown(5);
    setStep("confirming");
  };

  if (step === "success") {
    return (
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center space-y-5">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Paiement Réussi !</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Félicitations ! Votre compte est désormais <strong className="text-yellow-600">⭐ Premium</strong>.
          </p>
          <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-500 space-y-1 text-left">
            <p className="flex justify-between"><span>Offre :</span> <strong>{plan.name}</strong></p>
            <p className="flex justify-between"><span>Montant :</span> <strong>{plan.price}</strong></p>
            <p className="flex justify-between"><span>Moyen :</span> <strong>{method.toUpperCase()} Mobile Money</strong></p>
            <p className="flex justify-between"><span>Téléphone :</span> <strong>+221 {phone}</strong></p>
            <p className="text-gray-400 mt-2 text-center pt-2 border-t border-gray-200">
              Réf. Transaction : #SN-WAVE-{Math.floor(100000 + Math.random() * 900000)}
            </p>
          </div>
          <div className="pt-2 space-y-3">
            <Link
              href="/videos"
              className="block w-full bg-sama-primary text-white font-bold py-3.5 rounded-xl hover:bg-blue-800 transition shadow-md"
            >
              <i className="fas fa-play mr-2"></i>Accéder aux Vidéos Premium
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">

      {/* Modal de confirmation en cours (Simulation USSD / Notification Téléphone) */}
      {step === "confirming" && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-pulse-subtle">
            
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl">
                {method === "wave" && "🌊"}
                {method === "orange" && "🟠"}
                {method === "free" && "🔴"}
                {method === "card" && "💳"}
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-sama-primary border-t-transparent animate-spin"></div>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                Validation sur votre téléphone
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {method === "wave" && `Une notification Wave a été envoyée au +221 ${phone}. Veuillez ouvrir votre application Wave pour valider les ${plan.price}.`}
                {method === "orange" && `Veuillez composer le #144# ou ouvrir l'application Orange Money sur le +221 ${phone} pour autoriser le débit de ${plan.price}.`}
                {method === "free" && `Veuillez composer le #150# sur le +221 ${phone} pour confirmer la transaction de ${plan.price}.`}
                {method === "card" && `Validation 3D-Secure en cours auprès de votre banque...`}
              </p>
            </div>

            <div className="bg-blue-50 text-sama-primary font-bold text-sm py-3 px-4 rounded-2xl inline-block">
              ⏳ Attente de confirmation ({countdown}s)...
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Paiement Sécurisé</h1>
        <p className="text-gray-500">Choisissez votre moyen de paiement Mobile Money au Sénégal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Récapitulatif */}
        <div className="md:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-fit">
          <div>
            <span className="text-xs font-bold text-sama-primary uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">
              Récapitulatif
            </span>
            <h3 className="text-xl font-bold text-gray-900 mt-4 mb-1">{plan.name}</h3>
            <p className="text-xs text-gray-400 mb-6">{plan.period}</p>

            <div className="border-t border-b border-gray-100 py-4 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Abonnement</span>
                <span className="font-semibold">{plan.price}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frais de transaction</span>
                <span className="font-semibold text-green-600">0 F (Gratuit)</span>
              </div>
              <div className="flex justify-between font-extrabold text-gray-900 text-lg pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-sama-primary">{plan.price}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 rounded-2xl p-4 text-xs text-sama-primary flex items-start gap-2">
            <i className="fas fa-shield-alt text-base mt-0.5"></i>
            <p>Paiement sécurisé crypté SSL. Compatible Wave, Orange Money et Free Money.</p>
          </div>
        </div>

        {/* Choix méthode et Formulaire */}
        <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Choix du moyen de paiement</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setMethod("wave")}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition ${
                method === "wave" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500" : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center font-black text-xs shadow-sm">
                🌊
              </div>
              <span className="text-xs font-bold text-gray-800">Wave</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod("orange")}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition ${
                method === "orange" ? "border-orange-500 bg-orange-50 ring-2 ring-orange-500" : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-xs shadow-sm">
                🟠
              </div>
              <span className="text-xs font-bold text-gray-800">Orange Money</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod("free")}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition ${
                method === "free" ? "border-red-500 bg-red-50 ring-2 ring-red-500" : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-black text-xs shadow-sm">
                🔴
              </div>
              <span className="text-xs font-bold text-gray-800">Free Money</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod("card")}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition ${
                method === "card" ? "border-purple-500 bg-purple-50 ring-2 ring-purple-500" : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-black text-xs shadow-sm">
                💳
              </div>
              <span className="text-xs font-bold text-gray-800">Carte CB</span>
            </button>
          </div>

          <form onSubmit={handleStartPayment} className="space-y-5">
            {method !== "card" ? (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Numéro de téléphone {method.toUpperCase()}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                    🇸🇳 +221
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="77 000 00 00"
                    className="w-full border border-gray-300 rounded-xl p-3 pl-20 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Ex: 77 123 45 67 — Un message de confirmation sera envoyé à ce numéro.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Numéro de carte</label>
                  <input
                    type="text"
                    required
                    placeholder="4000 0000 0000 0000"
                    className="w-full border border-gray-300 rounded-xl p-3 bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-sama-primary hover:bg-blue-800 text-white font-bold py-4 rounded-xl transition shadow-md flex justify-center items-center gap-2 text-base mt-6"
            >
              <i className="fas fa-mobile-alt text-sm"></i> Payer {plan.price} avec {method.toUpperCase()}
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}
