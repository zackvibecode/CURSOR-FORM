-- ============================================
-- ZAQONE.FORM Database Setup
-- Paste this in Supabase SQL Editor and Run
-- ============================================

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Forms table
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  whatsapp_number TEXT DEFAULT '',
  cta_text TEXT DEFAULT 'Submit via WhatsApp',
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- 3. Form fields table
CREATE TABLE IF NOT EXISTS form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  placeholder TEXT,
  required BOOLEAN DEFAULT FALSE,
  options JSONB DEFAULT '[]',
  order_index INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
  data JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_hash TEXT
);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own forms" ON forms;
DROP POLICY IF EXISTS "Users can insert own forms" ON forms;
DROP POLICY IF EXISTS "Users can update own forms" ON forms;
DROP POLICY IF EXISTS "Users can delete own forms" ON forms;
DROP POLICY IF EXISTS "Public can view published forms" ON forms;
DROP POLICY IF EXISTS "Users can view fields of own forms" ON form_fields;
DROP POLICY IF EXISTS "Users can insert fields of own forms" ON form_fields;
DROP POLICY IF EXISTS "Users can update fields of own forms" ON form_fields;
DROP POLICY IF EXISTS "Users can delete fields of own forms" ON form_fields;
DROP POLICY IF EXISTS "Public can view fields of published forms" ON form_fields;
DROP POLICY IF EXISTS "Users can view submissions of own forms" ON submissions;
DROP POLICY IF EXISTS "Anyone can submit to published forms" ON submissions;

-- Profiles: user can read own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Profiles: user can update own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Profiles: insert on signup
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Forms: user can CRUD own forms
CREATE POLICY "Users can view own forms" ON forms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own forms" ON forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own forms" ON forms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own forms" ON forms
  FOR DELETE USING (auth.uid() = user_id);

-- Forms: public can view published forms by slug
CREATE POLICY "Public can view published forms" ON forms
  FOR SELECT USING (status = 'published');

-- Form fields: user can CRUD fields of own forms
CREATE POLICY "Users can view fields of own forms" ON form_fields
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM forms WHERE forms.id = form_fields.form_id AND forms.user_id = auth.uid())
  );

CREATE POLICY "Users can insert fields of own forms" ON form_fields
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM forms WHERE forms.id = form_fields.form_id AND forms.user_id = auth.uid())
  );

CREATE POLICY "Users can update fields of own forms" ON form_fields
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM forms WHERE forms.id = form_fields.form_id AND forms.user_id = auth.uid())
  );

CREATE POLICY "Users can delete fields of own forms" ON form_fields
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM forms WHERE forms.id = form_fields.form_id AND forms.user_id = auth.uid())
  );

-- Form fields: public can view fields of published forms
CREATE POLICY "Public can view fields of published forms" ON form_fields
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM forms WHERE forms.id = form_fields.form_id AND forms.status = 'published')
  );

-- Submissions: user can view submissions of own forms
CREATE POLICY "Users can view submissions of own forms" ON submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM forms WHERE forms.id = submissions.form_id AND forms.user_id = auth.uid())
  );

-- Submissions: anyone can insert (public form submission)
CREATE POLICY "Anyone can submit to published forms" ON submissions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM forms WHERE forms.id = submissions.form_id AND forms.status = 'published')
  );

-- ============================================
-- Triggers & Functions
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on forms
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_forms_updated_at ON forms;
CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions(form_id);
