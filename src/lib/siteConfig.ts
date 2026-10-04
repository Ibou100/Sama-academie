import { supabase } from "@/lib/supabase";

export const DEFAULT_SUPPORT_CONFIG = {
  phone: "+221 77 467 31 09",
  whatsappRaw: "221774673109",
  email: "support@sama-academie.sn",
  messagePredefini: "Bonjour SAMA ACADÉMIE, j'ai besoin d'assistance concernant la plateforme."
};

// Récupérer le numéro de support officiel (avec fallback)
export async function getSupportConfig() {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "support_whatsapp")
      .single();

    if (data && data.value) {
      const cleanNumber = data.value.replace(/[^0-9]/g, "");
      return {
        phone: data.value,
        whatsappRaw: cleanNumber,
        whatsappUrl: `https://wa.me/${cleanNumber}?text=${encodeURIComponent(DEFAULT_SUPPORT_CONFIG.messagePredefini)}`
      };
    }
  } catch (err) {
    // Si la table n'existe pas encore ou en cas d'erreur réseau
  }

  // Fallback par défaut sur le numéro fourni
  return {
    phone: DEFAULT_SUPPORT_CONFIG.phone,
    whatsappRaw: DEFAULT_SUPPORT_CONFIG.whatsappRaw,
    whatsappUrl: `https://wa.me/${DEFAULT_SUPPORT_CONFIG.whatsappRaw}?text=${encodeURIComponent(DEFAULT_SUPPORT_CONFIG.messagePredefini)}`
  };
}

// Mettre à jour le numéro de support (depuis l'admin)
export async function updateSupportConfig(newPhone: string) {
  const cleanNumber = newPhone.replace(/[^0-9]/g, "");
  
  const { error } = await supabase
    .from("site_settings")
    .upsert({
      key: "support_whatsapp",
      value: newPhone,
      updated_at: new Date().toISOString()
    }, { onConflict: "key" });

  return { success: !error, cleanNumber };
}
