-- Migration 8: Finance Receipts and Ledger

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_url text;
ALTER TABLE public.expense_settlements ADD COLUMN IF NOT EXISTS receipt_url text;
ALTER TABLE public.income_transactions ADD COLUMN IF NOT EXISTS receipt_url text;

-- Create Storage Bucket for Receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Drop existing just in case
DROP POLICY IF EXISTS "Admins can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;

CREATE POLICY "Admins can upload receipts" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'receipts' AND public.is_admin());

CREATE POLICY "Admins can update receipts" 
ON storage.objects FOR UPDATE
TO authenticated 
USING (bucket_id = 'receipts' AND public.is_admin())
WITH CHECK (bucket_id = 'receipts' AND public.is_admin());

CREATE POLICY "Admins can delete receipts" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'receipts' AND public.is_admin());

CREATE POLICY "Anyone can view receipts" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'receipts');
