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
