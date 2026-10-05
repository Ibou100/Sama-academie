import { supabase } from "@/lib/supabase";

/**
 * Règles d'accès aux classes virtuelles (liens de réunion) :
 *  - admin : toutes les classes
 *  - enseignant : uniquement ses propres classes
 *  - élève : uniquement les classes de l'enseignant qui l'encadre (assigné par l'admin)
 *  - tous les autres : aucune
 */
export async function getVisibleTeacherIds(userId: string, role?: string | null): Promise<string[] | "all"> {
  if (role === "admin") return "all";
  if (role === "enseignant") return [userId];
  if (role === "eleve") {
    const { data } = await supabase
      .from("tutoring_requests")
      .select("teacher_id")
      .eq("student_id", userId)
      .eq("status", "accepted");
    return Array.from(new Set((data || []).map((r: any) => r.teacher_id).filter(Boolean)));
  }
  return [];
}

export async function canAccessClass(userId: string, role: string | null | undefined, teacherId: string): Promise<boolean> {
  const ids = await getVisibleTeacherIds(userId, role);
  return ids === "all" || ids.includes(teacherId);
}
