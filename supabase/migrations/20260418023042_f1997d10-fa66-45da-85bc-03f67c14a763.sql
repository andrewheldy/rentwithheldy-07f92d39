
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS weekday_rate numeric,
  ADD COLUMN IF NOT EXISTS weekend_rate numeric;
