-- Consigner accounts, consignment terms, platform revenue, expenses and
-- owner statements (docs/DATABASE_MIGRATION_PLAN.md sections 3.2 to 3.6).
-- Money is integer cents. Consigners read only rows for their own vehicles
-- within their consignment dates; admins read everything; writes to revenue
-- tables happen server-side (Wheelbase sync, Turo import) with the secret key.

-- ---------------------------------------------------------------------------
-- Platform identifiers
-- ---------------------------------------------------------------------------
CREATE TABLE public.vehicle_external_refs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('wheelbase', 'turo')),
  external_id text NOT NULL CHECK (external_id ~ '^[0-9]+$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id),
  UNIQUE (vehicle_id, source)
);

COMMENT ON TABLE public.vehicle_external_refs IS
  'Platform vehicle IDs attached to our vehicles.id. Matching is by VIN; names and plates are never used.';

-- ---------------------------------------------------------------------------
-- Consigners and consignments
-- ---------------------------------------------------------------------------
CREATE TABLE public.consigners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  legal_name text NOT NULL CHECK (char_length(legal_name) BETWEEN 1 AND 160),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  phone text,
  mailing_address text,
  status text NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'active', 'ended')),
  acquisition_lead_id uuid REFERENCES public.acquisition_leads(id) ON DELETE SET NULL,
  payout_method text CHECK (payout_method IS NULL OR payout_method IN ('ach', 'check', 'zelle', 'other')),
  payout_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.consigners.payout_reference IS
  'Free-text label only (e.g. "Chase ending 1234"). Never store account or routing numbers.';

CREATE UNIQUE INDEX consigners_email_unique ON public.consigners (lower(email));

CREATE TRIGGER consigners_updated_at
  BEFORE UPDATE ON public.consigners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.agreements
  ADD COLUMN consigner_id uuid REFERENCES public.consigners(id) ON DELETE SET NULL;

CREATE INDEX idx_agreements_consigner ON public.agreements (consigner_id);

CREATE TABLE public.consignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consigner_id uuid NOT NULL REFERENCES public.consigners(id) ON DELETE RESTRICT,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  agreement_id uuid REFERENCES public.agreements(id) ON DELETE RESTRICT,
  owner_percent numeric(5,2) NOT NULL CHECK (owner_percent BETWEEN 0 AND 100),
  operator_percent numeric(5,2) NOT NULL CHECK (operator_percent BETWEEN 0 AND 100),
  effective_from date NOT NULL,
  effective_to date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consignments_split_is_100 CHECK (owner_percent + operator_percent = 100),
  CONSTRAINT consignments_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

-- One consignment term per vehicle per day.
ALTER TABLE public.consignments
  ADD CONSTRAINT consignments_no_overlap
  EXCLUDE USING gist (
    vehicle_id WITH =,
    daterange(effective_from, effective_to, '[]') WITH &&
  );

CREATE INDEX idx_consignments_consigner ON public.consignments (consigner_id);

CREATE TRIGGER consignments_updated_at
  BEFORE UPDATE ON public.consignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Access helpers (SECURITY DEFINER so policies don't recurse through RLS)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_consigner_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id FROM public.consigners c
  WHERE c.user_id = auth.uid()
    AND public.has_role(auth.uid(), 'consigner')
$$;

-- True when the signed-in consigner owned the vehicle on the given day, or on
-- any day when p_on is null.
CREATE OR REPLACE FUNCTION public.consigner_owns_vehicle(p_vehicle_id uuid, p_on date DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.consignments cs
    WHERE cs.vehicle_id = p_vehicle_id
      AND cs.consigner_id = public.current_consigner_id()
      AND (p_on IS NULL OR (p_on >= cs.effective_from AND (cs.effective_to IS NULL OR p_on <= cs.effective_to)))
  )
$$;

REVOKE EXECUTE ON FUNCTION public.current_consigner_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.consigner_owns_vehicle(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_consigner_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consigner_owns_vehicle(uuid, date) TO authenticated, service_role;

-- When a consigner's email is confirmed (email sign-up or Google), attach
-- their login to the consigner row and grant the consigner role. Only
-- consigners an admin has already created are linked; the role is never
-- self-assigned.
CREATE OR REPLACE FUNCTION public.link_consigner_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched uuid;
BEGIN
  IF NEW.email_confirmed_at IS NULL OR NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.consigners
  SET user_id = NEW.id
  WHERE user_id IS NULL
    AND lower(email) = lower(NEW.email)
    AND status IN ('prospect', 'active')
  RETURNING id INTO matched;

  IF matched IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'consigner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_link_consigner
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_consigner_login();

-- ---------------------------------------------------------------------------
-- Revenue (Wheelbase sync, Turo import)
-- ---------------------------------------------------------------------------
CREATE TABLE public.rental_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('wheelbase', 'turo')),
  external_booking_id text NOT NULL,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  rental_days integer CHECK (rental_days IS NULL OR rental_days >= 0),
  status text NOT NULL CHECK (status IN (
    'booked', 'in_progress', 'completed', 'cancelled_by_guest', 'cancelled_by_host'
  )),
  gross_cents bigint NOT NULL DEFAULT 0,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_booking_id),
  CHECK (end_at >= start_at)
);

