-- ============================================================
-- ZeroGravity Secure Admin Database
-- Migration: Delete Archived Events and Remove Status Option
-- ============================================================

-- 1. Permanently delete all events with status 'archived'
-- Due to ON DELETE CASCADE constraints on related tables (e.g. attendance),
-- this will also completely remove all related records for these events.
DELETE FROM public.events WHERE status = 'archived';

-- 2. Update the status check constraint to remove 'archived'
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE public.events ADD CONSTRAINT events_status_check CHECK (
    status IN (
        'upcoming',
        'completed',
        'cancelled'
    )
);
