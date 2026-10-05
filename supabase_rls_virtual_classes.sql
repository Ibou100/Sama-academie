-- =====================================================================
-- SAMA ACADÉMIE — Sécurité des classes virtuelles (liens de réunion)
-- À exécuter UNE FOIS dans Supabase > SQL Editor > New query > Run
-- Idempotent : peut être relancé sans risque.
--
-- Règles :
--   * Enseignant : voit/gère uniquement SES classes
--   * Élève      : voit uniquement les classes du prof qui l'encadre
--                  (tutoring_requests.status = 'accepted')
--   * Admin      : voit/gère tout
--   * Tous les autres (autres profs, parents, visiteurs) : aucun accès
-- =====================================================================

-- ---------- Fonctions utilitaires (SECURITY DEFINER = pas de récursion RLS)
create or replace function public.sama_is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function public.sama_can_access_class(p_class_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.virtual_classes vc
    where vc.id = p_class_id
      and (
        vc.teacher_id = auth.uid()
        or public.sama_is_admin()
        or exists (
          select 1 from public.tutoring_requests tr
          where tr.student_id = auth.uid()
            and tr.teacher_id = vc.teacher_id
            and tr.status = 'accepted'
        )
      )
  );
$$;

grant execute on function public.sama_is_admin() to authenticated;
grant execute on function public.sama_can_access_class(uuid) to authenticated;

-- ---------- virtual_classes : on repart d'une table propre
alter table public.virtual_classes enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'virtual_classes' loop
    execute format('drop policy if exists %I on public.virtual_classes', r.policyname);
  end loop;
end $$;

create policy "vc_select_owner_student_admin" on public.virtual_classes
  for select to authenticated
  using (
    teacher_id = auth.uid()
    or public.sama_is_admin()
    or exists (
      select 1 from public.tutoring_requests tr
      where tr.student_id = auth.uid()
        and tr.teacher_id = virtual_classes.teacher_id
        and tr.status = 'accepted'
    )
  );

create policy "vc_insert_own_teacher" on public.virtual_classes
  for insert to authenticated
  with check (
    (teacher_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'enseignant'))
    or public.sama_is_admin()
  );

create policy "vc_update_own_teacher" on public.virtual_classes
  for update to authenticated
  using (teacher_id = auth.uid() or public.sama_is_admin())
  with check (teacher_id = auth.uid() or public.sama_is_admin());

create policy "vc_delete_own_teacher" on public.virtual_classes
  for delete to authenticated
  using (teacher_id = auth.uid() or public.sama_is_admin());

-- ---------- meeting_messages (chat de la salle) : mêmes participants uniquement
alter table public.meeting_messages enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'meeting_messages' loop
    execute format('drop policy if exists %I on public.meeting_messages', r.policyname);
  end loop;
end $$;

create policy "mm_select_participants" on public.meeting_messages
  for select to authenticated
  using (public.sama_can_access_class(virtual_class_id));

create policy "mm_insert_participants" on public.meeting_messages
  for insert to authenticated
  with check (public.sama_can_access_class(virtual_class_id));
