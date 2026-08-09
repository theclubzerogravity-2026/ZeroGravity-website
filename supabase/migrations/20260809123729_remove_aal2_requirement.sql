-- ============================================================
-- ZeroGravity Secure Admin Database
-- Remove MFA (AAL2) Requirement (Migration 3)
-- ============================================================

-- ------------------------------------------------------------
-- 1. DROP EXISTING AAL2 POLICIES
-- ------------------------------------------------------------

drop policy if exists "AAL2 admins can read admin profiles" on public.admin_profiles;

drop policy if exists "AAL2 admins can read members" on public.members;
drop policy if exists "AAL2 admins can create members" on public.members;
drop policy if exists "AAL2 admins can update members" on public.members;
drop policy if exists "AAL2 admins can delete members" on public.members;

drop policy if exists "AAL2 admins can read events" on public.events;
drop policy if exists "AAL2 admins can create events" on public.events;
drop policy if exists "AAL2 admins can update events" on public.events;
drop policy if exists "AAL2 admins can delete events" on public.events;

drop policy if exists "AAL2 admins can read attendance" on public.attendance;
drop policy if exists "AAL2 admins can create attendance" on public.attendance;
drop policy if exists "AAL2 admins can update attendance" on public.attendance;
drop policy if exists "AAL2 admins can delete attendance" on public.attendance;

drop policy if exists "AAL2 admins can read sponsors" on public.sponsors;
drop policy if exists "AAL2 admins can create sponsors" on public.sponsors;
drop policy if exists "AAL2 admins can update sponsors" on public.sponsors;
drop policy if exists "AAL2 admins can delete sponsors" on public.sponsors;

drop policy if exists "AAL2 admins can read audit logs" on public.audit_logs;
drop policy if exists "AAL2 admins can create audit logs" on public.audit_logs;


-- ------------------------------------------------------------
-- 2. RECREATE POLICIES USING is_admin()
-- ------------------------------------------------------------
-- is_admin() requires an active session matching admin_profiles
-- where role = 'admin' and is_active = true.
-- ------------------------------------------------------------

-- Admin Profiles
create policy "Admins can read admin profiles" on public.admin_profiles for select to authenticated using (public.is_admin());

-- Members
create policy "Admins can read members" on public.members for select to authenticated using (public.is_admin());
create policy "Admins can create members" on public.members for insert to authenticated with check (public.is_admin());
create policy "Admins can update members" on public.members for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete members" on public.members for delete to authenticated using (public.is_admin());

-- Events
create policy "Admins can read events" on public.events for select to authenticated using (public.is_admin());
create policy "Admins can create events" on public.events for insert to authenticated with check (public.is_admin());
create policy "Admins can update events" on public.events for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete events" on public.events for delete to authenticated using (public.is_admin());

-- Attendance
create policy "Admins can read attendance" on public.attendance for select to authenticated using (public.is_admin());
create policy "Admins can create attendance" on public.attendance for insert to authenticated with check (public.is_admin() and marked_by = auth.uid());
create policy "Admins can update attendance" on public.attendance for update to authenticated using (public.is_admin()) with check (public.is_admin() and marked_by = auth.uid());
create policy "Admins can delete attendance" on public.attendance for delete to authenticated using (public.is_admin());

-- Sponsors
create policy "Admins can read sponsors" on public.sponsors for select to authenticated using (public.is_admin());
create policy "Admins can create sponsors" on public.sponsors for insert to authenticated with check (public.is_admin());
create policy "Admins can update sponsors" on public.sponsors for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete sponsors" on public.sponsors for delete to authenticated using (public.is_admin());

-- Audit Logs
create policy "Admins can read audit logs" on public.audit_logs for select to authenticated using (public.is_admin());
create policy "Admins can create audit logs" on public.audit_logs for insert to authenticated with check (public.is_admin() and actor_user_id = auth.uid());
