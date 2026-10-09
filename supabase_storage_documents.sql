-- ==============================================================================
-- SAMA ACADÉMIE — Configuration du Bucket Supabase Storage pour les Documents de Cours
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. Création ou mise à jour du bucket public 'course_documents'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course_documents',
  'course_documents',
  true,
  26214400, -- Limite de 25 Mo
  null      -- Autorise tous les types de documents (PDF, Word, Images, etc.)
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 26214400;

-- 2. Suppression des anciennes politiques si existantes pour éviter les doublons
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public can view course documents" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload course documents" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update their course documents" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete their course documents" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Politique : Tout le monde (élèves, parents, profs) peut lire/télécharger les documents du bucket
CREATE POLICY "Public can view course documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'course_documents');

-- 4. Politique : Tous les utilisateurs connectés peuvent téléverser des documents de cours
CREATE POLICY "Authenticated users can upload course documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course_documents');

-- 5. Politique : Les utilisateurs connectés peuvent mettre à jour leurs fichiers
CREATE POLICY "Authenticated users can update their course documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'course_documents');

-- 6. Politique : Les utilisateurs connectés peuvent supprimer leurs fichiers
CREATE POLICY "Authenticated users can delete their course documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'course_documents');
