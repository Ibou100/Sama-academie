"use client";

import { useEffect, useState } from "react";
import { getSupportConfig } from "@/lib/siteConfig";

export default function WhatsAppSupport() {
  const [whatsappUrl, setWhatsappUrl] = useState("https://wa.me/221774673109?text=Bonjour%20SAMA%20ACAD%C3%89MIE%2C%20j'ai%20besoin%20d'aide.");
  const [supportPhone, setSupportPhone] = useState("+221 77 467 31 09");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getSupportConfig().then((config) => {
      setWhatsappUrl(config.whatsappUrl);
      setSupportPhone(config.phone);
    });
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Fenêtre pop-up d'assistance quand on survole ou clique */}
      {isOpen && (
        <div className="mb-3 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-72 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">Support SAMA ACADÉMIE</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            Une question sur les inscriptions, un cours ou l&apos;utilisation de la plateforme ? Notre équipe vous répond rapidement.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition text-xs shadow-md"
          >
            <i className="fab fa-whatsapp text-sm"></i> Écrire au {supportPhone}
          </a>
        </div>
      )}

      {/* Bouton Flottant Circulaire */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-3.5 shadow-2xl flex items-center gap-2.5 transition transform hover:scale-105 active:scale-95 group"
        aria-label="Support WhatsApp SAMA ACADÉMIE"
      >
        <i className="fab fa-whatsapp text-2xl"></i>
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold pr-1">
          Support WhatsApp
        </span>
      </button>
    </div>
  );
}
