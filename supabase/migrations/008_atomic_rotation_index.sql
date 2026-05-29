-- Atomic round-robin index claim to prevent race conditions under concurrent submissions.
-- Uses SELECT FOR UPDATE to lock the row, compute the current slot, then increment.

CREATE OR REPLACE FUNCTION claim_next_rotation_index(
  p_form_id UUID,
  p_member_count INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_current_index INTEGER;
  v_claimed_index INTEGER;
BEGIN
  IF p_member_count <= 0 THEN
    RAISE EXCEPTION 'Member count must be positive';
  END IF;

  -- Lock the row and read current index
  SELECT last_assigned_index INTO v_current_index
  FROM form_team_settings
  WHERE form_id = p_form_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Compute which member gets this submission
  v_claimed_index := ((v_current_index % p_member_count) + p_member_count) % p_member_count;

  -- Advance the index for the next caller
  UPDATE form_team_settings
  SET last_assigned_index = (v_claimed_index + 1) % p_member_count
  WHERE form_id = p_form_id;

  RETURN v_claimed_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
