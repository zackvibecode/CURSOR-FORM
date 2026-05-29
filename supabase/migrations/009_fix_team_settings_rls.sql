-- Fix RLS policies for form_team_settings to ensure proper access
-- Drop existing policies and recreate with simpler, more reliable checks

DROP POLICY IF EXISTS "Users can view their own form team settings" ON form_team_settings;
DROP POLICY IF EXISTS "Users can insert their own form team settings" ON form_team_settings;
DROP POLICY IF EXISTS "Users can update their own form team settings" ON form_team_settings;
DROP POLICY IF EXISTS "Users can delete their own form team settings" ON form_team_settings;

-- Helper function to check if user owns a form (more reliable than inline subquery)
CREATE OR REPLACE FUNCTION user_owns_form(p_form_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM forms WHERE id = p_form_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate policies using the helper function
CREATE POLICY "Users can view own form team settings"
  ON form_team_settings FOR SELECT
  USING (user_owns_form(form_id, auth.uid()));

CREATE POLICY "Users can insert own form team settings"
  ON form_team_settings FOR INSERT
  WITH CHECK (user_owns_form(form_id, auth.uid()));

CREATE POLICY "Users can update own form team settings"
  ON form_team_settings FOR UPDATE
  USING (user_owns_form(form_id, auth.uid()))
  WITH CHECK (user_owns_form(form_id, auth.uid()));

CREATE POLICY "Users can delete own form team settings"
  ON form_team_settings FOR DELETE
  USING (user_owns_form(form_id, auth.uid()));

-- Ensure unique constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'form_team_settings_form_id_key'
  ) THEN
    CREATE UNIQUE INDEX form_team_settings_form_id_key ON form_team_settings(form_id);
  END IF;
END $$;
