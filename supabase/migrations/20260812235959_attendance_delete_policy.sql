-- Fix for Admin Attendance Deletion
-- Grants DELETE permissions and creates DELETE policies for admins

-- 1. attendance_finalization table
GRANT DELETE ON public.attendance_finalization TO authenticated;

DROP POLICY IF EXISTS "Admins can delete attendance_finalization" ON public.attendance_finalization;
CREATE POLICY "Admins can delete attendance_finalization"
    ON public.attendance_finalization
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- 2. attendance table
GRANT DELETE ON public.attendance TO authenticated;

DROP POLICY IF EXISTS "Admins can delete attendance" ON public.attendance;
CREATE POLICY "Admins can delete attendance"
    ON public.attendance
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- 3. attendance_reminder_state table
GRANT DELETE ON public.attendance_reminder_state TO authenticated;

DROP POLICY IF EXISTS "Admins can delete attendance_reminder_state" ON public.attendance_reminder_state;
CREATE POLICY "Admins can delete attendance_reminder_state"
    ON public.attendance_reminder_state
    FOR DELETE TO authenticated
    USING (public.is_admin());