COMMENT ON COLUMN public.rental_bookings.raw IS
  'Source row with renter identity and addresses removed.';

CREATE INDEX idx_rental_bookings_vehicle_start ON public.rental_bookings (vehicle_id, start_at);

CREATE TABLE public.rental_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('wheelbase', 'turo')),
  external_id text NOT NULL,
  booking_id uuid REFERENCES public.rental_bookings(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  category text NOT NULL CHECK (category IN ('charge', 'refund', 'fee', 'payout')),
  amount_cents bigint NOT NULL,
  sales_tax_cents bigint NOT NULL DEFAULT 0,
  processing_fee_cents bigint NOT NULL DEFAULT 0,
  platform_fee_cents bigint NOT NULL DEFAULT 0,
  rental_revenue_cents bigint NOT NULL DEFAULT 0,
  excluded_cents bigint NOT NULL DEFAULT 0,
  excluded_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  unclassified_cents bigint NOT NULL DEFAULT 0,
  unclassified_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  collected_on date NOT NULL,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

COMMENT ON COLUMN public.rental_transactions.rental_revenue_cents IS
  'Portion that counts as Rental Revenue under the consignment agreement (section 5).';
COMMENT ON COLUMN public.rental_transactions.unclassified_cents IS
  'Amounts awaiting a policy decision (Turo cancellation fees and "Other fees"). Not yet split with owners.';

CREATE INDEX idx_rental_transactions_vehicle_collected ON public.rental_transactions (vehicle_id, collected_on);
CREATE INDEX idx_rental_transactions_booking ON public.rental_transactions (booking_id);

-- ---------------------------------------------------------------------------
-- Costs and availability
-- ---------------------------------------------------------------------------
CREATE TABLE public.vehicle_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  incurred_on date NOT NULL,
  category text NOT NULL CHECK (category IN (
    'maintenance', 'repair', 'cleaning', 'delivery', 'insurance', 'registration',
    'unrecovered_tolls', 'parking', 'marketing', 'other'
  )),
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  borne_by text NOT NULL DEFAULT 'operator' CHECK (borne_by IN ('operator', 'owner')),
  notes text,
  receipt_path text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicle_expenses_vehicle_date ON public.vehicle_expenses (vehicle_id, incurred_on);

CREATE TRIGGER vehicle_expenses_updated_at
  BEFORE UPDATE ON public.vehicle_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.vehicle_unavailable_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  reason text NOT NULL CHECK (reason IN ('owner_use', 'maintenance', 'repair', 'other')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on >= starts_on)
);

CREATE INDEX idx_unavailable_vehicle ON public.vehicle_unavailable_periods (vehicle_id, starts_on);

-- ---------------------------------------------------------------------------
-- Owner statements
-- ---------------------------------------------------------------------------
CREATE TABLE public.owner_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consigner_id uuid NOT NULL REFERENCES public.consigners(id) ON DELETE RESTRICT,
  period_start date NOT NULL,
  period_end date NOT NULL,
  rental_revenue_cents bigint NOT NULL DEFAULT 0,
  owner_share_cents bigint NOT NULL DEFAULT 0,
  owner_expenses_cents bigint NOT NULL DEFAULT 0,
  adjustments_cents bigint NOT NULL DEFAULT 0,
  net_payable_cents bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid')),
  issued_at timestamptz,
  paid_at timestamptz,
  pdf_path text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (consigner_id, period_start, period_end),
  CHECK (period_end >= period_start),
  CHECK (status = 'draft' OR issued_at IS NOT NULL),
  CHECK (status <> 'paid' OR paid_at IS NOT NULL)
);

