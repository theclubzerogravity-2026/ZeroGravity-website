-- 1. Drop the strict date lock triggers that prevent ANY retrospective attendance marking
DROP TRIGGER IF EXISTS enforce_attendance_date_lock ON public.attendance;
DROP TRIGGER IF EXISTS enforce_finalization_date_lock ON public.attendance_finalization;
DROP FUNCTION IF EXISTS public.check_attendance_date_lock();

-- 2. Backfill attendance_finalization for past dates that have attendance records
-- This ensures past events where attendance was already "booked" (like Aug 10) are locked
INSERT INTO public.attendance_finalization (event_id, attendance_date, attendance_type, status, total_members, present_count, absent_count)
SELECT 
    a.event_id, 
    a.attendance_date, 
    a.attendance_type, 
    'completed' as status,
    COUNT(*) as total_members,
    COUNT(*) FILTER (WHERE a.status = 'present') as present_count,
    COUNT(*) FILTER (WHERE a.status = 'absent') as absent_count
FROM public.attendance a
WHERE a.attendance_date <= CURRENT_DATE
GROUP BY a.event_id, a.attendance_date, a.attendance_type
ON CONFLICT (event_id, attendance_date, attendance_type) 
DO UPDATE SET 
    status = 'completed',
    total_members = EXCLUDED.total_members,
    present_count = EXCLUDED.present_count,
    absent_count = EXCLUDED.absent_count,
    updated_at = now();
