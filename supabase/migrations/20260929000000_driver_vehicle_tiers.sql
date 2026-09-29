-- Drive for Work vehicle tiers: Delivery, Standard, Comfort, XL.
-- Legacy values stay allowed so existing rows remain valid.
ALTER TABLE public.acquisition_leads
  DROP CONSTRAINT IF EXISTS acquisition_leads_vehicle_category_check;

ALTER TABLE public.acquisition_leads
  ADD CONSTRAINT acquisition_leads_vehicle_category_check
  CHECK (
    vehicle_category IS NULL
    OR vehicle_category IN (
      'delivery', 'standard', 'comfort', 'xl',
      'everyday', 'premium', 'large_passenger', 'not_sure'
    )
  );
