-- 1. vertical_path columns on existing tables
ALTER TABLE public.booking_inquiries
  ADD COLUMN IF NOT EXISTS vertical_path text;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS vertical_path text;

-- 2. leads table (QuickQuote + PartnerIntake submissions)
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type text NOT NULL CHECK (form_type IN ('quick_quote', 'partner_intake')),
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

GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit leads"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_form_type ON public.leads (form_type);
CREATE INDEX IF NOT EXISTS idx_leads_vertical_path ON public.leads (vertical_path);

-- 3. event_logs table (server-side audit trail)
CREATE TABLE IF NOT EXISTS public.event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  vertical_path text,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warn','error')),
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.event_logs TO authenticated;
GRANT ALL ON public.event_logs TO service_role;

ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view event logs"
  ON public.event_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete event logs"
  ON public.event_logs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON public.event_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_logs_entity ON public.event_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_event_type ON public.event_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_event_logs_severity ON public.event_logs (severity);

-- 4. updated_at trigger function (reusable)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();