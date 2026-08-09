-- 1. DELETE FIRST ENTRY OF VINIT LIMKAR (Keeps only the newest one)
DELETE FROM public.members
WHERE id IN (
    SELECT id
    FROM public.members
    WHERE name ilike 'Vinit Limkar'
    ORDER BY created_at ASC
    LIMIT (SELECT count(*) - 1 FROM public.members WHERE name ilike 'Vinit Limkar')
);

-- 2. UPDATE CORE TEAM ROLES AND DEPARTMENTS
update public.members set role = 'President', department = null where name ilike 'Pratik Dhakate';
update public.members set role = 'Vice-President', department = null where name ilike 'Suraj Ahirwal';
update public.members set role = 'Chief Coordinator', department = null where name ilike 'Vinit Limkar';

update public.members set role = 'Head', department = 'Treasurer' where name ilike 'Yash Gaikwad';
update public.members set role = 'Co-Head', department = 'Treasurer' where name ilike 'Sanvee Patil';

update public.members set role = 'Head', department = 'Execution' where name ilike 'Anushka Murudkar';
update public.members set role = 'Co-Head', department = 'Execution' where name ilike 'Atharva Vaidya';

update public.members set role = 'Head', department = 'Documentation' where name ilike 'Mangesh Jagtap';
update public.members set role = 'Co-Head', department = 'Documentation' where name ilike 'Asmita Ransingh';

update public.members set role = 'Head', department = 'Magazine' where name ilike 'Pratik Akhade';
update public.members set role = 'Co-Head', department = 'Magazine' where name ilike 'Gauri Padmavar';

update public.members set role = 'Head', department = 'Technical' where name ilike 'Bhaskar Matsagar';
update public.members set role = 'Co-Head', department = 'Technical' where name ilike 'Bhakti Jadhav';

update public.members set role = 'Head', department = 'Event Management' where name ilike 'Prarthana Nannaware';
update public.members set role = 'Co-Head', department = 'Event Management' where name ilike 'Vedanti Ingale';

update public.members set role = 'Head', department = 'Social Media' where name ilike 'Sakshi Chavan';
update public.members set role = 'Co-Head', department = 'Social Media' where name ilike 'Parth Ahire';

update public.members set role = 'PR Head', department = 'PR' where name ilike 'Sumit Mate';
update public.members set role = 'PR Head', department = 'PR' where name ilike 'Ayush Karanjkhele';
update public.members set role = 'PR Head', department = 'PR' where name ilike 'Aishwarya Gikwad';
update public.members set role = 'PR Head', department = 'PR' where name ilike 'Aishwarya Gaikwad';
