-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  rating DECIMAL(3,2) DEFAULT 4.9,
  trips INTEGER DEFAULT 0,
  host_type TEXT DEFAULT 'All-Star Host',
  daily_rate DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  vin TEXT,
  license_plate TEXT,
  initial_mileage INTEGER,
  date_added TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vehicle_images table
CREATE TABLE public.vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create booking_inquiries table
CREATE TABLE public.booking_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_inquiries ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- Vehicles policies: public read, admin write
CREATE POLICY "Anyone can view vehicles"
ON public.vehicles FOR SELECT
USING (true);

CREATE POLICY "Admins can insert vehicles"
ON public.vehicles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update vehicles"
ON public.vehicles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vehicles"
ON public.vehicles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Vehicle images policies: public read, admin write
CREATE POLICY "Anyone can view vehicle images"
ON public.vehicle_images FOR SELECT
USING (true);

CREATE POLICY "Admins can insert vehicle images"
ON public.vehicle_images FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update vehicle images"
ON public.vehicle_images FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vehicle images"
ON public.vehicle_images FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies: users can view own role, admins can manage
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Booking inquiries policies: anyone can submit, admins can manage
CREATE POLICY "Anyone can submit booking inquiries"
ON public.booking_inquiries FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all inquiries"
ON public.booking_inquiries FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update inquiries"
ON public.booking_inquiries FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete inquiries"
ON public.booking_inquiries FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-images', 'vehicle-images', true);

-- Storage policies: public read, admin write
CREATE POLICY "Anyone can view vehicle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Admins can upload vehicle images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update vehicle images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vehicle images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));