CREATE TRIGGER owner_statements_updated_at
  BEFORE UPDATE ON public.owner_statements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.owner_statement_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id uuid NOT NULL REFERENCES public.owner_statements(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  booking_id uuid REFERENCES public.rental_bookings(id) ON DELETE SET NULL,
  rental_revenue_cents bigint NOT NULL DEFAULT 0,
  owner_percent numeric(5,2) NOT NULL,
  owner_share_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_statement_lines_statement ON public.owner_statement_lines (statement_id);

CREATE TABLE public.sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('wheelbase', 'turo')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'succeeded', 'failed')),
  rows_upserted integer NOT NULL DEFAULT 0,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- Grants and RLS
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'vehicle_external_refs', 'consigners', 'consignments', 'rental_bookings',
    'rental_transactions', 'vehicle_expenses', 'vehicle_unavailable_periods',
    'owner_statements', 'owner_statement_lines', 'sync_runs'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format(
      'CREATE POLICY "Admins can read %1$s" ON public.%1$I FOR SELECT TO authenticated USING (public.has_role((select auth.uid()), ''admin''))',
      t
    );
  END LOOP;
END $$;

-- Admin-maintained tables are writable by admins from the browser. Revenue and
-- sync tables are written only by the server.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'vehicle_external_refs', 'consigners', 'consignments', 'vehicle_expenses',
    'vehicle_unavailable_periods', 'owner_statements', 'owner_statement_lines'
  ] LOOP
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format(
      'CREATE POLICY "Admins can write %1$s" ON public.%1$I FOR ALL TO authenticated USING (public.has_role((select auth.uid()), ''admin'')) WITH CHECK (public.has_role((select auth.uid()), ''admin''))',
      t
    );
  END LOOP;
END $$;

CREATE POLICY "Consigners read own profile"
  ON public.consigners FOR SELECT TO authenticated
  USING (id = public.current_consigner_id());

CREATE POLICY "Consigners read own consignments"
  ON public.consignments FOR SELECT TO authenticated
  USING (consigner_id = public.current_consigner_id());

CREATE POLICY "Consigners read own vehicles"
  ON public.vehicles FOR SELECT TO authenticated
  USING (public.consigner_owns_vehicle(id));

CREATE POLICY "Consigners read bookings for their vehicles"
  ON public.rental_bookings FOR SELECT TO authenticated
  USING (public.consigner_owns_vehicle(vehicle_id, (start_at AT TIME ZONE 'America/New_York')::date));

CREATE POLICY "Consigners read transactions for their vehicles"
  ON public.rental_transactions FOR SELECT TO authenticated
  USING (public.consigner_owns_vehicle(vehicle_id, collected_on));

CREATE POLICY "Consigners read owner-borne expenses"
  ON public.vehicle_expenses FOR SELECT TO authenticated
  USING (borne_by = 'owner' AND public.consigner_owns_vehicle(vehicle_id, incurred_on));

CREATE POLICY "Consigners read unavailable periods"
  ON public.vehicle_unavailable_periods FOR SELECT TO authenticated
  USING (public.consigner_owns_vehicle(vehicle_id));

CREATE POLICY "Consigners read issued statements"
  ON public.owner_statements FOR SELECT TO authenticated
  USING (consigner_id = public.current_consigner_id() AND status IN ('issued', 'paid'));

CREATE POLICY "Consigners read issued statement lines"
  ON public.owner_statement_lines FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.owner_statements s
    WHERE s.id = statement_id
      AND s.consigner_id = public.current_consigner_id()
      AND s.status IN ('issued', 'paid')
  ));

-- Consigners can read their own executed agreements and the final PDF.
CREATE POLICY "Consigners read own executed agreements"
  ON public.agreements FOR SELECT TO authenticated
  USING (consigner_id = public.current_consigner_id() AND status = 'executed');

CREATE POLICY "Consigners read own executed agreement versions"
  ON public.agreement_versions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.agreements a
    WHERE a.id = agreement_id
      AND a.current_version_id = agreement_versions.id
      AND a.consigner_id = public.current_consigner_id()
      AND a.status = 'executed'
  ));

CREATE POLICY "Consigners download own executed agreement PDFs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'agreements'
    AND EXISTS (
      SELECT 1 FROM public.agreements a
      WHERE a.final_pdf_path = storage.objects.name
        AND a.consigner_id = public.current_consigner_id()
        AND a.status = 'executed'
    )
  );

-- ---------------------------------------------------------------------------
-- Dashboard views (security_invoker, so the RLS above applies)
-- ---------------------------------------------------------------------------

