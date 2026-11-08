-- Migration: career_target_jobs.platform_job_id → ON DELETE SET NULL
-- Date: 2026-11-08
-- Description: Allow hard-deleting expired platform jobs while keeping career
--              agent snapshots (they store their own title/description/analysis).
--              Only the live jobs.id link is cleared.
--
-- Applied automatically on startup via ensure_career_target_job_fk();
-- run manually if you need to fix a database before the next boot:
--
--   psql "$DATABASE_URL" -f migrations/fix_career_target_jobs_fk.sql

ALTER TABLE career_target_jobs
    DROP CONSTRAINT IF EXISTS career_target_jobs_platform_job_id_fkey;

ALTER TABLE career_target_jobs
    ADD CONSTRAINT career_target_jobs_platform_job_id_fkey
    FOREIGN KEY (platform_job_id) REFERENCES jobs(id) ON DELETE SET NULL;
