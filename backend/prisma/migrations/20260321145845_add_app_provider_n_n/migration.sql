-- Create junction table for N:N provider relationship
CREATE TABLE "app_provider_map" (
    "application_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "provider_role" VARCHAR(50),
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_provider_map_pkey" PRIMARY KEY ("application_id","provider_id")
);

-- Create index on provider_id for efficient lookups
CREATE INDEX "app_provider_map_provider_id_idx" ON "app_provider_map"("provider_id");

-- Add foreign key constraints
ALTER TABLE "app_provider_map" ADD CONSTRAINT "app_provider_map_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app_provider_map" ADD CONSTRAINT "app_provider_map_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing provider_id data from applications table to app_provider_map
INSERT INTO "app_provider_map" ("application_id", "provider_id", "added_at")
SELECT "id", "provider_id", NOW()
FROM "applications"
WHERE "provider_id" IS NOT NULL;

-- Drop the old provider_id foreign key and column
ALTER TABLE "applications" DROP CONSTRAINT "applications_provider_id_fkey";
ALTER TABLE "applications" DROP COLUMN "provider_id";

-- Drop the old index
DROP INDEX IF EXISTS "idx_applications_provider";
