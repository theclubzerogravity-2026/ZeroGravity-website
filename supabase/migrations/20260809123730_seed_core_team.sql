-- ============================================================
-- ZeroGravity Secure Admin Database
-- Seed Core Team Data (Migration 4)
-- ============================================================

INSERT INTO public.members (name, role, department, member_type, status)
VALUES 
    -- LEADERSHIP
    ('Pratik Dhakate', 'President', 'Leadership', 'Core Committee', 'active'),
    ('Suraj Ahirwal', 'Vice-President', 'Leadership', 'Core Committee', 'active'),
    ('Vinit Limkar', 'Chief Coordinator', 'Leadership', 'Core Committee', 'active'),

    -- DEPARTMENTS (HEADS)
    ('Yash Gaikwad', 'Head', 'Treasurer', 'Core Committee', 'active'),
    ('Anushka Murudkar', 'Head', 'Execution', 'Core Committee', 'active'),
    ('Mangesh Jagtap', 'Head', 'Documentation', 'Core Committee', 'active'),
    ('Pratik Akhade', 'Head', 'Magazine', 'Core Committee', 'active'),
    ('Bhaskar Matsagar', 'Head', 'Technical', 'Core Committee', 'active'),
    ('Prarthana Nannaware', 'Head', 'Event Management', 'Core Committee', 'active'),
    ('Sakshi Chavan', 'Head', 'Social Media', 'Core Committee', 'active'),

    -- DEPARTMENTS (CO-HEADS)
    ('Sanvee Patil', 'Co-Head', 'Treasurer', 'Core Committee', 'active'),
    ('Atharva Vaidya', 'Co-Head', 'Execution', 'Core Committee', 'active'),
    ('Asmita Ransingh', 'Co-Head', 'Documentation', 'Core Committee', 'active'),
    ('Gauri Padmavar', 'Co-Head', 'Magazine', 'Core Committee', 'active'),
    ('Bhakti Jadhav', 'Co-Head', 'Technical', 'Core Committee', 'active'),
    ('Vedanti Ingale', 'Co-Head', 'Event Management', 'Core Committee', 'active'),
    ('Parth Ahire', 'Co-Head', 'Social Media', 'Core Committee', 'active'),

    -- PR TEAM
    ('Sumit Mate', 'PR Head', 'PR Team', 'Core Committee', 'active'),
    ('Ayush Karanjkhele', 'PR Head', 'PR Team', 'Core Committee', 'active'),
    ('Aishwarya Gikwad', 'PR Head', 'PR Team', 'Core Committee', 'active');
