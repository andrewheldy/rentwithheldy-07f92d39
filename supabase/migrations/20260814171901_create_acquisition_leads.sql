-- Unified demand + supply lead model for the public acquisition funnels.
-- The shared shape keeps driver demand and owner-supplied vehicles easy to
-- compare without forcing either questionnaire into an unstructured notes blob.
CREATE TABLE public.acquisition_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type text NOT NULL CHECK (lead_type IN ('driver_demand', 'vehicle_supply')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  first_name text NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 80),
  last_name text NOT NULL CHECK (char_length(last_name) BETWEEN 1 AND 80),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 24),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  zip_code text NOT NULL CHECK (zip_code ~ '^\d{5}(-\d{4})?$'),
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'matched', 'closed')),

  -- Attribution shared by both funnels.
  source text NOT NULL DEFAULT 'direct',
  campaign text,
  referrer text,
  landing_page text NOT NULL,
  user_agent text,

  -- Driver demand fields.
  platforms text[] NOT NULL DEFAULT '{}',
  platform_subtypes text[] NOT NULL DEFAULT '{}',
  vehicle_category text CHECK (vehicle_category IS NULL OR vehicle_category IN ('everyday', 'xl', 'premium', 'large_passenger', 'delivery', 'not_sure')),
  need_timeline text CHECK (need_timeline IS NULL OR need_timeline IN ('asap', 'within_7_days', 'within_30_days', 'one_to_three_months', 'exploring')),
  weekly_budget_min integer,
  weekly_budget_max integer,
  driver_status text CHECK (driver_status IS NULL OR driver_status IN ('currently_driving', 'approved_need_vehicle', 'application_pending', 'not_yet', 'not_applicable')),
  current_platforms text[] NOT NULL DEFAULT '{}',
  expected_duration text CHECK (expected_duration IS NULL OR expected_duration IN ('few_weeks', 'one_to_three_months', 'three_to_six_months', 'six_to_twelve_months', 'long_term', 'not_sure')),
  empower_status text CHECK (empower_status IS NULL OR empower_status IN ('yes', 'application_pending', 'no')),
  empower_referral_clicked boolean NOT NULL DEFAULT false,
  lead_priority text CHECK (lead_priority IN ('hot', 'warm', 'future')),

  -- Vehicle supply fields.
  vehicle_year integer CHECK (vehicle_year BETWEEN 1980 AND 2100),
  vehicle_make text,
  vehicle_model text,
  vehicle_trim text,
  vehicle_type text CHECK (vehicle_type IS NULL OR vehicle_type IN ('sedan', 'suv_crossover', 'minivan', 'passenger_van', 'pickup', 'premium_luxury', 'other')),
  passenger_capacity text CHECK (passenger_capacity IS NULL OR passenger_capacity IN ('7_8', '9_11', '12_14', '15_plus', 'other')),
  mileage integer CHECK (mileage BETWEEN 0 AND 1000000),
  vehicle_condition text CHECK (vehicle_condition IS NULL OR vehicle_condition IN ('excellent', 'good', 'fair', 'needs_work')),
  ownership_status text CHECK (ownership_status IS NULL OR ownership_status IN ('owned_outright', 'financed', 'leased', 'other_unsure')),
  vehicle_availability text CHECK (vehicle_availability IS NULL OR vehicle_availability IN ('full_time', 'most_of_month', 'weekends', 'part_time', 'seasonal', 'not_sure')),
  vin text CHECK (vin IS NULL OR vin ~ '^[A-HJ-NPR-Z0-9]{17}$'),
  photo_references text[] NOT NULL DEFAULT '{}',
  strategic_interest boolean NOT NULL DEFAULT false,

  CONSTRAINT driver_demand_required_fields CHECK (
    lead_type <> 'driver_demand' OR (
      cardinality(platforms) > 0
      AND vehicle_category IS NOT NULL
      AND need_timeline IS NOT NULL
      AND driver_status IS NOT NULL
      AND expected_duration IS NOT NULL
      AND lead_priority IS NOT NULL
    )
  ),
  CONSTRAINT vehicle_supply_required_fields CHECK (
    lead_type <> 'vehicle_supply' OR (
      vehicle_year IS NOT NULL
      AND vehicle_make IS NOT NULL
      AND vehicle_model IS NOT NULL
      AND vehicle_type IS NOT NULL
      AND mileage IS NOT NULL
      AND vehicle_condition IS NOT NULL
      AND ownership_status IS NOT NULL
      AND vehicle_availability IS NOT NULL
    )
  )
);

COMMENT ON TABLE public.acquisition_leads IS
  'Structured driver-demand and vehicle-supply leads from public questionnaires.';
COMMENT ON COLUMN public.acquisition_leads.vin IS
  'Optional non-public VIN. Never include this value in client analytics.';
COMMENT ON COLUMN public.acquisition_leads.strategic_interest IS
  'Internal flag currently set for 12-14 passenger van submissions.';

-- Submissions go through the server-validated endpoint with a backend-only
-- secret key. Public clients receive no direct insert grant, so they cannot
-- bypass spam controls, derived priority, status defaults, or validation.
REVOKE ALL ON public.acquisition_leads FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acquisition_leads TO service_role;
GRANT SELECT, UPDATE, DELETE ON public.acquisition_leads TO authenticated;

ALTER TABLE public.acquisition_leads ENABLE ROW LEVEL SECURITY;

-- The pre-existing role helper is SECURITY DEFINER. Keep it callable only by
-- roles that need it for admin RLS policies rather than by PUBLIC/anon.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE POLICY "Admins can view acquisition leads"
  ON public.acquisition_leads FOR SELECT
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update acquisition leads"
  ON public.acquisition_leads FOR UPDATE
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'::app_role))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete acquisition leads"
  ON public.acquisition_leads FOR DELETE
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE INDEX idx_acquisition_leads_created_at
  ON public.acquisition_leads (created_at DESC);
CREATE INDEX idx_acquisition_leads_type_status
  ON public.acquisition_leads (lead_type, status);
CREATE INDEX idx_acquisition_leads_driver_demand
  ON public.acquisition_leads (vehicle_category, need_timeline, lead_priority)
  WHERE lead_type = 'driver_demand';
CREATE INDEX idx_acquisition_leads_vehicle_supply
  ON public.acquisition_leads (vehicle_type, vehicle_year, vehicle_availability)
  WHERE lead_type = 'vehicle_supply';
CREATE INDEX idx_acquisition_leads_zip_code
  ON public.acquisition_leads (zip_code);
CREATE INDEX idx_acquisition_leads_platforms
  ON public.acquisition_leads USING gin (platforms)
  WHERE lead_type = 'driver_demand';
CREATE INDEX idx_acquisition_leads_platform_subtypes
  ON public.acquisition_leads USING gin (platform_subtypes)
  WHERE lead_type = 'driver_demand';

CREATE TRIGGER update_acquisition_leads_updated_at
  BEFORE UPDATE ON public.acquisition_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
