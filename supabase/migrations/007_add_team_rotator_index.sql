-- Track round-robin position for team distribution
ALTER TABLE form_team_settings
  ADD COLUMN IF NOT EXISTS last_assigned_index INTEGER NOT NULL DEFAULT 0;
