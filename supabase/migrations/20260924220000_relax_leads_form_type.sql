-- The original leads table only allowed 'quick_quote' and 'partner_intake',
-- but the site also inserts 'airport_quote' (AirportQuoteForm),
-- 'hotel_quote' (HotelQuoteForm) and 'contact' (Contact page). Those inserts
-- were rejected by the CHECK constraint. Widen it to every form_type the app
-- writes. 'rent_to_own' is kept for historical rows / older clients.
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_form_type_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_form_type_check
  CHECK (form_type IN (
    'quick_quote',
    'partner_intake',
    'airport_quote',
    'hotel_quote',
    'contact',
    'rent_to_own'
  ));
