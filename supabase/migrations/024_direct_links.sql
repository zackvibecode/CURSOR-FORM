-- =============================================================================
-- Migration 024: Direct Links Feature
-- Separate module from WhatsForm — visitors are redirected DIRECTLY to WhatsApp
-- without filling any form. Supports weighted round-robin team distribution,
-- full SEO, click analytics, and UTM tracking.
-- =============================================================================

-- ─── direct_links ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS direct_links (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  name                TEXT        NOT NULL DEFAULT 'Untitled Direct Link',
  slug                TEXT        NOT NULL,
  whatsapp_message    TEXT        NOT NULL DEFAULT '',
  distribution_mode   TEXT        NOT NULL DEFAULT 'single'
                                  CHECK (distribution_mode IN ('single', 'distribute', 'conditional')),

  -- Publishing
  status              TEXT        NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft', 'published')),

  -- SEO
  seo_title           TEXT,
  seo_description     TEXT,
  seo_og_title        TEXT,
  seo_og_description  TEXT,
  seo_og_image        TEXT,
  seo_indexing        TEXT        NOT NULL DEFAULT 'index'
                                  CHECK (seo_indexing IN ('index', 'noindex')),
  canonical_url       TEXT,

  -- Aggregate counters (fast-read, denormalised)
  total_clicks        INTEGER     NOT NULL DEFAULT 0,
  total_redirects     INTEGER     NOT NULL DEFAULT 0,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Slug must be unique across all direct links
CREATE UNIQUE INDEX IF NOT EXISTS direct_links_slug_key ON direct_links(slug);
CREATE        INDEX IF NOT EXISTS direct_links_user_id_idx ON direct_links(user_id);
CREATE        INDEX IF NOT EXISTS direct_links_status_idx  ON direct_links(status);

-- updated_at trigger
DROP TRIGGER IF EXISTS set_direct_links_updated_at ON direct_links;
CREATE TRIGGER set_direct_links_updated_at
  BEFORE UPDATE ON direct_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─── direct_link_team_members ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS direct_link_team_members (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  direct_link_id   UUID        NOT NULL REFERENCES direct_links(id) ON DELETE CASCADE,

  name             TEXT        NOT NULL DEFAULT '',
  country_code     TEXT        NOT NULL DEFAULT '60',
  phone_number     TEXT        NOT NULL DEFAULT '',   -- without country code, without leading 0
  weight           INTEGER     NOT NULL DEFAULT 1 CHECK (weight >= 1),
  active           BOOLEAN     NOT NULL DEFAULT true,
  position         INTEGER     NOT NULL DEFAULT 0,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS direct_link_team_members_link_id_idx
  ON direct_link_team_members(direct_link_id);
CREATE INDEX IF NOT EXISTS direct_link_team_members_active_idx
  ON direct_link_team_members(direct_link_id, active);


-- ─── direct_link_distribution_state ─────────────────────────────────────────
-- Stores the current weighted round-robin cursor.
-- current_slot ∈ [0, total_weight).  Incremented atomically on each real click.
CREATE TABLE IF NOT EXISTS direct_link_distribution_state (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  direct_link_id   UUID        NOT NULL REFERENCES direct_links(id) ON DELETE CASCADE,
  current_slot     INTEGER     NOT NULL DEFAULT 0,
  total_weight     INTEGER     NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS direct_link_distribution_state_link_id_key
  ON direct_link_distribution_state(direct_link_id);


-- ─── direct_link_clicks ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS direct_link_clicks (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  direct_link_id      UUID        NOT NULL REFERENCES direct_links(id) ON DELETE CASCADE,

  -- Assigned member snapshot (denormalised so deleting a member keeps history)
  assigned_member_id  UUID        REFERENCES direct_link_team_members(id) ON DELETE SET NULL,
  assigned_name       TEXT,
  assigned_phone      TEXT,       -- full normalised phone e.g. "60123456789"

  distribution_mode   TEXT,

  -- Attribution
  referrer            TEXT,
  utm_source          TEXT,
  utm_medium          TEXT,
  utm_campaign        TEXT,
  utm_content         TEXT,
  utm_term            TEXT,
  user_agent          TEXT,

  -- Outcome
  redirect_status     TEXT        NOT NULL DEFAULT 'ok', -- 'ok' | 'no_members' | 'draft' | 'not_found'
  is_bot              BOOLEAN     NOT NULL DEFAULT false,

  clicked_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS direct_link_clicks_link_id_idx
  ON direct_link_clicks(direct_link_id);
CREATE INDEX IF NOT EXISTS direct_link_clicks_clicked_at_idx
  ON direct_link_clicks(direct_link_id, clicked_at DESC);


-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE direct_links                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_link_team_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_link_distribution_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_link_clicks            ENABLE ROW LEVEL SECURITY;

-- ── direct_links ──
DROP POLICY IF EXISTS "Users can view their own direct links"     ON direct_links;
DROP POLICY IF EXISTS "Public can view published direct links"    ON direct_links;
DROP POLICY IF EXISTS "Users can insert their own direct links"   ON direct_links;
DROP POLICY IF EXISTS "Users can update their own direct links"   ON direct_links;
DROP POLICY IF EXISTS "Users can delete their own direct links"   ON direct_links;

CREATE POLICY "Users can view their own direct links"
  ON direct_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view published direct links"
  ON direct_links FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can insert their own direct links"
  ON direct_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own direct links"
  ON direct_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own direct links"
  ON direct_links FOR DELETE
  USING (auth.uid() = user_id);

-- ── direct_link_team_members ──
DROP POLICY IF EXISTS "Users can manage team members of their own direct links" ON direct_link_team_members;
DROP POLICY IF EXISTS "Public can view members of published direct links"        ON direct_link_team_members;

CREATE POLICY "Users can manage team members of their own direct links"
  ON direct_link_team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM direct_links dl
      WHERE dl.id = direct_link_team_members.direct_link_id
        AND dl.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view members of published direct links"
  ON direct_link_team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM direct_links dl
      WHERE dl.id = direct_link_team_members.direct_link_id
        AND dl.status = 'published'
    )
  );

-- ── direct_link_distribution_state ──
DROP POLICY IF EXISTS "Users can manage distribution state of their own links" ON direct_link_distribution_state;

CREATE POLICY "Users can manage distribution state of their own links"
  ON direct_link_distribution_state FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM direct_links dl
      WHERE dl.id = direct_link_distribution_state.direct_link_id
        AND dl.user_id = auth.uid()
    )
  );

