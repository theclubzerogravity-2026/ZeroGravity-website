-- ============================================================
-- ZeroGravity Secure Admin Database
-- Migration 7: Attendance Module Overhaul
-- ============================================================

-- ------------------------------------------------------------
-- 1. ADD NEW DATE COLUMNS TO EVENTS
-- ------------------------------------------------------------
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS prep_start_date date,
ADD COLUMN IF NOT EXISTS prep_end_date date;

ALTER TABLE public.events
ADD CONSTRAINT check_end_date CHECK (end_date IS NULL OR end_date >= event_date),
ADD CONSTRAINT check_prep_dates CHECK (
    (prep_start_date IS NULL AND prep_end_date IS NULL) OR 
    (prep_start_date IS NOT NULL AND prep_end_date IS NOT NULL AND prep_end_date >= prep_start_date)
);

-- Initialize existing events
UPDATE public.events
SET 
  end_date = event_date,
  prep_start_date = event_date - interval '3 days',
  prep_end_date = event_date
WHERE prep_start_date IS NULL;

-- ------------------------------------------------------------
-- 2. OVERHAUL ATTENDANCE TABLE
-- ------------------------------------------------------------
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_event_member_unique;

ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS attendance_date date,
ADD COLUMN IF NOT EXISTS attendance_type text CHECK (attendance_type IN ('EVENT', 'PREP'));

-- Migrate old data: assume existing attendance was for the event_date and type EVENT
UPDATE public.attendance a
SET 
  attendance_date = COALESCE((SELECT event_date FROM public.events e WHERE e.id = a.event_id), now()::date),
  attendance_type = 'EVENT'
WHERE attendance_date IS NULL;

ALTER TABLE public.attendance ALTER COLUMN attendance_date SET NOT NULL;
ALTER TABLE public.attendance ALTER COLUMN attendance_type SET NOT NULL;

-- Add new composite unique constraint
ALTER TABLE public.attendance ADD CONSTRAINT attendance_event_member_date_type_unique UNIQUE (event_id, member_id, attendance_date, attendance_type);

-- ------------------------------------------------------------
-- 3. ATTENDANCE REMINDER STATE TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_reminder_state (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete cascade,
    attendance_date date not null,
    attendance_type text not null check (attendance_type in ('EVENT', 'PREP')),
    
    last_reminder_at timestamptz,
    reminder_count integer not null default 0,
    completed_at timestamptz,
    status text not null default 'pending' check (status in ('pending', 'completed')),
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    constraint attendance_reminder_unique unique (event_id, attendance_date, attendance_type)
);

ALTER TABLE public.attendance_reminder_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to attendance_reminder_state"
    ON public.attendance_reminder_state
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------
-- 4. DATE-LOCKED RLS POLICIES FOR ATTENDANCE
-- ------------------------------------------------------------
-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can create attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can delete attendance" ON public.attendance;
DROP POLICY IF EXISTS "AAL2 admins can create attendance" ON public.attendance;
DROP POLICY IF EXISTS "AAL2 admins can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "AAL2 admins can delete attendance" ON public.attendance;

-- Admins can only insert attendance for TODAY or FUTURE dates (India time)
CREATE POLICY "Admins can create attendance"
ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
    AND attendance_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date
);

-- Admins can only update attendance for TODAY or FUTURE dates (India time)
CREATE POLICY "Admins can update attendance"
ON public.attendance
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    AND attendance_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date
)
WITH CHECK (
    public.is_admin()
    AND attendance_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date
);

-- Admins can only delete attendance for TODAY or FUTURE dates (India time)
CREATE POLICY "Admins can delete attendance"
ON public.attendance
FOR DELETE
TO authenticated
USING (
    public.is_admin()
    AND attendance_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date
);
