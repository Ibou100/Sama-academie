-- ==============================================================================
-- SAMA ACADÉMIE — Résolution Définitive de l'Alerte de Sécurité Supabase (RLS)
-- Projet Supabase : Sama-academie (jxpimdyfftrvewhqswje)
-- 
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > Coller > Run
-- ==============================================================================

-- 1. ACTIVATION DE ROW LEVEL SECURITY (RLS) SUR TOUTES LES TABLES PUBLIQUES
ALTER TABLE IF EXISTS public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.annales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tutoring_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tutoring_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.virtual_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.meeting_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. POLITIQUES DE SÉCURITÉ POUR LA TABLE "VIDEOS"
-- ==============================================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "videos_select_public" ON public.videos;
  DROP POLICY IF EXISTS "videos_insert_teachers_admin" ON public.videos;
  DROP POLICY IF EXISTS "videos_update_admin" ON public.videos;
  DROP POLICY IF EXISTS "videos_delete_admin" ON public.videos;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Tout le monde (visiteurs, élèves, professeurs) peut visionner les vidéos
CREATE POLICY "videos_select_public" ON public.videos
  FOR SELECT TO public
  USING (true);

-- Seuls les enseignants et les administrateurs connectés peuvent ajouter des vidéos
CREATE POLICY "videos_insert_teachers_admin" ON public.videos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('enseignant', 'admin')
    )
  );

-- Seuls les administrateurs peuvent modifier les vidéos
CREATE POLICY "videos_update_admin" ON public.videos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seuls les administrateurs peuvent supprimer les vidéos
CREATE POLICY "videos_delete_admin" ON public.videos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 3. POLITIQUES DE SÉCURITÉ POUR LA TABLE "ANNALES"
-- ==============================================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "annales_select_public" ON public.annales;
  DROP POLICY IF EXISTS "annales_insert_admin" ON public.annales;
  DROP POLICY IF EXISTS "annales_update_admin" ON public.annales;
  DROP POLICY IF EXISTS "annales_delete_admin" ON public.annales;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Tout le monde peut consulter et télécharger les annales et sujets
CREATE POLICY "annales_select_public" ON public.annales
  FOR SELECT TO public
  USING (true);

-- Seuls les administrateurs connectés peuvent ajouter des annales
CREATE POLICY "annales_insert_admin" ON public.annales
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seuls les administrateurs peuvent modifier les annales
CREATE POLICY "annales_update_admin" ON public.annales
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seuls les administrateurs peuvent supprimer les annales
CREATE POLICY "annales_delete_admin" ON public.annales
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
