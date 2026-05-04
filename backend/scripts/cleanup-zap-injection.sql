-- AGENT-DECISION: back — T-099 ZAP injection cleanup script
-- This script removes data_objects records that contain ZAP fuzzing payloads or obvious injection patterns
-- Run with: psql -U arkepm -d arkepm -f backend/scripts/cleanup-zap-injection.sql

-- Identify records to delete (for audit purposes before deletion)
SELECT id, name, created_at FROM data_objects
WHERE 
  -- ZAP scan marker records
  name ILIKE 'ZAP%'
  -- Command injection patterns (shell metacharacters)
  OR name ~ '[;<>|`\\]'
  -- XML/SSTI markers
  OR name ~ '\]\]>'
  -- Control characters
  OR name ~ '[\x00-\x1F]'
ORDER BY created_at DESC;

-- Delete the injected records
DELETE FROM data_objects
WHERE 
  name ILIKE 'ZAP%'
  OR name ~ '[;<>|`\\]'
  OR name ~ '\]\]>'
  OR name ~ '[\x00-\x1F]';

-- Verify cleanup
SELECT COUNT(*) as remaining_suspicious_records FROM data_objects
WHERE 
  name ILIKE 'ZAP%'
  OR name ~ '[;<>|`\\]'
  OR name ~ '\]\]>'
  OR name ~ '[\x00-\x1F]';
