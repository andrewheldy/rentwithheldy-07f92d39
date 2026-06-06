ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS current_mileage integer,
  ADD COLUMN IF NOT EXISTS last_oil_change_date date,
  ADD COLUMN IF NOT EXISTS delivery_fee_port_miami numeric(10,2),
  ADD COLUMN IF NOT EXISTS delivery_fee_port_everglades numeric(10,2),
  ADD COLUMN IF NOT EXISTS delivery_fee_mia_airport numeric(10,2),
  ADD COLUMN IF NOT EXISTS delivery_fee_fll_airport numeric(10,2);