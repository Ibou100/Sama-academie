"use client";

import { useState } from "react";
import Link from "next/link";
import { DEFAULT_SUPPORT_CONFIG } from "@/lib/siteConfig";

export default function Contact() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("Information générale");
  const [message, setMessage] = useState("");
  const [sentSuccess, setSentSuccess] = useState(false);

  const officialPhone = DEFAULT_SUPPORT_CONFIG.phone; // +221 77 467 31 09
  const officialPhoneRaw = DEFAULT_SUPPORT_CONFIG.whatsappRaw; // 221774673109

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedMessage = encodeURIComponent(
      `Bonjour SAMA ACADÉMIE 🎓,\n\n` +
      `📌 *Nouveau message de contact*\n` +
      `👤 Nom : ${firstName.trim()} ${lastName.trim()}\n` +
      `📧 Email : ${email.trim() || "Non renseigné"}\n` +
      `📱 Téléphone : ${phone.trim() || "Non renseigné"}\n` +
      `🏷️ Objet : ${subject}\n\n` +
      `💬 *Message :*\n${message.trim()}`
    );

    const waUrl = `https://wa.me/${officialPhoneRaw}?text=${formattedMessage}`;

    setSentSuccess(true);
    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank");
    }
  };

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-sama-primary text-xs font-bold mb-3">
            <i className="fas fa-headset text-sama-orange"></i> Permanence &amp; Assistance Client
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Contactez SAMA ACADÉMIE
          </h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto">
            Notre équipe pédagogique et administrative vous répond 7j/7 pour vos demandes d&apos;orientation, d&apos;inscription ou d&apos;encadrement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Colonne Coordonnées */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-gray-900 text-base">Nos Coordonnées</h3>
              
              <div className="space-y-3 text-xs text-gray-600">
                <a
                  href={`tel:${officialPhoneRaw}`}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-blue-50/60 hover:bg-blue-100/70 transition text-sama-primary group"
                >
                  <i className="fas fa-phone-alt text-base mt-0.5 group-hover:scale-110 transition"></i>
                  <div>
                    <p className="font-bold text-gray-900">Téléphone Direct</p>
                    <p className="font-extrabold">{officialPhone}</p>
                  </div>
                </a>

                <a
                  href={`https://wa.me/${officialPhoneRaw}?text=Bonjour%20SAMA%20ACADÉMIE,%20je%20souhaite%20des%20renseignements.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 transition text-emerald-800 group"
                >
                  <i className="fab fa-whatsapp text-lg mt-0.5 group-hover:scale-110 transition text-emerald-600"></i>
                  <div>
                    <p className="font-bold text-gray-900">WhatsApp Officiel</p>
                    <p className="font-extrabold text-emerald-700">{officialPhone}</p>
                  </div>
                </a>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <i className="fas fa-envelope text-sama-primary text-base mt-0.5"></i>
                  <div>
                    <p className="font-bold text-gray-900">Email Officiel</p>
                    <p className="font-mono text-gray-600">contact@sama-academie.sn</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <i className="fas fa-map-marker-alt text-sama-orange text-base mt-0.5"></i>
                  <div>
                    <p className="font-bold text-gray-900">Siège Social</p>
                    <p className="text-gray-600">Dakar, Sénégal</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-[11px] text-gray-400 font-medium">
                  🕒 Horaires : Lundi au Dimanche de 08h00 à 20h00
                </p>
              </div>
            </div>
          </div>

          {/* Formulaire de Contact */}
          <div className="md:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
            {sentSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                  <i className="fas fa-check"></i>
                </div>
                <h3 className="text-xl font-black text-gray-900">Message Transmis avec Succès !</h3>
                <p className="text-gray-600 text-sm max-w-md mx-auto">
                  Votre demande a été acheminée directement à notre permanence sur WhatsApp. Un conseiller pédagogique vous répondra dans les plus brefs délais.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setSentSuccess(false)}
                    className="btn-outline py-2.5 px-6 rounded-xl text-xs font-bold"
                  >
                    Envoyer un autre message
                  </button>
                  <Link
                    href="/"
                    className="bg-sama-primary text-white py-2.5 px-6 rounded-xl text-xs font-bold hover:bg-blue-800 transition"
                  >
                    Retour à l&apos;accueil
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                      placeholder="Ex: Karim"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                      placeholder="Ex: Doumbouya"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Adresse Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                      placeholder="votre.email@exemple.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Téléphone (WhatsApp)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                      placeholder="Ex: 77 000 00 00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Objet de votre demande</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                  >
                    <option>Information générale</option>
                    <option>Demande de cours particulier / Encadrement</option>
                    <option>Abonnement Premium (Wave / Orange Money)</option>
                    <option>Rejoindre en tant qu&apos;enseignant certifié</option>
                    <option>Support technique &amp; Connexion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Votre Message *</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 outline-none focus:border-sama-primary focus:bg-white transition"
                    placeholder="Précisez la classe de l'élève, la matière concernée ou toute autre information utile..."
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-sama-primary hover:bg-blue-800 text-white font-extrabold py-3.5 px-6 rounded-2xl transition shadow-md flex items-center justify-center gap-2 text-sm"
                >
                  <i className="fab fa-whatsapp text-lg"></i>
                  <span>Transmettre mon message à la permanence SAMA ACADÉMIE</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
