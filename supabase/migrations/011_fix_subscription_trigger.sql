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