-- Nights rented per vehicle and month, from completed and in-progress trips.
CREATE VIEW public.v_vehicle_monthly_rental_days
WITH (security_invoker = on) AS
SELECT
  b.vehicle_id,
  date_trunc('month', d)::date AS month,
  count(*)::integer AS rental_days
FROM public.rental_bookings b
CROSS JOIN LATERAL generate_series(
  (b.start_at AT TIME ZONE 'America/New_York')::date,
  greatest((b.end_at AT TIME ZONE 'America/New_York')::date - 1, (b.start_at AT TIME ZONE 'America/New_York')::date),
  interval '1 day'
) AS d
WHERE b.status IN ('completed', 'in_progress')
GROUP BY b.vehicle_id, date_trunc('month', d);

-- Revenue per vehicle and month, split with the consignment in force on the
-- collection date. Vehicles with no consignment are 100% operator.
CREATE VIEW public.v_vehicle_monthly_revenue
WITH (security_invoker = on) AS
SELECT
  t.vehicle_id,
  date_trunc('month', t.collected_on)::date AS month,
  sum(t.amount_cents)::bigint AS gross_collected_cents,
  sum(t.rental_revenue_cents)::bigint AS rental_revenue_cents,
  sum(t.excluded_cents)::bigint AS excluded_cents,
  sum(t.unclassified_cents)::bigint AS unclassified_cents,
  sum(round(t.rental_revenue_cents * coalesce(cs.owner_percent, 0) / 100))::bigint AS owner_share_cents,
  sum(t.rental_revenue_cents - round(t.rental_revenue_cents * coalesce(cs.owner_percent, 0) / 100))::bigint AS operator_share_cents
FROM public.rental_transactions t
LEFT JOIN public.consignments cs
  ON cs.vehicle_id = t.vehicle_id
 AND t.collected_on >= cs.effective_from
 AND (cs.effective_to IS NULL OR t.collected_on <= cs.effective_to)
GROUP BY t.vehicle_id, date_trunc('month', t.collected_on);

CREATE VIEW public.v_vehicle_monthly_expenses
WITH (security_invoker = on) AS
SELECT
  e.vehicle_id,
  date_trunc('month', e.incurred_on)::date AS month,
  sum(e.amount_cents) FILTER (WHERE e.borne_by = 'owner')::bigint AS owner_expenses_cents,
  sum(e.amount_cents) FILTER (WHERE e.borne_by = 'operator')::bigint AS operator_expenses_cents
FROM public.vehicle_expenses e
GROUP BY e.vehicle_id, date_trunc('month', e.incurred_on);

-- Days each vehicle was in service in each month, minus unavailable periods.
CREATE VIEW public.v_vehicle_monthly_available_days
WITH (security_invoker = on) AS
WITH bounds AS (
  SELECT
    v.id AS vehicle_id,
    coalesce(v.in_service_on, (v.created_at AT TIME ZONE 'America/New_York')::date) AS first_day,
    coalesce(v.out_of_service_on, (now() AT TIME ZONE 'America/New_York')::date) AS last_day
  FROM public.vehicles v
), days AS (
  SELECT b.vehicle_id, d::date AS day
  FROM bounds b
  CROSS JOIN LATERAL generate_series(b.first_day, b.last_day, interval '1 day') AS d
)
SELECT
  days.vehicle_id,
  date_trunc('month', days.day)::date AS month,
  count(*) FILTER (WHERE NOT EXISTS (
    SELECT 1 FROM public.vehicle_unavailable_periods u
    WHERE u.vehicle_id = days.vehicle_id AND days.day BETWEEN u.starts_on AND u.ends_on
  ))::integer AS available_days
FROM days
GROUP BY days.vehicle_id, date_trunc('month', days.day);

