-- FIX: Merge duplicate Vinit Limkar records
DO $$
DECLARE
    old_id uuid;
    new_id uuid;
BEGIN
    -- 1. Identify the two Vinit Limkar records (oldest and newest)
    SELECT id INTO old_id FROM public.members WHERE name ilike 'Vinit Limkar' ORDER BY created_at ASC LIMIT 1;
    SELECT id INTO new_id FROM public.members WHERE name ilike 'Vinit Limkar' ORDER BY created_at DESC LIMIT 1;
    
    -- Make sure we actually found two distinct records
    IF old_id IS NOT NULL AND new_id IS NOT NULL AND old_id != new_id THEN
        
        -- 2. Transfer all expenses to the new ID
        UPDATE public.expenses SET paid_by_member_id = new_id WHERE paid_by_member_id = old_id;
        
        -- 3. Transfer attendance to the new ID (ignoring conflicts if he was marked present twice)
        UPDATE public.attendance SET member_id = new_id WHERE member_id = old_id 
        AND NOT EXISTS (
            SELECT 1 FROM public.attendance a2 WHERE a2.member_id = new_id AND a2.event_id = public.attendance.event_id
        );
        
        -- Delete any remaining duplicate attendance records that couldn't be transferred
        DELETE FROM public.attendance WHERE member_id = old_id;

        -- 4. Delete the old duplicate member
        DELETE FROM public.members WHERE id = old_id;
        
    END IF;
END $$;
