-- ============================================================
-- ZeroGravity Secure Admin Database
-- Security Audit Fixes (Migration 2)
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROTECT CREATED_AT TIMESTAMP
-- ------------------------------------------------------------
-- Modify the existing trigger function to ensure created_at 
-- is immutable during updates.
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
    new.updated_at = now();
    
    -- Prevent modification of created_at
    if TG_OP = 'UPDATE' then
        new.created_at = old.created_at;
    end if;
    
    return new;
end;
$$;


-- ------------------------------------------------------------
-- 2. FORCE AUTH IDENTITY TRIGGER
-- ------------------------------------------------------------
-- This trigger automatically sets the user ID fields based on 
-- auth.uid(), ignoring any client-provided values to prevent 
-- identity spoofing.
-- ------------------------------------------------------------
create or replace function public.force_auth_uid()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
    if TG_TABLE_NAME = 'attendance' then
        new.marked_by = auth.uid();
    elsif TG_TABLE_NAME = 'audit_logs' then
        new.actor_user_id = auth.uid();
    end if;
    return new;
end;
$$;

-- Apply trigger to attendance (INSERT and UPDATE)
drop trigger if exists trg_attendance_force_auth_uid on public.attendance;
create trigger trg_attendance_force_auth_uid
before insert or update on public.attendance
for each row
execute function public.force_auth_uid();

-- Apply trigger to audit_logs (INSERT only, as updates are denied)
drop trigger if exists trg_audit_logs_force_auth_uid on public.audit_logs;
create trigger trg_audit_logs_force_auth_uid
before insert on public.audit_logs
for each row
execute function public.force_auth_uid();


-- ------------------------------------------------------------
-- 3. STRICT RLS POLICIES FOR IDENTITY
-- ------------------------------------------------------------
-- Recreate the policies to demand exact identity matching,
-- removing the "is null" fallback since the trigger guarantees
-- the value will be auth.uid().
-- ------------------------------------------------------------

-- Attendance INSERT
drop policy if exists "AAL2 admins can create attendance" on public.attendance;
create policy "AAL2 admins can create attendance"
on public.attendance
for insert
to authenticated
with check (
    public.is_admin_aal2()
    and marked_by = auth.uid()
);

-- Attendance UPDATE
drop policy if exists "AAL2 admins can update attendance" on public.attendance;
create policy "AAL2 admins can update attendance"
on public.attendance
for update
to authenticated
using (
    public.is_admin_aal2()
)
with check (
    public.is_admin_aal2()
    and marked_by = auth.uid()
);

-- Audit Logs INSERT
drop policy if exists "AAL2 admins can create audit logs" on public.audit_logs;
create policy "AAL2 admins can create audit logs"
on public.audit_logs
for insert
to authenticated
with check (
    public.is_admin_aal2()
    and actor_user_id = auth.uid()
);
