-- ==============================================================================
-- SAMA ACADÉMIE — SCRIPT DE SÉCURITÉ INTÉGRAL & AUTO-RÉPARATEUR (RLS)
-- ==============================================================================
-- À exécuter dans votre Console Supabase : SQL Editor > New Query > Coller TOUT > Run
-- Ce script est 100% autonome et peut être réexécuté sans risque.

-- 1. FONCTIONS DE CONTRÔLE DE SÉCURITÉ (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.sama_is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.sama_is_admin() TO authenticated, anon;

-- 2. VERROUILLAGE DE LA TABLE "PROFILES" CONTRE L'ÉLÉVATION DE PRIVILÈGES
-- Un utilisateur ne peut JAMAIS s'attribuer le rôle admin ou le statut is_premium par lui-même.
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger AS $$
BEGIN
  -- Si l'utilisateur n'est pas admin, il ne peut pas modifier son propre role ou is_premium
  IF auth.uid() IS NOT NULL AND NOT public.sama_is_admin() THEN
    NEW.role := OLD.role;
    NEW.is_premium := OLD.is_premium;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_privileges ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileges();

-- Activation stricte de RLS sur profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END $$;

-- Tout le monde peut consulter les profils publics (annuaire des professeurs certifiés)
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT TO public
  USING (true);

-- L'utilisateur connecté peut modifier son propre profil (coordonnées, bio, etc.)
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Les administrateurs ont le contrôle total
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.sama_is_admin())
  WITH CHECK (public.sama_is_admin());

-- 3. VERROUILLAGE DE LA TABLE "ANNALES"
ALTER TABLE public.annales ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'annales' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.annales', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "annales_select_public" ON public.annales
  FOR SELECT TO public
  USING (true);

CREATE POLICY "annales_admin_modify" ON public.annales
  FOR ALL TO authenticated
  USING (public.sama_is_admin())
  WITH CHECK (public.sama_is_admin());

-- 4. VERROUILLAGE DE LA TABLE "VIDEOS"
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'videos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.videos', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "videos_select_public" ON public.videos
  FOR SELECT TO public
  USING (true);

-- Seuls les enseignants et administrateurs peuvent publier une vidéo
CREATE POLICY "videos_insert_teachers" ON public.videos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('enseignant', 'admin')
    )
  );

CREATE POLICY "videos_admin_manage" ON public.videos
  FOR UPDATE TO authenticated
  USING (public.sama_is_admin());

CREATE POLICY "videos_admin_delete" ON public.videos
  FOR DELETE TO authenticated
  USING (public.sama_is_admin());

-- 5. CRÉATION ET VERROUILLAGE DE LA TABLE "ADMIN_AUDIT_LOGS"
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  admin_id TEXT,
  admin_name TEXT,
  admin_email TEXT,
  action TEXT NOT NULL,
  target_user_id TEXT,
  target_name TEXT,
  details TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'SUCCESS'
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_audit_logs' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_audit_logs', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "audit_admin_only" ON public.admin_audit_logs
  FOR ALL TO authenticated
  USING (public.sama_is_admin())
  WITH CHECK (public.sama_is_admin());

-- 6. FONCTION D'ACCRÉDITATION ENSEIGNANT SÉCURISÉE
CREATE OR REPLACE FUNCTION public.set_teacher_verification(p_teacher_id UUID, p_verified BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.sama_is_admin() THEN
    RAISE EXCEPTION 'Action réservée aux administrateurs.';
  END IF;

  UPDATE public.profiles
  SET verified = p_verified
  WHERE id = p_teacher_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.set_teacher_verification(UUID, BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_teacher_verification(UUID, BOOLEAN) TO authenticated;
