-- Migration: Allow Admins to retroactively edit attendance

-- Drop existing restricted policies
DROP POLICY IF EXISTS "Admins can create attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can delete attendance" ON public.attendance;

-- Create flexible policies for Admins
CREATE POLICY "Admins can create attendance"
ON public.attendance
FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update attendance"
ON public.attendance
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete attendance"
ON public.attendance
FOR DELETE TO authenticated
USING (public.is_admin());
