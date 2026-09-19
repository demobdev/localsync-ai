DO $$ BEGIN
  CREATE TYPE submission_campaign_status AS ENUM (
    'draft', 'active', 'paused', 'completed', 'canceled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE submission_target_status AS ENUM (
    'planned',
    'ready_for_review',
    'approved',
    'queued',
    'submitting',
    'submitted',
    'verification_required',
    'live',
    'verified',
    'monitoring',
    'blocked',
    'failed',
    'skipped'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS submission_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  status submission_campaign_status NOT NULL DEFAULT 'active',
  profile_snapshot jsonb NOT NULL,
  target_count integer NOT NULL DEFAULT 0,
  created_by_user_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS submission_campaigns_location_id_idx
  ON submission_campaigns (location_id);
CREATE INDEX IF NOT EXISTS submission_campaigns_status_idx
  ON submission_campaigns (status);
CREATE INDEX IF NOT EXISTS submission_campaigns_created_at_idx
  ON submission_campaigns (created_at);

CREATE TABLE IF NOT EXISTS submission_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES submission_campaigns(id) ON DELETE CASCADE,
  location_publisher_id uuid NOT NULL REFERENCES location_publishers(id) ON DELETE CASCADE,
  publisher_id uuid NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  delivery_rail publisher_delivery_rail NOT NULL,
  status submission_target_status NOT NULL DEFAULT 'planned',
  status_detail text NOT NULL,
  next_action text NOT NULL,
  customer_action_required boolean NOT NULL DEFAULT false,
  attempt_count integer NOT NULL DEFAULT 0,
  last_error text,
  approved_at timestamptz,
  submitted_at timestamptz,
  live_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS submission_targets_campaign_id_idx
  ON submission_targets (campaign_id);
CREATE INDEX IF NOT EXISTS submission_targets_publisher_id_idx
  ON submission_targets (publisher_id);
CREATE INDEX IF NOT EXISTS submission_targets_status_idx
  ON submission_targets (status);
CREATE UNIQUE INDEX IF NOT EXISTS submission_targets_campaign_publisher_idx
  ON submission_targets (campaign_id, publisher_id);

CREATE TABLE IF NOT EXISTS submission_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES submission_campaigns(id) ON DELETE CASCADE,
  target_id uuid REFERENCES submission_targets(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_status submission_target_status,
  to_status submission_target_status,
  message text NOT NULL,
  evidence_url text,
  metadata jsonb,
  actor_user_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS submission_events_campaign_id_idx
  ON submission_events (campaign_id);
CREATE INDEX IF NOT EXISTS submission_events_target_id_idx
  ON submission_events (target_id);
CREATE INDEX IF NOT EXISTS submission_events_created_at_idx
  ON submission_events (created_at);
