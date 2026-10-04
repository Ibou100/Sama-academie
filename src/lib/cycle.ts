export type Cycle = "Primaire" | "College" | "Lycee";

/**
 * Détecte le cycle (Primaire / Collège / Lycée) à partir d'un libellé de niveau.
 * Utilise des mots entiers (et non des sous-chaînes) pour éviter par exemple
 * que "Lycee" soit pris pour du primaire à cause de "ce".
 */
export function detectCycle(level?: string | null): Cycle | null {
  const s = (level || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!s.trim()) return null;
  if (/lycee|seconde|premiere|terminale|\bbac\b|baccalaureat/.test(s)) return "Lycee";
  if (/primaire|cfee|\b(ci|cp|ce1|ce2|cm1|cm2)\b/.test(s)) return "Primaire";
  if (/college|bfem|brevet|\b[3-6]\s*(e|eme)\b/.test(s)) return "College";
  return null;
}

/** Cycle d'un élève : Lycée par défaut si le niveau est indéterminé. */
export function studentCycleOf(level?: string | null): Cycle {
  return detectCycle(level) || "Lycee";
}
