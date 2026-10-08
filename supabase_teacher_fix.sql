-- ==============================================================================
-- SAMA ACADÉMIE — Correction Définitive de l'Accréditation des Enseignants
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. MISE À JOUR DU TRIGGER D'INSCRIPTION AUTOMATIQUE
-- Assure que TOUS les champs remplis à l'inscription (experience, price, bio, level, subject, etc.)
-- sont TOUJOURS copiés instantanément dans la table public.profiles à chaque nouvelle inscription.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    role,
    phone,
    region,
    level,
    subject,
    experience,
    price,
    bio,
    email,
    verified
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'eleve'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'region',
    new.raw_user_meta_data->>'level',
    new.raw_user_meta_data->>'subject',
    new.raw_user_meta_data->>'experience',
    new.raw_user_meta_data->>'price',
    new.raw_user_meta_data->>'bio',
    new.email,
    COALESCE((new.raw_user_meta_data->>'verified')::boolean, (new.raw_user_meta_data->>'role' != 'enseignant'))
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    region = EXCLUDED.region,
    level = EXCLUDED.level,
    subject = EXCLUDED.subject,
    experience = EXCLUDED.experience,
    price = EXCLUDED.price,
    bio = EXCLUDED.bio,
    email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- S'assurer que le trigger est bien branché sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. SYNCHRONISATION RÉTROACTIVE IMMÉDIATE DES UTILISATEURS EXISTANTS
-- Récupère automatiquement l'expérience, le tarif, la bio et le cycle de Soura Loum et de tous les professeurs existants
UPDATE public.profiles p
SET
  experience = COALESCE(p.experience, u.raw_user_meta_data->>'experience'),
  price = COALESCE(p.price, u.raw_user_meta_data->>'price'),
  bio = COALESCE(p.bio, u.raw_user_meta_data->>'bio'),
  level = COALESCE(p.level, u.raw_user_meta_data->>'level'),
  subject = COALESCE(p.subject, u.raw_user_meta_data->>'subject'),
  phone = COALESCE(p.phone, u.raw_user_meta_data->>'phone'),
  region = COALESCE(p.region, u.raw_user_meta_data->>'region')
FROM auth.users u
WHERE p.id = u.id;

-- Remplissage direct spécifique pour Soura Loum (dossier du test récent) :
UPDATE public.profiles
SET
  experience = '2 à 5 ans d''expérience (FASTEF / École Normale Supérieure)',
  price = '6000 FCFA PAR ELEVE',
  bio = 'je suis un professeur tres experimenter et un bon pedagogue pour les eleves en difficulter et je donne des cours pour toutes les classes du college',
  level = 'Collège (6e à 3e)',
  subject = 'Mathématiques'
WHERE email = 'loum@gmail.com';

-- 3. PERMISSIONS RLS SUR LA TABLE PROFILES
-- Permettre aux utilisateurs authentifiés et aux administrateurs de modifier les profils
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Lecture libre pour tout le monde (annuaire officiel, vérification)
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT TO public
  USING (true);

-- Modification de son propre profil par l'utilisateur connecté
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Les administrateurs peuvent tout voir et modifier sur les profils
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
