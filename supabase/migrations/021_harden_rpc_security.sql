-- Harden team rotator RPC: published forms only, callable via service_role (server) only.

CREATE OR REPLACE FUNCTION public.resolve_form_recipient(p_form_id UUID)
RETURNS TABLE(member_name TEXT, member_phone TEXT) AS $$
DECLARE
  v_mode TEXT;
  v_current_index INTEGER;
  v_members JSONB;
  v_count INTEGER;
  v_idx INTEGER;
  v_member JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM forms WHERE id = p_form_id AND status = 'published'
  ) THEN
    RETURN;
  END IF;

  SELECT distribution_mode, last_assigned_index, team_members
  INTO v_mode, v_current_index, v_members
  FROM form_team_settings
  WHERE form_id = p_form_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT jsonb_agg(elem ORDER BY ord) INTO v_members
  FROM jsonb_array_elements(COALESCE(v_members, '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)
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

REVOKE ALL ON FUNCTION public.resolve_form_recipient(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_form_recipient(UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_form_recipient(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.claim_next_rotation_index(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_next_rotation_index(UUID, INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_rotation_index(UUID, INTEGER) TO service_role;
