-- ============================================================
-- ZeroGravity Secure Admin Database
-- Migration: Attendance Module Redesign (Event-Driven Architecture)
-- ============================================================

-- ------------------------------------------------------------
-- 1. EVENTS TABLE ENHANCEMENTS
-- ------------------------------------------------------------

-- Add prep_dates array column for explicit preparation dates
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS prep_dates date[] DEFAULT '{}';

-- Migrate existing prep_start_date/prep_end_date ranges into the new array
-- This generates one entry per day in the range
UPDATE public.events
SET prep_dates = (
    SELECT COALESCE(array_agg(d::date ORDER BY d), '{}')
    FROM generate_series(prep_start_date, prep_end_date, '1 day'::interval) AS d
)
WHERE prep_start_date IS NOT NULL
  AND prep_end_date IS NOT NULL
  AND (prep_dates IS NULL OR prep_dates = '{}');

-- ------------------------------------------------------------
-- 2. ATTENDANCE TABLE ENHANCEMENTS
-- ------------------------------------------------------------

-- Add finalization and correction tracking columns
ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS finalized_at timestamptz,
ADD COLUMN IF NOT EXISTS finalized_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS correction_reason text;

-- ------------------------------------------------------------
-- 3. ATTENDANCE FINALIZATION TABLE
-- ------------------------------------------------------------
-- Tracks whether attendance for a given event/date/type has been finalized.
-- This is separate from individual records so we can lock entire sessions.

CREATE TABLE IF NOT EXISTS public.attendance_finalization (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    attendance_date date NOT NULL,
    attendance_type text NOT NULL CHECK (attendance_type IN ('EVENT', 'PREP')),

    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed')),

    total_members integer NOT NULL DEFAULT 0,
    present_count integer NOT NULL DEFAULT 0,
    absent_count integer NOT NULL DEFAULT 0,

    finalized_at timestamptz,
    finalized_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT attendance_finalization_unique
        UNIQUE (event_id, attendance_date, attendance_type)
);

-- Enable RLS
ALTER TABLE public.attendance_finalization ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can read attendance_finalization"
    ON public.attendance_finalization
    FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can insert attendance_finalization"
    ON public.attendance_finalization
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update attendance_finalization"
    ON public.attendance_finalization
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.attendance_finalization TO authenticated;
REVOKE ALL ON public.attendance_finalization FROM anon;

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_attendance_finalization_updated_at ON public.attendance_finalization;
CREATE TRIGGER trg_attendance_finalization_updated_at
BEFORE UPDATE ON public.attendance_finalization
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_finalization_event
    ON public.attendance_finalization(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_finalization_date
    ON public.attendance_finalization(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_type_date
    ON public.attendance(attendance_type, attendance_date);

-- ------------------------------------------------------------
-- 4. DATA CLEANUP: Deduplicate attendance records
-- ------------------------------------------------------------
-- The unique constraint (event_id, member_id, attendance_date, attendance_type)
-- already exists from a prior migration. If duplicates somehow exist,
-- keep only the most recent record per unique combination.

DELETE FROM public.attendance a
USING public.attendance b
WHERE a.id < b.id
  AND a.event_id = b.event_id
  AND a.member_id = b.member_id
  AND a.attendance_date = b.attendance_date
  AND a.attendance_type = b.attendance_type;

-- ------------------------------------------------------------
-- 5. REMOVE ORPHAN ATTENDANCE (for deleted events)
-- ------------------------------------------------------------
-- The FK already cascades, but just in case:
DELETE FROM public.attendance
WHERE event_id NOT IN (SELECT id FROM public.events);

-- ------------------------------------------------------------
-- END OF ATTENDANCE REDESIGN MIGRATION
-- ------------------------------------------------------------