-- ── direct_link_clicks ──
DROP POLICY IF EXISTS "Users can view clicks on their own direct links" ON direct_link_clicks;

CREATE POLICY "Users can view clicks on their own direct links"
  ON direct_link_clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM direct_links dl
      WHERE dl.id = direct_link_clicks.direct_link_id
        AND dl.user_id = auth.uid()
    )
  );

-- Service role / SECURITY DEFINER functions insert clicks — no anon insert needed.


-- =============================================================================
-- Weighted Round-Robin RPC
-- =============================================================================
-- Atomically claims the next team member slot based on weights.
-- Returns one row: (member_id, member_name, phone_full).
-- Must be called inside a transaction by the redirect API.
-- Bot protection: the API must NOT call this for bot requests.
-- =============================================================================

CREATE OR REPLACE FUNCTION claim_direct_link_slot(p_direct_link_id UUID)
RETURNS TABLE(
  out_member_id   UUID,
  out_member_name TEXT,
  out_phone_full  TEXT    -- normalised e.g. "60123456789"
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_slot       INTEGER;
  v_total      INTEGER;
  v_cumulative INTEGER := 0;
  r            RECORD;
BEGIN
  -- Lock the state row to prevent concurrent slot collisions
  SELECT current_slot, total_weight
  INTO   v_slot, v_total
  FROM   direct_link_distribution_state
  WHERE  direct_link_id = p_direct_link_id
  FOR UPDATE;

  IF NOT FOUND OR v_total = 0 THEN
    RETURN;   -- No distribution state or no active weight → caller handles this
  END IF;

  -- Guard: if slot >= total (can happen after weight reduction), reset
  IF v_slot >= v_total THEN
    v_slot := 0;
  END IF;

  -- Walk active members in position order to find the owner of v_slot
  FOR r IN
    SELECT
      m.id,
      m.name,
      m.country_code || m.phone_number AS phone_full,
      m.weight
    FROM   direct_link_team_members m
    WHERE  m.direct_link_id = p_direct_link_id
      AND  m.active = true
    ORDER  BY m.position ASC, m.created_at ASC
  LOOP
    v_cumulative := v_cumulative + r.weight;
    IF v_slot < v_cumulative THEN
      -- Advance slot and exit loop
      UPDATE direct_link_distribution_state
      SET    current_slot = (v_slot + 1) % v_total,
             updated_at   = now()
      WHERE  direct_link_id = p_direct_link_id;

      out_member_id   := r.id;
      out_member_name := r.name;
      out_phone_full  := r.phone_full;
      RETURN NEXT;
      RETURN;
    END IF;
  END LOOP;

  -- Fallback: slot mapping failed (data inconsistency), reset and pick first
  UPDATE direct_link_distribution_state
  SET    current_slot = 1 % GREATEST(v_total, 1),
         updated_at   = now()
  WHERE  direct_link_id = p_direct_link_id;

  SELECT m.id, m.name, m.country_code || m.phone_number AS phone_full
  INTO   out_member_id, out_member_name, out_phone_full
  FROM   direct_link_team_members m
  WHERE  m.direct_link_id = p_direct_link_id AND m.active = true
  ORDER  BY m.position ASC, m.created_at ASC
  LIMIT  1;

  IF out_member_id IS NOT NULL THEN
    RETURN NEXT;
  END IF;
END;
$$;

-- Grant execute to anon + authenticated (called via server-side fetch which uses
-- the service role key, but grant broadly for safety)
GRANT EXECUTE ON FUNCTION claim_direct_link_slot(UUID) TO anon, authenticated, service_role;


-- =============================================================================
-- Atomic click counter increment (avoids race conditions on total_clicks)
-- =============================================================================
CREATE OR REPLACE FUNCTION increment_direct_link_clicks(p_id UUID)
RETURNS void
LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE direct_links
  SET total_clicks   = total_clicks + 1,
      total_redirects = total_redirects + 1
  WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION increment_direct_link_clicks(UUID) TO anon, authenticated, service_role;
