-- ============================================================
-- ZeroGravity Secure Admin Database
-- Initial Schema
-- ============================================================

-- ------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------

create extension if not exists "pgcrypto";


-- ------------------------------------------------------------
-- 2. ADMIN PROFILES
-- ------------------------------------------------------------
-- This table maps Supabase Auth users to application roles.
--
-- IMPORTANT:
-- The actual password is NEVER stored here.
-- Supabase Auth manages passwords.
-- ------------------------------------------------------------

create table if not exists public.admin_profiles (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null unique
        references auth.users(id)
        on delete cascade,

    email text not null,

    role text not null default 'viewer'
        check (role in ('admin', 'viewer')),

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 3. MEMBERS
-- ------------------------------------------------------------

create table if not exists public.members (
    id uuid primary key default gen_random_uuid(),

    name text not null
        check (char_length(trim(name)) between 1 and 150),

    role text
        check (role is null or char_length(role) <= 150),

    department text
        check (department is null or char_length(department) <= 150),

    member_type text not null default 'General Member'
        check (
            member_type in (
                'Core Committee',
                'General Member',
                'Volunteer',
                'Other'
            )
        ),

    status text not null default 'active'
        check (
            status in ('active', 'inactive')
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 4. EVENTS
-- ------------------------------------------------------------

create table if not exists public.events (
    id uuid primary key default gen_random_uuid(),

    name text not null
        check (char_length(trim(name)) between 1 and 200),

    event_date date not null,

    event_type text not null default 'Other'
        check (
            event_type in (
                'Workshop',
                'Seminar',
                'Hackathon',
                'Competition',
                'Orientation',
                'Networking',
                'Technical Session',
                'Other'
            )
        ),

    venue text
        check (venue is null or char_length(venue) <= 250),

    description text
        check (description is null or char_length(description) <= 5000),

    status text not null default 'upcoming'
        check (
            status in (
                'upcoming',
                'completed',
                'cancelled',
                'archived'
            )
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 5. ATTENDANCE
-- ------------------------------------------------------------
-- One attendance record per member per event.
-- UUIDs prevent name-based identity problems.
-- ------------------------------------------------------------

create table if not exists public.attendance (
    id uuid primary key default gen_random_uuid(),

    event_id uuid not null
        references public.events(id)
        on delete cascade,

    member_id uuid not null
        references public.members(id)
        on delete cascade,

    status text not null
        check (
            status in ('present', 'absent')
        ),

    marked_by uuid
        references auth.users(id)
        on delete set null,

    marked_at timestamptz not null default now(),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint attendance_event_member_unique
        unique (event_id, member_id)
);


-- ------------------------------------------------------------
-- 6. SPONSORS
-- ------------------------------------------------------------
-- Data extracted from:
-- Main Database '23 Spons - FINAL SHEET.pdf
--
-- source_record preserves the original source information
-- without forcing unsupported transformations.
-- ------------------------------------------------------------

create table if not exists public.sponsors (
    id uuid primary key default gen_random_uuid(),

    source_sr_no integer,

    company_name text not null
        check (char_length(trim(company_name)) between 1 and 300),

    mobile text,

    email text,

    domain text,

    source_record jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 7. AUDIT LOGS
-- ------------------------------------------------------------
-- Application security history.
--
-- Passwords, tokens, MFA secrets and private credentials
-- MUST NEVER be written here.
-- ------------------------------------------------------------

create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),

    actor_user_id uuid
        references auth.users(id)
        on delete set null,

    action text not null
        check (char_length(trim(action)) between 1 and 100),

    resource_type text
        check (
            resource_type is null
            or char_length(resource_type) <= 100
        ),

    resource_id uuid,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 8. INDEXES
-- ------------------------------------------------------------

create index if not exists idx_admin_profiles_user_id
    on public.admin_profiles(user_id);

create index if not exists idx_admin_profiles_role
    on public.admin_profiles(role);

create index if not exists idx_admin_profiles_active
    on public.admin_profiles(is_active);

create index if not exists idx_members_member_type
    on public.members(member_type);

create index if not exists idx_members_status
    on public.members(status);

create index if not exists idx_members_name
    on public.members(name);

create index if not exists idx_events_date
    on public.events(event_date);

create index if not exists idx_events_status
    on public.events(status);

create index if not exists idx_attendance_event_id
    on public.attendance(event_id);

create index if not exists idx_attendance_member_id
    on public.attendance(member_id);

create index if not exists idx_attendance_marked_by
    on public.attendance(marked_by);

create index if not exists idx_sponsors_company_name
    on public.sponsors(company_name);

create index if not exists idx_sponsors_domain
    on public.sponsors(domain);

create index if not exists idx_audit_logs_actor
    on public.audit_logs(actor_user_id);

create index if not exists idx_audit_logs_created_at
    on public.audit_logs(created_at desc);


-- ------------------------------------------------------------
-- 9. UPDATED_AT FUNCTION
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- ------------------------------------------------------------
-- 10. UPDATED_AT TRIGGERS
-- ------------------------------------------------------------

drop trigger if exists trg_admin_profiles_updated_at
on public.admin_profiles;

create trigger trg_admin_profiles_updated_at
before update on public.admin_profiles
for each row
execute function public.set_updated_at();


drop trigger if exists trg_members_updated_at
on public.members;

create trigger trg_members_updated_at
before update on public.members
for each row
execute function public.set_updated_at();


drop trigger if exists trg_events_updated_at
on public.events;

create trigger trg_events_updated_at
before update on public.events
for each row
execute function public.set_updated_at();


drop trigger if exists trg_attendance_updated_at
on public.attendance;

create trigger trg_attendance_updated_at
before update on public.attendance
for each row
execute function public.set_updated_at();


drop trigger if exists trg_sponsors_updated_at
on public.sponsors;

create trigger trg_sponsors_updated_at
before update on public.sponsors
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 11. ADMIN CHECK FUNCTION
-- ------------------------------------------------------------
-- SECURITY DEFINER is intentional here.
--
-- This function checks the admin_profiles table without allowing
-- normal users to bypass RLS.
--
-- search_path is explicitly restricted to public.
-- ------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.admin_profiles
        where user_id = auth.uid()
          and role = 'admin'
          and is_active = true
    );
$$;


-- ------------------------------------------------------------
-- 12. MFA / AAL2 CHECK
-- ------------------------------------------------------------
-- Sensitive administrative operations require an MFA-authenticated
-- session.
-- ------------------------------------------------------------

create or replace function public.is_admin_aal2()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select
        public.is_admin()
        and coalesce(auth.jwt()->>'aal', '') = 'aal2';
$$;


-- ------------------------------------------------------------
-- 13. ENABLE ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table public.admin_profiles enable row level security;
alter table public.members enable row level security;
alter table public.events enable row level security;
alter table public.attendance enable row level security;
alter table public.sponsors enable row level security;
alter table public.audit_logs enable row level security;


-- ------------------------------------------------------------
-- 14. ADMIN PROFILES POLICIES
-- ------------------------------------------------------------

-- A logged-in user can see their own profile.
create policy "Users can read their own admin profile"
on public.admin_profiles
for select
to authenticated
using (
    user_id = auth.uid()
);


-- Existing admins with MFA can read admin profiles.
create policy "AAL2 admins can read admin profiles"
on public.admin_profiles
for select
to authenticated
using (
    public.is_admin_aal2()
);


-- IMPORTANT:
-- No public INSERT / UPDATE / DELETE policies are created here.
--
-- Admin role creation and privilege changes should be handled through
-- controlled server-side administration later.


-- ------------------------------------------------------------
-- 15. MEMBERS POLICIES
-- ------------------------------------------------------------

create policy "AAL2 admins can read members"
on public.members
for select
to authenticated
using (
    public.is_admin_aal2()
);


create policy "AAL2 admins can create members"
on public.members
for insert
to authenticated
with check (
    public.is_admin_aal2()
);


create policy "AAL2 admins can update members"
on public.members
for update
to authenticated
using (
    public.is_admin_aal2()
)
with check (
    public.is_admin_aal2()
);


create policy "AAL2 admins can delete members"
on public.members
for delete
to authenticated
using (
    public.is_admin_aal2()
);


-- ------------------------------------------------------------
-- 16. EVENTS POLICIES
-- ------------------------------------------------------------

create policy "AAL2 admins can read events"
on public.events
for select
to authenticated
using (
    public.is_admin_aal2()
);


create policy "AAL2 admins can create events"
on public.events
for insert
to authenticated
with check (
    public.is_admin_aal2()
);


create policy "AAL2 admins can update events"
on public.events
for update
to authenticated
using (
    public.is_admin_aal2()
)
with check (
    public.is_admin_aal2()
);


create policy "AAL2 admins can delete events"
on public.events
for delete
to authenticated
using (
    public.is_admin_aal2()
);


-- ------------------------------------------------------------
-- 17. ATTENDANCE POLICIES
-- ------------------------------------------------------------

create policy "AAL2 admins can read attendance"
on public.attendance
for select
to authenticated
using (
    public.is_admin_aal2()
);


create policy "AAL2 admins can create attendance"
on public.attendance
for insert
to authenticated
with check (
    public.is_admin_aal2()
    and (
        marked_by is null
        or marked_by = auth.uid()
    )
);


create policy "AAL2 admins can update attendance"
on public.attendance
for update
to authenticated
using (
    public.is_admin_aal2()
)
with check (
    public.is_admin_aal2()
    and (
        marked_by is null
        or marked_by = auth.uid()
    )
);


create policy "AAL2 admins can delete attendance"
on public.attendance
for delete
to authenticated
using (
    public.is_admin_aal2()
);


-- ------------------------------------------------------------
-- 18. SPONSOR POLICIES
-- ------------------------------------------------------------

create policy "AAL2 admins can read sponsors"
on public.sponsors
for select
to authenticated
using (
    public.is_admin_aal2()
);


create policy "AAL2 admins can create sponsors"
on public.sponsors
for insert
to authenticated
with check (
    public.is_admin_aal2()
);


create policy "AAL2 admins can update sponsors"
on public.sponsors
for update
to authenticated
using (
    public.is_admin_aal2()
)
with check (
    public.is_admin_aal2()
);


create policy "AAL2 admins can delete sponsors"
on public.sponsors
for delete
to authenticated
using (
    public.is_admin_aal2()
);


-- ------------------------------------------------------------
-- 19. AUDIT LOG POLICIES
-- ------------------------------------------------------------
-- Audit logs are intentionally append-only from the application.
--
-- No UPDATE or DELETE policy is provided.
-- ------------------------------------------------------------

create policy "AAL2 admins can create audit logs"
on public.audit_logs
for insert
to authenticated
with check (
    public.is_admin_aal2()
    and (
        actor_user_id is null
        or actor_user_id = auth.uid()
    )
);


create policy "AAL2 admins can read audit logs"
on public.audit_logs
for select
to authenticated
using (
    public.is_admin_aal2()
);


-- ------------------------------------------------------------
-- 20. DEFAULT PRIVILEGE SAFETY
-- ------------------------------------------------------------

-- Explicitly revoke table access from anonymous users.
revoke all on public.admin_profiles from anon;
revoke all on public.members from anon;
revoke all on public.events from anon;
revoke all on public.attendance from anon;
revoke all on public.sponsors from anon;
revoke all on public.audit_logs from anon;


-- Authenticated users receive no blanket table access.
-- RLS policies above determine allowed operations.
revoke all on public.admin_profiles from authenticated;
revoke all on public.members from authenticated;
revoke all on public.events from authenticated;
revoke all on public.attendance from authenticated;
revoke all on public.sponsors from authenticated;
revoke all on public.audit_logs from authenticated;


-- Grant only the ability to use the tables.
-- RLS remains the authorization boundary.
grant select on public.admin_profiles to authenticated;
grant select, insert, update, delete on public.members to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.attendance to authenticated;
grant select, insert, update, delete on public.sponsors to authenticated;
grant select, insert on public.audit_logs to authenticated;


-- ------------------------------------------------------------
-- END OF ZERO GRAVITY INITIAL SCHEMA
-- ------------------------------------------------------------