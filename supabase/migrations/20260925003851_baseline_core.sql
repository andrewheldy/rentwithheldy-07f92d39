-- Baseline for the standalone Rent With Heldy project (see
-- docs/DATABASE_MIGRATION_PLAN.md). Replaces the previous project's migration
-- history (still available in git). Retired objects are intentionally absent:
-- reservations, booking_inquiries, vehicle_categories, event_logs, and the
-- hard-coded admin seed.

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin', 'consigner', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()) OR public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

-- ---------------------------------------------------------------------------
-- Shared trigger helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Fleet
-- ---------------------------------------------------------------------------
-- `status` is the existing day-to-day availability flag used by the admin
-- vehicle tools. `fleet_status` is the lifecycle state from the migration plan
-- (section 3.2). Only active vehicles with show_on_site = true are public.
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  color text NOT NULL DEFAULT '',
  rating numeric(3,2) DEFAULT 4.9,
  trips integer DEFAULT 0,
  host_type text DEFAULT 'All-Star Host',
  daily_rate numeric(10,2) NOT NULL,
  weekday_rate numeric,
  weekend_rate numeric,
  description text NOT NULL DEFAULT '',
  features text[] DEFAULT '{}',
  vin text UNIQUE CHECK (vin IS NULL OR vin ~ '^[A-HJ-NPR-Z0-9]{17}$'),
  license_plate text,
  initial_mileage integer,
  current_mileage integer,
  last_oil_change_date date,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
  fleet_status text NOT NULL DEFAULT 'active' CHECK (fleet_status IN ('active', 'inactive', 'retired')),
  show_on_site boolean NOT NULL DEFAULT true,
  in_service_on date,
  out_of_service_on date,
  location text DEFAULT 'Main Office',
  delivery_fee_port_miami numeric(10,2),
  delivery_fee_port_everglades numeric(10,2),
  delivery_fee_mia_airport numeric(10,2),
  delivery_fee_fll_airport numeric(10,2),
  date_added timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vehicles_active_requires_vin CHECK (fleet_status <> 'active' OR vin IS NOT NULL),
  CONSTRAINT vehicles_service_dates CHECK (out_of_service_on IS NULL OR in_service_on IS NULL OR out_of_service_on >= in_service_on)
);

COMMENT ON COLUMN public.vehicles.vin IS 'Uppercase VIN; the match key for Wheelbase and Turo records. Never public.';
COMMENT ON COLUMN public.vehicles.fleet_status IS 'Lifecycle: active, inactive (not yet in service or paused), retired (sold, totaled, ended).';

-- Both platforms export some VINs in lowercase. Normalize on write so every
-- comparison is against uppercase.
CREATE OR REPLACE FUNCTION public.normalize_vehicle_identifiers()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.vin := nullif(upper(btrim(NEW.vin)), '');
  NEW.license_plate := nullif(upper(btrim(NEW.license_plate)), '');
  RETURN NEW;
END;
$$;

CREATE TRIGGER vehicles_normalize_identifiers
  BEFORE INSERT OR UPDATE OF vin, license_plate ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_vehicle_identifiers();

CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.vehicle_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_vehicle_images_vehicle ON public.vehicle_images (vehicle_id);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

-- Anonymous visitors may only read public-safe columns.
REVOKE ALL ON public.vehicles FROM anon;
GRANT SELECT (
  id, make, model, year, color, rating, trips, host_type, daily_rate,
  weekday_rate, weekend_rate, description, features, status, location,
  date_added, created_at
) ON public.vehicles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;

REVOKE ALL ON public.vehicle_images FROM anon;
GRANT SELECT ON public.vehicle_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_images TO authenticated;
GRANT ALL ON public.vehicle_images TO service_role;

CREATE POLICY "Public can view listed vehicles"
  ON public.vehicles FOR SELECT TO anon, authenticated
  USING (fleet_status = 'active' AND show_on_site);

CREATE POLICY "Admins can view all vehicles"
  ON public.vehicles FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can insert vehicles"
  ON public.vehicles FOR INSERT TO authenticated
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can update vehicles"
  ON public.vehicles FOR UPDATE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can delete vehicles"
  ON public.vehicles FOR DELETE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Anyone can view vehicle images"
  ON public.vehicle_images FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert vehicle images"
  ON public.vehicle_images FOR INSERT TO authenticated
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can update vehicle images"
  ON public.vehicle_images FOR UPDATE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can delete vehicle images"
  ON public.vehicle_images FOR DELETE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view vehicle images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle-images');

CREATE POLICY "Admins can upload vehicle images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-images' AND public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can update vehicle images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vehicle-images' AND public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can delete vehicle images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vehicle-images' AND public.has_role((select auth.uid()), 'admin'));

-- ---------------------------------------------------------------------------
-- Website leads (quote and contact forms, /admin/leads)
-- ---------------------------------------------------------------------------
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type text NOT NULL CONSTRAINT leads_form_type_check CHECK (form_type IN (
    'quick_quote', 'partner_intake', 'airport_quote', 'hotel_quote', 'contact', 'rent_to_own'
  )),
  vertical_path text,
  service_context text,
  passenger_type text,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  company text,
  claim_number text,
  location text,
  needed_when text,
  referred_by text,
  notes text,
  status text NOT NULL DEFAULT 'new',
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.leads FROM anon;
GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit leads"
  ON public.leads FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view leads"
  ON public.leads FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can update leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

CREATE INDEX idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX idx_leads_form_type ON public.leads (form_type);
CREATE INDEX idx_leads_vertical_path ON public.leads (vertical_path);

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Consigner and driver acquisition funnels
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
-- Customer profiles: one row per auth user, created automatically on signup
-- (email/password or OAuth). Users can only read and edit their own row.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profiles_updated_at();

-- OAuth providers put the display name in raw_user_meta_data ('full_name' for
-- some providers, 'name' for Google); email/password signups have neither.
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