CREATE VIEW public.v_vehicle_monthly_performance
WITH (security_invoker = on) AS
WITH keys AS (
  SELECT vehicle_id, month FROM public.v_vehicle_monthly_revenue
  UNION SELECT vehicle_id, month FROM public.v_vehicle_monthly_rental_days
  UNION SELECT vehicle_id, month FROM public.v_vehicle_monthly_expenses
)
SELECT
  k.vehicle_id,
  v.year, v.make, v.model, v.color,
  k.month,
  coalesce(rd.rental_days, 0) AS rental_days,
  ad.available_days,
  CASE WHEN coalesce(ad.available_days, 0) > 0
       THEN round(100.0 * least(coalesce(rd.rental_days, 0), ad.available_days) / ad.available_days, 1) END AS utilization_pct,
  coalesce(r.gross_collected_cents, 0) AS gross_collected_cents,
  coalesce(r.rental_revenue_cents, 0) AS rental_revenue_cents,
  coalesce(r.excluded_cents, 0) AS excluded_cents,
  coalesce(r.unclassified_cents, 0) AS unclassified_cents,
  CASE WHEN coalesce(rd.rental_days, 0) > 0
       THEN round(coalesce(r.rental_revenue_cents, 0)::numeric / rd.rental_days) END AS avg_daily_rate_cents,
  CASE WHEN coalesce(ad.available_days, 0) > 0
       THEN round(coalesce(r.rental_revenue_cents, 0)::numeric / ad.available_days) END AS revenue_per_available_day_cents,
  coalesce(r.owner_share_cents, 0) AS owner_share_cents,
  coalesce(r.operator_share_cents, 0) AS operator_share_cents,
  coalesce(e.owner_expenses_cents, 0) AS owner_expenses_cents,
  coalesce(r.owner_share_cents, 0) - coalesce(e.owner_expenses_cents, 0) AS net_to_owner_cents
FROM keys k
JOIN public.vehicles v ON v.id = k.vehicle_id
LEFT JOIN public.v_vehicle_monthly_rental_days rd ON rd.vehicle_id = k.vehicle_id AND rd.month = k.month
LEFT JOIN public.v_vehicle_monthly_available_days ad ON ad.vehicle_id = k.vehicle_id AND ad.month = k.month
LEFT JOIN public.v_vehicle_monthly_revenue r ON r.vehicle_id = k.vehicle_id AND r.month = k.month
LEFT JOIN public.v_vehicle_monthly_expenses e ON e.vehicle_id = k.vehicle_id AND e.month = k.month;

-- Admin only: adds operator-borne costs and operator profit.
CREATE VIEW public.v_fleet_profitability
WITH (security_invoker = on) AS
SELECT
  p.*,
  v.fleet_status,
  coalesce(e.operator_expenses_cents, 0) AS operator_expenses_cents,
  p.operator_share_cents - coalesce(e.operator_expenses_cents, 0) AS operator_net_cents
FROM public.v_vehicle_monthly_performance p
JOIN public.vehicles v ON v.id = p.vehicle_id
LEFT JOIN public.v_vehicle_monthly_expenses e ON e.vehicle_id = p.vehicle_id AND e.month = p.month
WHERE public.has_role((select auth.uid()), 'admin');

CREATE VIEW public.v_consigner_summary
WITH (security_invoker = on) AS
SELECT
  cs.consigner_id,
  p.month,
  count(DISTINCT p.vehicle_id)::integer AS vehicles,
  sum(p.rental_days)::integer AS rental_days,
  sum(p.available_days)::integer AS available_days,
  sum(p.rental_revenue_cents)::bigint AS rental_revenue_cents,
  sum(p.owner_share_cents)::bigint AS owner_share_cents,
  sum(p.owner_expenses_cents)::bigint AS owner_expenses_cents,
  sum(p.net_to_owner_cents)::bigint AS net_to_owner_cents,
  (SELECT coalesce(sum(s.net_payable_cents), 0) FROM public.owner_statements s
    WHERE s.consigner_id = cs.consigner_id AND s.status = 'paid'
      AND date_trunc('month', s.period_start)::date = p.month)::bigint AS paid_cents,
  (SELECT coalesce(sum(s.net_payable_cents), 0) FROM public.owner_statements s
    WHERE s.consigner_id = cs.consigner_id AND s.status = 'issued'
      AND date_trunc('month', s.period_start)::date = p.month)::bigint AS outstanding_cents
FROM public.v_vehicle_monthly_performance p
JOIN public.consignments cs
  ON cs.vehicle_id = p.vehicle_id
 AND p.month >= date_trunc('month', cs.effective_from)::date
 AND (cs.effective_to IS NULL OR p.month <= cs.effective_to)
GROUP BY cs.consigner_id, p.month;

DO $$
DECLARE
  v text;
BEGIN
  FOREACH v IN ARRAY ARRAY[
    'v_vehicle_monthly_rental_days', 'v_vehicle_monthly_revenue', 'v_vehicle_monthly_expenses',
    'v_vehicle_monthly_available_days', 'v_vehicle_monthly_performance',
    'v_fleet_profitability', 'v_consigner_summary'
  ] LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', v);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated, service_role', v);
  END LOOP;
END $$;
