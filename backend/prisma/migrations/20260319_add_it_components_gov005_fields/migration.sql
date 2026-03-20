-- FS-04-BACK: Add NFR-GOV-005 fields to it_components
-- Add description, comment, updated_at columns and UNIQUE constraint on name

ALTER TABLE it_components
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS comment TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Change id default from uuid_generate_v4() to gen_random_uuid() if needed
ALTER TABLE it_components
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Remove legacy tags column
ALTER TABLE it_components
  DROP COLUMN IF EXISTS tags;

-- Add unique constraint on name (idempotent via IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'it_components_name_key'
  ) THEN
    ALTER TABLE it_components ADD CONSTRAINT it_components_name_key UNIQUE (name);
  END IF;
END
$$;
