-- Add socle fields to DataObject (NFR-GOV-005 compliance)
ALTER TABLE "data_objects" 
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "comment" TEXT,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- Ensure UNIQUE constraint on name
ALTER TABLE "data_objects" 
  ADD CONSTRAINT IF NOT EXISTS "data_objects_name_key" UNIQUE ("name");

-- Remove legacy tags array column (replaced by F-03 polymorphic entity_tags)
ALTER TABLE "data_objects" DROP COLUMN IF EXISTS "tags";

-- Fix ID generation to use gen_random_uuid() instead of uuid()
-- This ensures consistency with other entities
ALTER TABLE "data_objects" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
