-- Subscription expiry support (for in-app renewal banner)
-- expires_at already exists in schema; this migration only adds an index
-- to make expiry lookups fast.
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at
  ON public.subscriptions(expires_at)
  WHERE status = 'active' AND plan != 'free';
