-- Social publishing & analytics pipeline (social/ in the repo).
--
-- Every table here is written only by the GitHub Actions jobs and the
-- /api/meta-webhook function using the server-side secret key. RLS is on
-- with no policies and table privileges are revoked from anon and
-- authenticated, so the browser can never read or write any of it.
--
-- Idempotency rule: a (post_id, platform) pair is published at most once.
-- social_claim_publication() is the only way a run takes a pair, and it does
-- so in a single INSERT ... ON CONFLICT statement, so two overlapping runs
-- can never both claim the same pair.

-- ---------------------------------------------------------------------------
-- Posts (mirror of social/posts/*.md, refreshed on every publisher run)
-- ---------------------------------------------------------------------------
CREATE TABLE public.social_posts (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  file_path text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'approved', 'cancelled')),
  scheduled_at timestamptz NOT NULL,
  platforms text[] NOT NULL,
  utm_campaign text,
  content_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Publications: one row per (post, platform)
-- ---------------------------------------------------------------------------
CREATE TABLE public.social_publications (
  id bigserial PRIMARY KEY,
  post_id text NOT NULL REFERENCES public.social_posts(id) ON DELETE RESTRICT,
  platform text NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'gbp')),
  -- skipped is never set by the publisher: the owner sets it by hand to stop
  -- a pair from ever being retried or published.
  state text NOT NULL CHECK (state IN ('publishing', 'published', 'failed', 'dry_run', 'skipped')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  -- Hash of the content that was published (or attempted), so edits made
  -- after publishing are detected and logged instead of re-posted.
  content_hash text,
  platform_post_id text,
  permalink text,
  published_at timestamptz,
  last_error text CHECK (last_error IS NULL OR char_length(last_error) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, platform)
);

CREATE INDEX social_publications_state_idx ON public.social_publications (state);

-- ---------------------------------------------------------------------------
-- Inbound comments, mentions, messages and reviews (no auto-replies)
-- ---------------------------------------------------------------------------
CREATE TABLE public.social_events (
  id bigserial PRIMARY KEY,
  platform text NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'gbp')),
  event_type text NOT NULL CHECK (event_type IN ('comment', 'mention', 'message', 'review', 'post')),
  external_id text NOT NULL,
  author text,
  body text,
  tags text[] NOT NULL DEFAULT '{}',
  occurred_at timestamptz,
  raw jsonb,
  handled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, external_id)
);

CREATE INDEX social_events_unhandled_idx ON public.social_events (created_at DESC) WHERE NOT handled;

-- ---------------------------------------------------------------------------
-- Metrics
-- ---------------------------------------------------------------------------
CREATE TABLE public.social_metrics_daily (
  platform text NOT NULL,
  metric text NOT NULL,
  date date NOT NULL,
  value numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (platform, metric, date)
);

CREATE TABLE public.social_post_metrics (
  platform text NOT NULL,
  platform_post_id text NOT NULL,
  metric text NOT NULL,
  captured_on date NOT NULL,
  value numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (platform, platform_post_id, metric, captured_on)
);

-- ---------------------------------------------------------------------------
-- OAuth tokens that rotate (TikTok refresh tokens). Service role only.
-- ---------------------------------------------------------------------------
CREATE TABLE public.social_tokens (
  provider text PRIMARY KEY CHECK (provider IN ('tiktok', 'gbp', 'meta')),
  refresh_token text,
  access_token text,
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Lock everything down: no anon/authenticated access at all.
-- ---------------------------------------------------------------------------
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.social_posts, public.social_publications, public.social_events,
  public.social_metrics_daily, public.social_post_metrics, public.social_tokens
  FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.social_publications_id_seq, public.social_events_id_seq
  FROM anon, authenticated;
GRANT ALL ON public.social_posts, public.social_publications, public.social_events,
  public.social_metrics_daily, public.social_post_metrics, public.social_tokens
  TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.social_publications_id_seq, public.social_events_id_seq
  TO service_role;

-- ---------------------------------------------------------------------------
-- Atomic claim
-- ---------------------------------------------------------------------------
-- Returns the claimed row, or nothing when the pair is not claimable.
--   live run: a new pair, a dry_run pair, or a failed pair with attempts left
--             whose backoff (15 min, 30 min, ...) has elapsed. attempts += 1.
--   dry run:  a new pair only, so each pair is previewed once.
-- published, publishing (in flight or stuck) and skipped are never claimed.
CREATE FUNCTION public.social_claim_publication(
  p_post_id text,
  p_platform text,
  p_live boolean,
  p_content_hash text,
  p_max_attempts integer DEFAULT 3
)
RETURNS SETOF public.social_publications
LANGUAGE sql
SET search_path = public
AS $$
  INSERT INTO public.social_publications AS pub
    (post_id, platform, state, attempts, content_hash, updated_at)
  VALUES
    (p_post_id, p_platform, 'publishing', CASE WHEN p_live THEN 1 ELSE 0 END, p_content_hash, now())
  ON CONFLICT (post_id, platform) DO UPDATE
    SET state = 'publishing',
        attempts = pub.attempts + 1,
        content_hash = EXCLUDED.content_hash,
        last_error = NULL,
        updated_at = now()
    WHERE p_live
      AND (
        pub.state = 'dry_run'
        OR (
          pub.state = 'failed'
          AND pub.attempts < p_max_attempts
          AND pub.updated_at <= now() - (interval '15 minutes' * power(2, greatest(pub.attempts - 1, 0)))
        )
      )
  RETURNING pub.*;
$$;

REVOKE EXECUTE ON FUNCTION public.social_claim_publication(text, text, boolean, text, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.social_claim_publication(text, text, boolean, text, integer)
  TO service_role;
