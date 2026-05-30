-- Track which team member each submission was assigned to (round-robin / rotator)
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS assigned_name TEXT,
  ADD COLUMN IF NOT EXISTS assigned_phone TEXT;

-- Index to filter/group submissions by assigned member
CREATE INDEX IF NOT EXISTS submissions_assigned_phone_idx
  ON submissions(assigned_phone);