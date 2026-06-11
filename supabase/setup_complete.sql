-- FORM.ZAQONE.COM full database setup
-- Project: svnwvkiahtlhahkobtcd


-- ========== 001_initial.sql ==========

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Forms table
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  whatsapp_number TEXT NOT NULL DEFAULT '',
  cta_text TEXT NOT NULL DEFAULT 'Submit on WhatsApp',
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS forms_user_id_idx ON forms(user_id);
CREATE INDEX IF NOT EXISTS forms_slug_idx ON forms(slug);
CREATE INDEX IF NOT EXISTS forms_status_idx ON forms(status);

-- Form fields table
CREATE TABLE IF NOT EXISTS form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  placeholder TEXT DEFAULT '',
  required BOOLEAN DEFAULT FALSE,
  options JSONB DEFAULT '[]'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS form_fields_form_id_idx ON form_fields(form_id);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS submissions_form_id_idx ON submissions(form_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS forms_updated_at ON forms;
CREATE TRIGGER forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Forms policies
CREATE POLICY "Users can view own forms"
  ON forms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published forms"
  ON forms FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can insert own forms"
  ON forms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own forms"
  ON forms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own forms"
  ON forms FOR DELETE
  USING (auth.uid() = user_id);

-- Form fields policies
CREATE POLICY "Users can manage fields of own forms"
  ON form_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = form_fields.form_id
      AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view fields of published forms"
  ON form_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = form_fields.form_id
      AND forms.status = 'published'
    )
  );

-- Submissions policies
CREATE POLICY "Users can view submissions of own forms"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = submissions.form_id
      AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert submissions to published forms"
  ON submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = submissions.form_id
      AND forms.status = 'published'
    )
  );


-- ========== 005_create_user_settings.sql ==========

-- User settings table
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  business_name text,
  whatsapp_number text,
  default_message text,
  theme_color text default '#25D366',
  redirect_after_submit text,
  email_notifications boolean default true,
  whatsapp_notifications boolean default true,
  submission_alerts boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create index if not exists idx_user_settings_user_id on public.user_settings(user_id);

alter table public.user_settings enable row level security;

drop policy if exists "Users can view own settings" on public.user_settings;
create policy "Users can view own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own settings" on public.user_settings;
create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own settings" on public.user_settings;
create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own settings" on public.user_settings;
create policy "Users can delete own settings"
  on public.user_settings for delete
  using (auth.uid() = user_id);


-- ========== 006_create_form_team_settings.sql ==========

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


-- ========== 007_add_team_rotator_index.sql ==========

-- Track round-robin position for team distribution
ALTER TABLE form_team_settings
  ADD COLUMN IF NOT EXISTS last_assigned_index INTEGER NOT NULL DEFAULT 0;


-- ========== 008_atomic_rotation_index.sql ==========

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


-- ========== 009_fix_team_settings_rls.sql ==========

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


-- ========== 010_subscriptions.sql ==========

-- Subscriptions table for tracking user plans
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'business')) DEFAULT 'free',
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'expired', 'cancelled')) DEFAULT 'active',
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')) DEFAULT 'monthly',
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT subscriptions_user_id_key UNIQUE (user_id)
);

CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, billing_cycle, started_at)
  VALUES (NEW.id, 'free', 'active', 'monthly', now())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block user signup if subscription creation fails
  RAISE WARNING 'Failed to create subscription for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_subscription();

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ========== 011_fix_subscription_trigger.sql ==========

-- Fix: "Database error saving new user" caused by the subscription trigger
-- The previous trigger function referenced an unqualified table name and had
-- no error guard, so any failure blocked the whole auth.users signup.
-- This migration replaces it with a hardened version.

CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, billing_cycle, started_at)
  VALUES (NEW.id, 'free', 'active', 'monthly', now())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block user signup if subscription creation fails
  RAISE WARNING 'Failed to create subscription for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger to ensure it points at the updated function
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_subscription();

-- Backfill: give every existing user a free subscription if they don't have one
INSERT INTO public.subscriptions (user_id, plan, status, billing_cycle, started_at)
SELECT u.id, 'free', 'active', 'monthly', now()
FROM auth.users u
LEFT JOIN public.subscriptions s ON s.user_id = u.id
WHERE s.id IS NULL;

-- ========== 012_submission_assignee.sql ==========

-- Track which team member each submission was assigned to (round-robin / rotator)
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS assigned_name TEXT,
  ADD COLUMN IF NOT EXISTS assigned_phone TEXT;

-- Index to filter/group submissions by assigned member
CREATE INDEX IF NOT EXISTS submissions_assigned_phone_idx
  ON submissions(assigned_phone);

-- ========== 013_resolve_form_recipient.sql ==========

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

  -- Keep members with phones, preserve original list order
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

-- ========== 014_form_images_storage.sql ==========

-- Storage bucket for form display images (owner-uploaded banners / package images)
-- Run this in the Supabase SQL Editor.

