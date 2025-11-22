-- Migration: Increase field lengths for titles and other text fields
-- Date: 2025-11-22
-- Description: Increase character limits to support longer titles and descriptions

-- Scholarships table
ALTER TABLE scholarships 
    ALTER COLUMN title TYPE VARCHAR(500),
    ALTER COLUMN slug TYPE VARCHAR(500),
    ALTER COLUMN external_organization_name TYPE VARCHAR(300),
    ALTER COLUMN external_organization_website TYPE VARCHAR(500),
    ALTER COLUMN scholarship_type TYPE VARCHAR(100),
    ALTER COLUMN study_level TYPE VARCHAR(200),
    ALTER COLUMN field_of_study TYPE VARCHAR(300);

-- Jobs table
ALTER TABLE jobs 
    ALTER COLUMN title TYPE VARCHAR(500),
    ALTER COLUMN slug TYPE VARCHAR(500),
    ALTER COLUMN external_company_name TYPE VARCHAR(300),
    ALTER COLUMN external_company_website TYPE VARCHAR(500);

-- Create indexes on new longer fields if they don't exist
CREATE INDEX IF NOT EXISTS idx_scholarships_title ON scholarships(title);
CREATE INDEX IF NOT EXISTS idx_scholarships_slug ON scholarships(slug);
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON jobs(slug);

-- Update any existing data that might be truncated (optional)
-- This will add ellipsis to any titles that were previously truncated
UPDATE scholarships SET title = CONCAT(SUBSTRING(title, 1, 497), '...') 
WHERE LENGTH(title) = 200 AND title NOT LIKE '%...';

UPDATE jobs SET title = CONCAT(SUBSTRING(title, 1, 497), '...') 
WHERE LENGTH(title) = 200 AND title NOT LIKE '%...';
