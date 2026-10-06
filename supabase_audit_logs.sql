-- =====================================================================
-- SAMA ACADÉMIE — Journal d'Audit & Traçabilité des Administrateurs
-- À exécuter dans Supabase > SQL Editor > New query > Run
-- Idempotent : peut être relancé sans risque.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    admin_id UUID,
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

-- Index pour optimiser les requêtes d'affichage par date et par admin
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_email ON public.admin_audit_logs (admin_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.admin_audit_logs (action);

-- Activation de la sécurité niveau ligne (RLS)
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Suppression des anciennes règles pour réapplication propre
DO $$
BEGIN
    DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.admin_audit_logs;
    DROP POLICY IF EXISTS "audit_logs_insert_admin" ON public.admin_audit_logs;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 1. Seuls les comptes ayant le rôle 'admin' peuvent lire les logs d'audit
CREATE POLICY "audit_logs_select_admin" ON public.admin_audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- 2. Insertion permise aux utilisateurs authentifiés et au service_role
CREATE POLICY "audit_logs_insert_admin" ON public.admin_audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);
