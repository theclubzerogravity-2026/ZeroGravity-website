-- Migration: Automatically delete receipts older than 6 months

-- Ensure pg_cron is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule a daily job at 2 AM to clean up old receipts
-- This deletes the row in storage.objects, which triggers the backend to remove the physical file.
SELECT cron.schedule(
    'cleanup-old-receipts',
    '0 2 * * *',
    $$
    DELETE FROM storage.objects
    WHERE bucket_id = 'receipts'
      AND created_at < now() - interval '6 months';
    $$
);
