-- Form team settings for distribution/rotation of submissions

CREATE TABLE IF NOT EXISTS form_team_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  distribution_mode TEXT NOT NULL DEFAULT 'single' CHECK (distribution_mode IN ('single', 'distribute', 'conditional')),
  team_members JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one team setting per form
CREATE UNIQUE INDEX IF NOT EXISTS form_team_settings_form_id_key ON form_team_settings(form_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_form_team_settings_updated_at
  BEFORE UPDATE ON form_team_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE form_team_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own form team settings"
  ON form_team_settings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM forms WHERE forms.id = form_team_settings.form_id AND forms.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own form team settings"
  ON form_team_settings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM forms WHERE forms.id = form_team_settings.form_id AND forms.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own form team settings"
  ON form_team_settings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM forms WHERE forms.id = form_team_settings.form_id AND forms.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own form team settings"
  ON form_team_settings FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM forms WHERE forms.id = form_team_settings.form_id AND forms.user_id = auth.uid()
  ));
