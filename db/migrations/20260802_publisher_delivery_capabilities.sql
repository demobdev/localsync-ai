DO $$ BEGIN
  CREATE TYPE publisher_approval_status AS ENUM (
    'not_required', 'not_applied', 'pending', 'sandbox', 'production', 'unavailable'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE publisher_cost_cadence AS ENUM (
    'none', 'one_time', 'monthly', 'annual', 'quote'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE publisher_delivery_rail AS ENUM (
    'first_party_direct',
    'approval_gated_direct',
    'partner_network',
    'managed_submission',
    'customer_action',
    'monitor_only'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE publisher_verification_owner AS ENUM (
    'localsync', 'customer', 'partner', 'publisher'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

ALTER TABLE publishers
  ADD COLUMN IF NOT EXISTS delivery_rail publisher_delivery_rail NOT NULL DEFAULT 'monitor_only',
  ADD COLUMN IF NOT EXISTS approval_status publisher_approval_status NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS verification_owner publisher_verification_owner NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS cost_cadence publisher_cost_cadence NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS estimated_cost_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_notes text,
  ADD COLUMN IF NOT EXISTS ownership_persists boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS supported_operations jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS evidence_requirement text;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS publishers_delivery_rail_idx
  ON publishers (delivery_rail);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS publishers_approval_status_idx
  ON publishers (approval_status);
