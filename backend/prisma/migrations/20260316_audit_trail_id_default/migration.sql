-- Ensure audit trail IDs are generated automatically for trigger inserts
ALTER TABLE audit_trail
ALTER COLUMN id SET DEFAULT gen_random_uuid();
