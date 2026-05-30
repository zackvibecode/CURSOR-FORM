-- Robust recipient resolver for public (anonymous) form submissions.
-- Runs as SECURITY DEFINER so it bypasses RLS without needing the service-role
-- key in the deployment environment. Handles both 'single' and 'distribute'
-- (round-robin) modes and returns the assigned member's name + phone atomically.

CREATE OR REPLACE FUNCTION resolve_form_recipient(p_form_id UUID)
RETURNS TABLE(member_name TEXT, member_phone TEXT) AS $$
DECLARE
  v_mode TEXT;
  v_current_index INTEGER;
  v_members JSONB;
  v_count INTEGER;
  v_idx INTEGER;
  v_member JSONB;
BEGIN
  -- Lock the row to make round-robin safe under concurrent submissions
  SELECT distribution_mode, last_assigned_index, team_members
  INTO v_mode, v_current_index, v_members
  FROM form_team_settings
  WHERE form_id = p_form_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Keep only members that have a non-empty phone
  SELECT jsonb_agg(elem) INTO v_members
  FROM jsonb_array_elements(COALESCE(v_members, '[]'::jsonb)) elem
  WHERE COALESCE(btrim(elem->>'phone'), '') <> '';

  v_count := COALESCE(jsonb_array_length(v_members), 0);
  IF v_count = 0 THEN
    RETURN;
  END IF;

  IF v_mode = 'distribute' THEN
    v_idx := ((v_current_index % v_count) + v_count) % v_count;
    UPDATE form_team_settings
    SET last_assigned_index = (v_idx + 1) % v_count
    WHERE form_id = p_form_id;
  ELSIF v_mode = 'single' THEN
    v_idx := 0;
  ELSE
    RETURN;
  END IF;

  v_member := v_members -> v_idx;
  member_name := NULLIF(btrim(v_member->>'name'), '');
  member_phone := btrim(v_member->>'phone');
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;