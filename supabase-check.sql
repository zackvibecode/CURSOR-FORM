-- ============================================
-- ZAQONE.FORM — CHECK ONLY (safe to run anytime)
-- Run this in Supabase SQL Editor to verify setup
-- ============================================

SELECT 'profiles' AS table_name, COUNT(*) AS row_count FROM profiles
UNION ALL
SELECT 'forms', COUNT(*) FROM forms
UNION ALL
SELECT 'form_fields', COUNT(*) FROM form_fields
UNION ALL
SELECT 'submissions', COUNT(*) FROM submissions;

-- Expected: 4 rows returned, no error = database OK
