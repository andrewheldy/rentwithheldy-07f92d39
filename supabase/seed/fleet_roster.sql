-- Fleet seed for the standalone database (docs/DATABASE_MIGRATION_PLAN.md,
-- Appendix A and section 4.3): 36 active, 3 retired (kept for trip history)
-- and 4 inactive vehicles, with their Turo and Wheelbase IDs.
--
-- Seeded rows are hidden from the public site (show_on_site = false) until
-- photos and descriptions are added in /admin. Rates and mileage come from the
-- Wheelbase fleet report of 2026-09-25; in_service_on is the first Turo trip
-- and out_of_service_on (retired only) the last one.
--
-- Idempotent: each row gets a deterministic id derived from its VIN (or its
-- Wheelbase ID for the Transits that have no VIN yet), so re-running is a no-op.
BEGIN;

CREATE TEMP TABLE fleet_seed (
  seed_key text, make text, model text, year int, color text, daily_rate numeric,
  vin text, license_plate text, current_mileage int, fleet_status text,
  in_service_on date, out_of_service_on date, turo_id text, wheelbase_id text
) ON COMMIT DROP;

INSERT INTO fleet_seed VALUES
  ('WAUBFAFL9EN040664', 'Audi', 'A4', 2014, 'Black', 40.00, 'WAUBFAFL9EN040664', '88EUVM', NULL, 'active', '2025-12-30'::date, NULL::date, '3080125', '530118'),
  ('1HGCR3F83EA035670', 'Honda', 'Accord', 2014, 'Silver', 29.00, '1HGCR3F83EA035670', 'EB41DB', 96270, 'active', '2025-12-30'::date, NULL::date, '3270598', '529774'),
  ('3HGGK5H80FM780122', 'Honda', 'Fit', 2015, 'Silver', 45.00, '3HGGK5H80FM780122', 'DY18ZM', 57337, 'active', '2026-01-01'::date, NULL::date, '3224033', '529907'),
  ('5XXGN4A75FG492860', 'Kia', 'Optima', 2015, 'Silver', 35.00, '5XXGN4A75FG492860', 'LD416T', 92597, 'active', '2026-02-13'::date, NULL::date, '3575002', '529921'),
  ('JM3KE2CYXF0492835', 'Mazda', 'CX-5', 2015, 'Gray', 50.00, 'JM3KE2CYXF0492835', '07VCLL', 68442, 'active', '2026-06-09'::date, NULL::date, '3750194', '531049'),
  ('WDDHF8JB5FB088532', 'Mercedes-Benz', 'E-Class', 2015, 'Gray', 50.00, 'WDDHF8JB5FB088532', 'EB19IY', 82687, 'active', '2025-12-30'::date, NULL::date, '3269497', '529780'),
  ('3VW2K7AJ8FM409367', 'Volkswagen', 'Jetta', 2015, 'Silver', 45.00, '3VW2K7AJ8FM409367', 'FKDA26', 62096, 'active', '2025-12-29'::date, NULL::date, '3296058', '529784'),
  ('4T4BF1FK9GR545589', 'Toyota', 'Camry', 2016, 'Gray', 40.00, '4T4BF1FK9GR545589', '91VBGJ', 93997, 'active', '2026-01-22'::date, NULL::date, '3524535', '529941'),
  ('1GNSCGKC2HR377153', 'Chevrolet', 'Suburban', 2017, 'Black', 65.00, '1GNSCGKC2HR377153', 'EB40DB', 74475, 'active', '2025-12-22'::date, NULL::date, '3295951', '529204'),
  ('2FMPK4J97HBB14256', 'Ford', 'Edge', 2017, 'Brown', 40.00, '2FMPK4J97HBB14256', '78FCDC', 70574, 'active', '2026-05-28'::date, NULL::date, '3073716', '517053'),
  ('5XXGT4L30HG161266', 'Kia', 'Optima', 2017, 'Silver', 42.00, '5XXGT4L30HG161266', 'XQP946', 63558, 'active', '2026-05-09'::date, NULL::date, '3707283', '529953'),
  ('JF2SJAAC8HH507036', 'Subaru', 'Forester', 2017, 'White', 35.00, 'JF2SJAAC8HH507036', 'DJ02ZS', 48356, 'active', '2026-01-01'::date, NULL::date, '3087797', '529929'),
  ('1GNSCAKC1JR345278', 'Chevrolet', 'Tahoe', 2018, 'Beige', 65.00, '1GNSCAKC1JR345278', '17GCGT', NULL, 'active', '2026-03-12'::date, NULL::date, '3606751', '529208'),
  ('1GKS1FKC7JR398793', 'GMC', 'Yukon XL', 2018, 'White', 65.00, '1GKS1FKC7JR398793', '92VBGJ', NULL, 'active', '2026-01-09'::date, NULL::date, '3527009', '529786'),
  ('5FNYF5H11JB031725', 'Honda', 'Pilot', 2018, 'White', 60.00, '5FNYF5H11JB031725', '24FYRG', 74769, 'active', '2026-05-01'::date, NULL::date, '3694394', '521128'),
  ('ZACCJABB0JPH13460', 'Jeep', 'Renegade', 2018, 'Orange', 45.00, 'ZACCJABB0JPH13460', '38FPIQ', 44314, 'active', '2025-12-31'::date, NULL::date, '3494909', '529215'),
  ('WA1ANAFY4K2081157', 'Audi', 'Q5', 2019, 'Gray', 50.00, 'WA1ANAFY4K2081157', 'DJ00ZS', 61544, 'active', '2026-01-01'::date, NULL::date, '3172654', '530115'),
  ('1GAZGMFP5K1356514', 'Chevrolet', 'Express', 2019, 'White', 80.00, '1GAZGMFP5K1356514', '18GCGT', NULL, 'active', '2026-03-14'::date, NULL::date, '3609296', '517120'),
  ('7FARW1H81KE038335', 'Honda', 'CR-V', 2019, 'Gray', 35.00, '7FARW1H81KE038335', '32FVTU', NULL, 'active', '2025-12-26'::date, NULL::date, '3428775', '529912'),
  ('1V2WR2CA8KC567167', 'Volkswagen', 'Atlas', 2019, 'Blue', 60.00, '1V2WR2CA8KC567167', '08VCLL', 64983, 'active', '2026-03-28'::date, NULL::date, '3633287', '529776'),
  ('3VWC57BU3KM109203', 'Volkswagen', 'Jetta', 2019, 'Blue', 45.00, '3VWC57BU3KM109203', 'FGJS04', 83690, 'active', '2025-12-31'::date, NULL::date, '3271393', '529919'),
  ('3VWC57BU8KM079101', 'Volkswagen', 'Jetta', 2019, 'Red', 45.00, '3VWC57BU8KM079101', 'FDMY01', 104975, 'active', '2025-12-25'::date, NULL::date, '3233670', '529218'),
  ('3VWE57BU1KM119169', 'Volkswagen', 'Jetta', 2019, 'White', 45.00, '3VWE57BU1KM119169', 'STLN58', 85000, 'active', '2026-09-17'::date, NULL::date, '3906429', '564850'),
  ('3GNAXKEV3LS661445', 'Chevrolet', 'Equinox', 2020, 'White', 45.00, '3GNAXKEV3LS661445', 'EB42DB', 85263, 'active', '2025-12-29'::date, NULL::date, '3271620', '510827'),
  ('2GNAXHEV3L6264271', 'Chevrolet', 'Equinox', 2020, 'Black', 35.00, '2GNAXHEV3L6264271', 'FDDH36', 112922, 'active', '2026-01-01'::date, NULL::date, '3325188', '510825'),
  ('2GNAXKEV9L6122875', 'Chevrolet', 'Equinox', 2020, 'Silver', 45.00, '2GNAXKEV9L6122875', '81GCGS', NULL, 'active', '2026-03-05'::date, NULL::date, '3599034', '510820'),
  ('5N1DL0MN0LC500558', 'Infiniti', 'QX60', 2020, 'Brown', 60.00, '5N1DL0MN0LC500558', '02FRST', NULL, 'active', '2026-02-04'::date, NULL::date, '3559928', '529781'),
  ('5YFEPRAE5LP096217', 'Toyota', 'Corolla', 2020, 'Black', 40.00, '5YFEPRAE5LP096217', 'FDMY03', 80309, 'active', '2025-12-29'::date, NULL::date, '3282329', '529948'),
  ('KNDJ63AU8M7738907', 'Kia', 'Soul', 2021, 'Blue', 45.00, 'KNDJ63AU8M7738907', 'DS17XA', NULL, 'active', '2025-12-31'::date, NULL::date, '3267675', '529924'),
  ('WAUABAF44NA015999', 'Audi', 'A4', 2022, 'Black', 45.00, 'WAUABAF44NA015999', '99ANCI', 33801, 'active', '2025-12-30'::date, NULL::date, '3179131', '510783'),
  ('5FNRL6H58NB049215', 'Honda', 'Odyssey', 2022, 'White', 60.00, '5FNRL6H58NB049215', '93VBGJ', 79989, 'active', '2026-01-08'::date, NULL::date, '3524513', '510793'),
  ('KNDJ23AUXN7149998', 'Kia', 'Soul', 2022, 'Red', 50.00, 'KNDJ23AUXN7149998', '51FPIQ', NULL, 'active', '2026-01-04'::date, NULL::date, '3518985', '529925'),
  ('3GNAXKEG8PL235090', 'Chevrolet', 'Equinox', 2023, 'Black', 45.00, '3GNAXKEG8PL235090', '49FRSS', NULL, 'active', '2026-02-21'::date, NULL::date, '3582591', '510814'),
  ('3VVCX7B2XPM363964', 'Volkswagen', 'Taos', 2023, 'Gray', 55.00, '3VVCX7B2XPM363964', 'FKDA27', NULL, 'active', '2025-12-19'::date, NULL::date, '3049985', '510779'),
  ('3VVRB7AX4PM088288', 'Volkswagen', 'Tiguan', 2023, 'Black', 55.00, '3VVRB7AX4PM088288', '65FRRZ', 38553, 'active', '2026-03-05'::date, NULL::date, '3596268', '510778'),
  ('WA1EAAFY6R2013451', 'Audi', 'Q5', 2024, 'Gray', 60.00, 'WA1EAAFY6R2013451', '86EUVM', 30893, 'active', '2025-12-29'::date, NULL::date, '2995422', '510755'),
  ('1VWSA7A33LC014823', 'Volkswagen', 'Passat', 2020, '', 0.00, '1VWSA7A33LC014823', NULL, NULL, 'retired', '2026-02-05'::date, '2026-04-30'::date, '3562252', '510797'),
  ('4JGDA5JB3HA978005', 'Mercedes-Benz', 'GLE-Class', 2017, '', 0.00, '4JGDA5JB3HA978005', NULL, NULL, 'retired', '2026-04-17'::date, '2026-08-11'::date, '3674313', NULL),
  ('5UXTY3C05M9E14431', 'BMW', 'X3', 2021, '', 0.00, '5UXTY3C05M9E14431', NULL, NULL, 'retired', '2026-05-28'::date, '2026-05-31'::date, '3741006', NULL),
  ('5UXWZ7C56G0R33412', 'BMW', 'X3', 2016, '', 1.00, '5UXWZ7C56G0R33412', '32EVWK', NULL, 'inactive', NULL::date, NULL::date, NULL, '544415'),
  ('wheelbase:553000', 'Ford', 'Transit', 2024, '', 0.00, NULL, NULL, NULL, 'inactive', NULL::date, NULL::date, NULL, '553000'),
  ('wheelbase:552990', 'Ford', 'Transit', 2024, '', 0.00, NULL, NULL, NULL, 'inactive', NULL::date, NULL::date, NULL, '552990'),
  ('wheelbase:552949', 'Ford', 'Transit', 2018, '', 140.00, NULL, 'AR64PP', NULL, 'inactive', NULL::date, NULL::date, NULL, '552949');

INSERT INTO public.vehicles (
  id, make, model, year, color, daily_rate, vin, license_plate, current_mileage,
  fleet_status, show_on_site, in_service_on, out_of_service_on
)
SELECT md5('rwh-fleet:' || seed_key)::uuid, make, model, year, color, daily_rate, vin,
  license_plate, current_mileage, fleet_status, false, in_service_on, out_of_service_on
FROM fleet_seed
ON CONFLICT DO NOTHING;

INSERT INTO public.vehicle_external_refs (vehicle_id, source, external_id)
SELECT v.id, r.source, r.external_id
FROM fleet_seed s
JOIN public.vehicles v ON v.id = md5('rwh-fleet:' || s.seed_key)::uuid
CROSS JOIN LATERAL (VALUES ('turo', s.turo_id), ('wheelbase', s.wheelbase_id)) AS r(source, external_id)
WHERE r.external_id IS NOT NULL
ON CONFLICT DO NOTHING;

COMMIT;
