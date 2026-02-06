-- Create vehicle_categories table
CREATE TABLE public.vehicle_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  hero_image text,
  description text,
  passenger_capacity integer NOT NULL DEFAULT 5,
  bag_capacity integer NOT NULL DEFAULT 2,
  price_per_day numeric NOT NULL,
  price_per_week numeric,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on vehicle_categories
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for vehicle_categories
CREATE POLICY "Anyone can view active categories"
ON public.vehicle_categories
FOR SELECT
USING (active = true);

CREATE POLICY "Admins can view all categories"
ON public.vehicle_categories
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert categories"
ON public.vehicle_categories
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories"
ON public.vehicle_categories
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories"
ON public.vehicle_categories
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add new columns to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN category_id uuid REFERENCES public.vehicle_categories(id) ON DELETE SET NULL,
ADD COLUMN status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
ADD COLUMN location text DEFAULT 'Main Office';

-- Create reservations table
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.vehicle_categories(id),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  pickup_location text NOT NULL,
  dropoff_location text NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'needs_assignment', 'completed', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Enable RLS on reservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- RLS policies for reservations
CREATE POLICY "Anyone can create reservations"
ON public.reservations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all reservations"
ON public.reservations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reservations"
ON public.reservations
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reservations"
ON public.reservations
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for availability queries
CREATE INDEX idx_vehicles_category_status ON public.vehicles(category_id, status);
CREATE INDEX idx_reservations_dates ON public.reservations(start_date, end_date);
CREATE INDEX idx_reservations_category ON public.reservations(category_id);