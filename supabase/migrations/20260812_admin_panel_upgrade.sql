-- ============================================================
-- ZeroGravity Admin Panel Upgrade
-- Migration: Tasks, Registrations, and Strict Date Locking
-- ============================================================

-- ------------------------------------------------------------
-- 1. REGISTRATIONS TABLE
-- ------------------------------------------------------------
create table if not exists public.registrations (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete cascade,
    
    name text not null check (char_length(trim(name)) between 1 and 150),
    email text check (email is null or char_length(email) <= 250),
    phone text check (phone is null or char_length(phone) <= 50),
    
    member_id uuid references public.members(id) on delete set null,
    
    status text not null default 'registered'
        check (status in ('registered', 'waitlisted', 'cancelled', 'deleted')),
        
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- RLS for Registrations
alter table public.registrations enable row level security;

create policy "Admins can manage registrations"
    on public.registrations
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

create trigger set_updated_at_registrations
    before update on public.registrations
    for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2. TASKS TABLE
-- ------------------------------------------------------------
create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete cascade,
    
    title text not null check (char_length(trim(title)) between 1 and 250),
    description text check (description is null or char_length(description) <= 2000),
    
    assigned_to uuid references public.members(id) on delete set null,
    due_date date,
    
    status text not null default 'pending'
        check (status in ('pending', 'in_progress', 'completed', 'deleted')),
        
    created_by uuid references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- RLS for Tasks
alter table public.tasks enable row level security;

create policy "Admins can manage tasks"
    on public.tasks
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

create trigger set_updated_at_tasks
    before update on public.tasks
    for each row execute function public.set_updated_at();

create trigger set_created_by_tasks
    before insert on public.tasks
    for each row execute function public.force_auth_uid();


-- ------------------------------------------------------------
-- 3. STRICT DATE LOCKING FOR ATTENDANCE
-- ------------------------------------------------------------
-- This function ensures that attendance for past dates cannot be
-- inserted, updated, or deleted. Comparisons use Asia/Kolkata timezone.
create or replace function public.check_attendance_date_lock()
returns trigger as $$
declare
    v_target_date date;
    v_today date;
    v_event_date date;
    v_event_id uuid;
    v_attendance_type text;
    v_attendance_date date;
begin
    -- Determine which row we are looking at (OLD for delete/update, NEW for insert/update)
    if (TG_OP = 'DELETE') then
        v_event_id := OLD.event_id;
        v_attendance_type := OLD.attendance_type;
        v_attendance_date := OLD.attendance_date;
    else
        v_event_id := NEW.event_id;
        v_attendance_type := NEW.attendance_type;
        v_attendance_date := NEW.attendance_date;
    end if;

    -- Get today's date in IST
    v_today := (timezone('Asia/Kolkata', now()))::date;

    -- Get the event date
    select event_date into v_event_date from public.events where id = v_event_id;

    if v_attendance_type = 'EVENT' then
        v_target_date := v_event_date;
    elsif v_attendance_type = 'PREP' then
        v_target_date := v_attendance_date;
    else
        -- Fallback if type is missing (legacy records)
        v_target_date := v_event_date;
    end if;

    -- If the target date has strictly passed compared to today's date, reject the operation.
    if v_target_date < v_today then
        raise exception 'ATTENDANCE_LOCKED: Cannot modify attendance for past dates. Target date (%) is before today (%).', v_target_date, v_today;
    end if;

    if (TG_OP = 'DELETE') then
        return OLD;
    else
        return NEW;
    end if;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to recreate
drop trigger if exists enforce_attendance_date_lock on public.attendance;

-- Apply trigger before insert, update, or delete
create trigger enforce_attendance_date_lock
    before insert or update or delete on public.attendance
    for each row execute function public.check_attendance_date_lock();

-- Apply similar lock for the finalization table to prevent tampering
drop trigger if exists enforce_finalization_date_lock on public.attendance_finalization;

create trigger enforce_finalization_date_lock
    before insert or update or delete on public.attendance_finalization
    for each row execute function public.check_attendance_date_lock();