-- 1. Create a public bucket for form images
INSERT INTO storage.buckets (id, name, public)
VALUES ('form-images', 'form-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Anyone can read (public form images need to render for anonymous visitors)
CREATE POLICY "Public read for form images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'form-images');

-- 3. Authenticated users can upload
CREATE POLICY "Authenticated upload form images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'form-images');

-- 4. Authenticated users can update their uploads
CREATE POLICY "Authenticated update form images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'form-images');

-- 5. Authenticated users can delete their uploads
CREATE POLICY "Authenticated delete form images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'form-images');

-- ========== 015_fix_subscription_rls.sql ==========

-- SECURITY FIX: subscription self-upgrade vulnerability.
--
-- The previous policy:
--   CREATE POLICY "Service role can manage subscriptions"
--     ON subscriptions FOR ALL USING (true) WITH CHECK (true);
-- applied to EVERY role (including the anon/authenticated browser client),
-- so any logged-in user could run:
--   supabase.from('subscriptions').update({ plan: 'business', status: 'active' })
-- and upgrade themselves to a paid plan for free.
--
-- This migration removes that permissive policy and replaces it with tightly
-- scoped policies. The service role key still bypasses RLS entirely, so admin
-- approval of paid plans (done server-side) continues to work.

-- 1. Drop the dangerous catch-all policy.
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;

-- 2. Users may insert their OWN subscription, but only as a free/active row
--    or a pending request. They can never self-assign an active paid plan.
DROP POLICY IF EXISTS "Users insert own subscription (safe)" ON subscriptions;
CREATE POLICY "Users insert own subscription (safe)"
  ON subscriptions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      (plan = 'free' AND status = 'active')
      OR status = 'pending'
    )
  );

-- 3. Users may update their OWN subscription, but the resulting row must still
--    be either free/active (downgrade) or a pending request. Activating a paid
--    plan can only be done by the service role (admin approval).
DROP POLICY IF EXISTS "Users update own subscription (safe)" ON subscriptions;
CREATE POLICY "Users update own subscription (safe)"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      (plan = 'free' AND status = 'active')
      OR status = 'pending'
    )
  );

-- NOTE: the existing "Users can view own subscription" SELECT policy is kept.
-- No DELETE policy for users — subscriptions are never deleted from the client.


-- ========== 016_upsert_form_fields.sql ==========

-- Atomic upsert/delete for form builder field saves.
-- Verifies form ownership inside SECURITY DEFINER function.

CREATE OR REPLACE FUNCTION public.upsert_form_fields(
  p_form_id UUID,
  p_user_id UUID,
  p_fields JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  field JSONB;
  keep_ids UUID[] := ARRAY[]::UUID[];
  fid UUID;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Forbidden: caller does not match user_id';
  END IF;

  IF NOT user_owns_form(p_form_id, p_user_id) THEN
    RAISE EXCEPTION 'Forbidden: user does not own this form';
  END IF;

  FOR field IN SELECT * FROM jsonb_array_elements(COALESCE(p_fields, '[]'::jsonb))
  LOOP
    IF COALESCE(field->>'id', '') <> '' THEN
      fid := (field->>'id')::uuid;
      keep_ids := array_append(keep_ids, fid);

      INSERT INTO form_fields (id, form_id, type, label, placeholder, required, options, order_index, settings)
      VALUES (
        fid,
        p_form_id,
        field->>'type',
        field->>'label',
        COALESCE(field->>'placeholder', ''),
        COALESCE((field->>'required')::boolean, false),
        COALESCE(field->'options', '[]'::jsonb),
        COALESCE((field->>'order_index')::integer, 0),
        COALESCE(field->'settings', '{}'::jsonb)
      )
      ON CONFLICT (id) DO UPDATE SET
        type = EXCLUDED.type,
        label = EXCLUDED.label,
        placeholder = EXCLUDED.placeholder,
        required = EXCLUDED.required,
        options = EXCLUDED.options,
        order_index = EXCLUDED.order_index,
        settings = EXCLUDED.settings;
    ELSE
      INSERT INTO form_fields (form_id, type, label, placeholder, required, options, order_index, settings)
      VALUES (
        p_form_id,
        field->>'type',
        field->>'label',
        COALESCE(field->>'placeholder', ''),
        COALESCE((field->>'required')::boolean, false),
        COALESCE(field->'options', '[]'::jsonb),
        COALESCE((field->>'order_index')::integer, 0),
        COALESCE(field->'settings', '{}'::jsonb)
      );
    END IF;
  END LOOP;

  DELETE FROM form_fields
  WHERE form_id = p_form_id
    AND (cardinality(keep_ids) = 0 OR id <> ALL(keep_ids));
END;
$$;


-- ========== 017_grant_rpc_permissions.sql ==========

-- Allow client roles to call RPC functions used by the app.

GRANT EXECUTE ON FUNCTION public.resolve_form_recipient(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_next_rotation_index(UUID, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_form_fields(UUID, UUID, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_owns_form(UUID, UUID) TO authenticated, service_role;


-- ========== 018_fix_upsert_form_fields_auth.sql ==========
-- (auth.uid() check included in 016 function above)


-- ========== 019_fix_storage_rls.sql ==========

DROP POLICY IF EXISTS "Authenticated upload form images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update form images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete form images" ON storage.objects;

CREATE POLICY "Users upload own form images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'form-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users update own form images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'form-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own form images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'form-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

