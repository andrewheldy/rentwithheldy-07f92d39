# Supabase Migration Plan: Standalone Rent With Heldy Database

*Drafted 2026-09-24; updated the same day with the Turo earnings export and fleet roster findings (sections 3.2, 4.2, 4.3, 8, Appendix A). Schema and seed data applied to the new project on 2026-09-25; see "Implementation status" below.*

## Implementation status (2026-09-25)

New project: `damcyhiznlpykxskndes` ("Rent with Heldy"). `supabase/config.toml` points at it.

**Applied** (`supabase/migrations/`, which now holds only these six files; the previous project's migrations were deleted and remain in git history):

| Migration | Contents |
|---|---|
| `20260925003851_baseline_core` | Roles (`admin`, `consigner`, `user`), `vehicles`, `vehicle_images` + public bucket, `leads` (widened `form_type` CHECK), `acquisition_leads`, `profiles` |
| `20260925004751_agreements_esignature` | Agreement tables, RPCs, private `agreements` bucket, consignment template (unchanged from the old project) |
| `20260925004826_agreements_security_hardening` | Unchanged from the old project |
| `20260925004903_long_term_rental_template` | Unchanged from the old project |
| `20260925005546_consigners_and_profitability` | Sections 3.2 to 3.6: `vehicle_external_refs`, `consigners`, `consignments`, `rental_bookings`, `rental_transactions`, `vehicle_expenses`, `vehicle_unavailable_periods`, `owner_statements`, `owner_statement_lines`, `sync_runs`, `agreements.consigner_id`, RLS and dashboard views |
| `20260925024804_revoke_trigger_function_execute` | Removes API access to trigger functions (security advisor) |

**Data loaded:**
- **Fleet** (`supabase/seed/fleet_roster.sql`, idempotent): 43 vehicles (36 active, 3 retired, 4 inactive), 39 Turo IDs and 41 Wheelbase IDs. Seeded vehicles have `show_on_site = false`, so the public fleet pages keep their static fallback until photos and descriptions are added in `/admin`.
- **Turo history** from `trip_earnings_export_20260924.csv`: 2,298 `rental_bookings`, and 1,712 `rental_transactions` for completed trips and for cancellations that earned money. Guest names and pickup/return addresses were not stored. Completed trips total $260,349.66, which matches the export. Across all transactions: Rental Revenue $233,943.06, excluded $31,571.70, and $1,075.38 of cancellation fees and "Other fees" held as `unclassified` until question 2 in section 8 is answered.

**Differences from the proposal:**
- The lifecycle state is `vehicles.fleet_status` (`active`, `inactive`, `retired`), because the existing `vehicles.status` (`available`, `rented`, `maintenance`) is still used by the admin vehicle tools.
- `vehicles.show_on_site` controls public listing. `vin` is nullable only for non-active vehicles, since the three Ford Transits have no VIN yet.
- Anonymous visitors get column-level SELECT on `vehicles`, so `vin`, `license_plate` and mileage are not readable without an admin login.
- `rental_transactions` gains `rental_revenue_cents`, `unclassified_cents` and `unclassified_breakdown`.
- Turo transactions are dated on the trip end date for completed trips, and on the start date for cancellations.
- A consigner's login is linked automatically when an admin-created `consigners` row has the same email and the login's email is confirmed. The `consigner` role is granted at that point.

**Verified:**
- Anonymous visitors: no listed vehicles yet; cannot read VIN, plates, revenue, consigners or dashboards; can insert leads.
- A simulated consigner (rolled back) is linked and gets the role. They see only their own vehicle, and only transactions from their consignment start date (38 of 56 for the test car). They see nothing from `v_fleet_profitability` or `leads`.

**Not done yet** (sections 5 and 6):
- Auth users, user roles and profiles.
- Existing agreements and storage objects.
- Old website `vehicles` rows and photos.

The old project isn't reachable from this tooling. These need a `pg_dump` from the old project, or its connection string.

## 0. Decisions already made

| Question | Decision |
|---|---|
| Website lead tables | Keep `leads` (quote/contact forms, `/admin/leads`). Drop retired tables (`reservations`, `booking_inquiries`, `vehicle_categories`, `event_logs`) and their two edge functions. |
| Revenue source for profitability | Wheelbase sync **plus** Turo import. |
| Scope of this pass | Plan document only. Schema SQL and UI come after this plan is approved. |
| Existing data | Migrate core data: vehicles, vehicle images, users, roles, profiles, and **all** agreements. Leave lead history behind. |

## 1. Goal

Move the site off the current Supabase project onto a new project in a new account, keeping only what the business needs:

1. **Auth**: admin and consigner accounts (email/password and Google).
2. **Vehicle profitability metrics**: revenue, expenses, utilization per vehicle.
3. **Consigner accounts**: people who consign a car can sign up, sign their consignment agreement, and log in.
4. **Consigner dashboards**: each consigner sees profitability for *their* vehicles only.
5. **Public site support**: fleet pages and website lead capture keep working.

Non-goals for this migration: customer (renter) accounts, an in-house booking engine (booking stays on the hosted Wheelbase store), analytics/event logging.

## 2. Current inventory and what happens to each piece

Source project today: `zggucizaopvjupfqfzhf` (`supabase/config.toml`). **Confirm this is the "HeldyOS-integrated" database being left behind.** The Supabase account connected to this repo's tooling only shows a different, inactive project named `HELDYOS` (`ufffzumtrwrxnvaqmrvl`).

| Object | Used by (code) | Decision |
|---|---|---|
| `app_role` enum, `user_roles`, `has_role()` | `AuthContext`, `ProtectedRoute`, every admin RLS policy, agreements server | **Keep**, and add a `consigner` role |
| `profiles` + `handle_new_user_profile` trigger | `/profile` | **Keep**, and extend for consigners (see 3.1) |
| `vehicles` | Fleet pages, `useVehicles`, admin vehicle tools | **Keep**, and add ownership and external-ID links |
| `vehicle_images` + `vehicle-images` bucket | Fleet photos, `/admin/photos`, `/addcars` | **Keep** |
| `leads` | All quote/contact forms, `/admin/leads` | **Keep**, with the widened `form_type` CHECK from `20260924220000_relax_leads_form_type.sql` built in |
| `acquisition_leads` | `/list-your-vehicle` and `/drive-for-work` funnels via `api/submit-acquisition-lead.ts` | **Keep** (it is the consigner sign-up pipeline). Per the "leave lead history behind" decision, existing rows are **not** copied; export them to CSV first (see 5.1) |
| Agreement tables (`agreement_templates`, `agreements`, `agreement_versions`, `agreement_signers`, `agreement_signing_tokens`, `agreement_events`), their RPCs and triggers, and the private `agreements` bucket | `/admin/agreements*`, `/sign/*`, `api/agreements.ts`, `api/signing.ts`, `api/agreement-actions.ts` | **Keep unchanged** (legal records), and add a consigner link (see 3.3) |
| `reservations` | `/confirmation/:id` page, `create-reservation` edge function | **Drop**. Retire the route and redirect it to `/book` |
| `booking_inquiries` | `BookingDialog` (unreachable), `/admin/leads` inquiries tab | **Drop**. Remove the tab and the dead component |
| `vehicle_categories` | `useCategories`, `CategoryCard` (unrouted) | **Drop**. Delete the dead hook and component |
| `event_logs` | `/admin/leads` events tab, `create-reservation` | **Drop** |
| Edge functions `check-availability`, `create-reservation` | Only reachable from retired flows | **Do not deploy** to the new project |
| Migration `20260418022543` (seeds the admin login with a hard-coded password) | none | **Do not replay.** Create the admin user through the dashboard. **Rotate that password now**, because it is in git history |

## 3. Target schema

Conventions: money is stored as **integer cents** (Wheelbase already reports cents). All tables have RLS on. All dashboard views are `security_invoker = on`, so RLS applies to them. Timestamps are `timestamptz`.

### 3.1 Auth, roles, profiles

- `app_role` enum becomes `('admin', 'consigner', 'user')`.
- `user_roles (user_id, role)` stays as is. An admin grants `consigner` when a consignment starts (see 3.3). Roles are never self-assigned.
- `profiles` keeps `full_name`, `phone`, `preferred_language`, `marketing_opt_in`. The trigger that auto-creates a profile on sign-up stays.
- Supabase Auth settings to recreate: Site URL `https://rentwithheldy.com`, redirect URLs (production, `www`, Vercel previews, `/profile`, `/auth`), Google OAuth provider (new Supabase callback URL added in Google Cloud Console), and email templates.

### 3.2 Fleet (public site)

`vehicles` keeps its current columns (the public select must still exclude `vin`, `license_plate`, `initial_mileage`). New:

- `vehicles.status` (`active`, `inactive`, `retired`), so ended consignments and totaled cars disappear from the public fleet without deleting history.
- `vehicles.vin`: required, unique, and stored **uppercase only**. A rule rejects anything else (`vin ~ '^[A-HJ-NPR-Z0-9]{17}$'`). Every VIN from Wheelbase, Turo or manual entry is trimmed and uppercased before it's saved or compared, because both platforms export some VINs in lowercase (see 4.3).
- `vehicle_external_refs (vehicle_id, source, external_id, unique(source, external_id))`, where `source` is `wheelbase` or `turo`. This ties synced revenue to the right car:
  - Wheelbase: the Wheelbase vehicle ID from its fleet report.
  - Turo: the Turo vehicle ID from the earnings export.
- **Identity rule:** our own `vehicles.id` is the key everything references. The VIN is how a platform record gets matched to it. Platform IDs are attached to it as aliases. Names and plates are never used for matching (see 4.3 for why).

`vehicle_images` and the public `vehicle-images` bucket are unchanged.

### 3.3 Consigners and contracts

- **`consigners`**: `id`, `user_id` (nullable, references `auth.users`, filled when the person creates their login), `legal_name`, `email`, `phone`, `mailing_address`, `status` (`prospect`, `active`, `ended`), `acquisition_lead_id` (nullable, where they came from), `payout_method` (`ach`, `check`, `zelle`, `other`), `payout_reference` (free-text label only; **never store bank account or routing numbers**), timestamps.
- **`consignments`**: one row per vehicle under an agreement term. Columns: `consigner_id`, `vehicle_id`, `agreement_id`, `owner_percent`, `operator_percent`, `effective_from`, `effective_to` (null while active), `status`, and `CHECK (owner_percent + operator_percent = 100)`.
  - Percentages are copied from the **executed** agreement version's `agreement_data.economics` when the agreement is executed, so later edits can't change the terms retroactively.
  - An amendment (for example after the 3-month trial review) closes the old row (`effective_to`) and opens a new one. Past periods keep being calculated at the old split.
- **Agreements**: tables stay as they are. Add `agreements.consigner_id` (nullable) so a consigner can see their own signed contracts and download the final PDF. Signing itself stays token-based: consigners do **not** need an account to sign.

**Onboarding flow the schema supports:**
1. The prospect submits `/list-your-vehicle`, which creates a row in `acquisition_leads`.
2. Admin qualifies the lead and creates a `consigners` row (status `prospect`), linked to the lead.
3. Admin creates the consignment agreement (existing `/admin/agreements/new`), linked to the consigner. The consigner signs via the emailed token link.
4. On execution: `consignments` rows are created per vehicle, the consigner becomes `active`, and an invite email lets them create a login. On sign-up, the `user_id` is matched by email and the `consigner` role is granted.
5. The consigner logs in and sees their dashboard.

### 3.4 Profitability data

| Table | Purpose | Key columns |
|---|---|---|
| `rental_bookings` | One row per rental from any source | `source`, `external_booking_id` (unique per source), `vehicle_id`, `start_at`, `end_at`, `rental_days`, `status`, `gross_cents`, `raw jsonb`, `synced_at` |
| `rental_transactions` | Money actually collected, refunded or charged. The contract says revenue counts only once **collected**, so this ledger drives earned revenue | `source`, `external_id` (unique per source), `booking_id`, `category` (`charge`, `refund`, `fee`, `payout`), `amount_cents`, `sales_tax_cents`, `processing_fee_cents`, `platform_fee_cents`, `excluded_cents`, `excluded_breakdown jsonb`, `collected_on`, `raw jsonb` |
| `vehicle_expenses` | Admin-entered costs | `vehicle_id`, `incurred_on`, `category` (`maintenance`, `repair`, `cleaning`, `delivery`, `insurance`, `registration`, `unrecovered_tolls`, `parking`, `marketing`, `other`), `amount_cents`, `borne_by` (`operator` or `owner`), `notes`, `receipt_path` (private bucket), `created_by` |
| `vehicle_unavailable_periods` | Owner-use or shop days, so utilization isn't penalized | `vehicle_id`, `starts_on`, `ends_on`, `reason` |
| `owner_statements` | The payment and quarterly-report record the contract requires | `consigner_id`, `period_start`, `period_end`, `rental_revenue_cents`, `owner_share_cents`, `owner_expenses_cents`, `adjustments_cents`, `net_payable_cents`, `status` (`draft`, `issued`, `paid`), `issued_at`, `paid_at`, `pdf_path` |
| `owner_statement_lines` | Per-vehicle, per-booking detail behind a statement | `statement_id`, `vehicle_id`, `booking_id`, `rental_revenue_cents`, `owner_percent`, `owner_share_cents` |
| `sync_runs` | Audit of each Wheelbase sync or Turo import | `source`, `started_at`, `finished_at`, `status`, `rows_upserted`, `error` |

**"Rental Revenue" follows the consignment agreement (section 5).** It is money actually collected for use of the vehicle, **minus**:
- sales and rental tax
- refunds and chargebacks
- tolls, fuel, damage, and insurance or claims proceeds
- delivery and other separately provided services, which Rent With Heldy keeps

Each excluded amount is recorded in `excluded_breakdown`, so a consigner statement can show exactly what was excluded and why.

### 3.5 Dashboard views

| View | Grain | Metrics |
|---|---|---|
| `v_vehicle_monthly_performance` | vehicle × month | rental days, available days, utilization %, gross collected, rental revenue, average daily rate, revenue per available day, owner share, operator share, owner-borne expenses, net to owner |
| `v_consigner_summary` | consigner × month | totals of the above across the consigner's vehicles, plus paid and outstanding statements |
| `v_fleet_profitability` (admin only) | vehicle × month | above plus operator-borne expenses and operator net profit |

The owner/operator split for a month uses the `consignments` row effective on each booking's collection date. Available days are days under an active consignment minus `vehicle_unavailable_periods`.

### 3.6 Access rules (RLS)

| Data | Anonymous visitor | Consigner | Admin |
|---|---|---|---|
| `vehicles` (public columns), `vehicle_images` | read active vehicles | read | full |
| `leads`, `acquisition_leads` | insert only (acquisition via server API) | none | full |
| `consigners` | none | read own row | full |
| `consignments`, `rental_bookings`, `rental_transactions`, `vehicle_unavailable_periods` | none | read rows for **their** vehicles, within their consignment dates | full |
| `vehicle_expenses` | none | read rows with `borne_by = 'owner'` for their vehicles | full |
| `owner_statements`, `owner_statement_lines` | none | read own, `issued` and `paid` only | full |
| Agreements | none (signing goes through server APIs) | read own executed agreements and final PDF | full |
| `v_fleet_profitability` | none | none | read |

A consigner who ends a consignment still sees history for the period they were the owner, but nothing after `effective_to`.

## 4. Revenue integrations

### 4.1 Wheelbase (automated)

- A scheduled Vercel function (for example `api/cron/sync-wheelbase`, daily) uses a Wheelbase API credential stored as a Vercel secret. It upserts vehicles into `vehicle_external_refs`, bookings into `rental_bookings`, and the payment ledger into `rental_transactions`. Upserts are idempotent on `(source, external_id)`.
- **What Wheelbase already provides** (checked with the current integration):
  - The fleet report gives each vehicle's ID, VIN and an `owner { name, consigned }` flag, so consigned cars can be matched automatically.
  - The transactions ledger gives amounts in cents, split into card fee, sales tax, owner fee and service fee, each tied to a booking ID.
- **Open blocker:** the current Wheelbase credential returns the ledger but **no booking details** (booking list is empty, and a booking referenced by a transaction returns "not found"). The sync needs a credential that can read bookings, which carry the vehicle and the line items (delivery, tolls, fuel) used to compute Rental Revenue. Confirm with Wheelbase which API key or scope allows this.

### 4.2 Turo (import)

Turo has no public host API. The admin downloads the **trip earnings CSV** from the Turo host dashboard and uploads it on an admin page. The server parses it and upserts `rental_bookings` and `rental_transactions` with `source = 'turo'`.

**What the export contains** (checked against `trip_earnings_export_20260924.csv`: 2,298 trips across 39 Turo vehicles, trip starts from Dec 2025 into Nov 2026):

- **One row per reservation.** `Reservation ID` is unique and is the idempotency key, so re-uploading overlapping date ranges updates rows instead of duplicating them.
- **Vehicle identity:**
  - Every row has `Vehicle id` (Turo's vehicle ID) and `VIN`, and the two map one-to-one.
  - `Vehicle name` is **not** unique: three cars are each "Volkswagen Jetta 2019" and three are "Chevrolet Equinox 2020".
  - The plate appears only inside the free-text `Vehicle` column, e.g. `(FL #FKDA27)`.
- **Trip status** is one of `Completed` (1,633), `Guest cancellation` (538), `Booked` (111), `In-progress` (9) or `Host cancellation` (7). Future trips appear too, so a row's status changes between uploads and each re-import updates it.
- **Money** is formatted like `$1,039.50`, with negatives written as `- $6.06`. The parser converts these to integer cents.
- **Turo's fee is already taken out.** On every completed trip, `Total earnings` equals the sum of the line-item columns exactly, and there is no Turo-fee column. So the export is already the **host's share after Turo's cut**; it totals $260,349.66 on completed trips.
- **Sales tax is always $0.** Turo remits the tax, so nothing needs subtracting for it.
- **Trip times have no timezone.** They're treated as America/New_York.
- **The `Guest` column holds renter names.** The importer drops it and never stores it.

**Proposed mapping of export columns to the contract's "Rental Revenue" (agreement section 5):**

| Treatment | Columns |
|---|---|
| **Included** in Rental Revenue (payment for use of the vehicle) | Trip price, Boost price, all discount columns (these are negative), Non-refundable discount, Early bird discount, Host promotional credit, Excess distance, Additional usage, Late fee |
| **Excluded**, pass-through or reimbursement (tolls, fuel, fines, damage) | Tolls & tickets, Gas reimbursement, Gas fee, On-trip EV charging, Post-trip EV charging, Fines (paid to host), Airport operations fee, Airport parking credit |
| **Excluded**, kept by Rent With Heldy (delivery and separately provided services) | Delivery, Extras |
| **Excluded**, covers cleaning and turnover cost | Cleaning, Smoking, Improper return fee |
| **Needs a decision** (section 8) | Cancellation fee, Other fees |

Each excluded amount is saved in `excluded_breakdown`, so an owner statement shows exactly what was left out. The importer also checks that included + excluded + needs-a-decision equals `Total earnings` for every row. If a row doesn't balance, or has a column the importer has never seen, the import stops instead of guessing.

**Vehicle matching on import:**
1. Look up `Vehicle id` in `vehicle_external_refs (source = 'turo')`.
2. Confirm that the row's VIN, uppercased, equals the mapped vehicle's VIN.
3. If the vehicle ID is unmapped, or the VIN disagrees, stop the import and list the vehicle for an admin to map. Never match by name or plate.

### 4.3 Vehicle matching and fleet reconciliation

The fleet roster (Appendix A) was checked against the Turo export and the Wheelbase fleet report.

**Findings:**
- **VIN is the right shared key.**
  - All 39 Turo vehicles have a valid VIN.
  - The 36 cars on both platforms match by VIN.
  - Wheelbase's `internal_id` already holds the Turo vehicle ID for 34 of them.
- **Case differs across platforms.**
  - Turo exports five VINs in lowercase or mixed case (2014 Audi A4, 2017 Subaru Forester, 2018 Jeep Renegade, 2023 VW Taos, 2024 Audi Q5).
  - Wheelbase stores the Subaru's VIN in lowercase.
  - Normalizing to uppercase (3.2) makes this harmless.
- **Plates can't be trusted as keys.**
  - Plate `24FYRG` is on two Wheelbase records (the 2018 Honda Pilot and the archived 2020 Passat).
  - Hand-typed plates drift between sources. The 2017 Kia Optima was mistyped on the internal spreadsheet (now fixed). The 2017 Subaru Forester's correct plate `DJ02ZS` (zero) is entered as `DJO2ZS` (letter O) on **both** Turo and Wheelbase.
- **Names can't be trusted as keys.** Model names repeat within the fleet: three "Volkswagen Jetta 2019" and three "Chevrolet Equinox 2020".

**Vehicle status at migration:**

| Vehicle | Turo ID | Status | Note |
|---|---|---|---|
| 36 active vehicles in Appendix A | see table | `active` | |
| 2020 Volkswagen Passat | 3562252 | `retired` | Totaled. Keep all 24 trips of history |
| 2017 Mercedes-Benz GLE-Class | 3674313 | `retired` | Totaled. Keep all 19 trips of history |
| 2021 BMW X3 | 3741006 | `retired` | One trip (May 28, 2026). Included so the Turo history imports cleanly |
| 2016 BMW X3 (Wheelbase 544415), three Ford Transits (Wheelbase 553000, 552990, 552949) | none | `inactive` | In Wheelbase, unpublished, never on Turo. The Transits have no VIN yet, and one must be entered before they can go active |

**Cleanup to do in Wheelbase before the first sync:**
1. Add the white 2019 Volkswagen Jetta (VIN `3VWE57BU1KM119169`, plate `STLN58`, Turo `3906429`). It's active on Turo with trips into November, but it isn't in Wheelbase.
2. Set the 2014 Honda Accord's (Wheelbase 529774) `internal_id` to `3270598`. It currently holds its own Wheelbase ID.
3. Set the 2023 Chevrolet Equinox's (Wheelbase 510814) `internal_id` to `3582591`. It's currently `510814-3582591`.
4. Uppercase the 2017 Subaru Forester's VIN.
5. Correct the 2017 Subaru Forester's plate from `DJO2ZS` (letter O) to `DJ02ZS` (zero) in Wheelbase, **and in Turo**.

With the Turo vehicle IDs on the roster, `vehicle_external_refs` can be seeded directly for every vehicle. The Wheelbase `internal_id` then becomes a cross-check, not a source of truth.

## 5. Data migration

### 5.1 Before cutover
1. Export `acquisition_leads`, `leads`, `booking_inquiries` and `reservations` to CSV and store the files privately. That history is not migrated, but shouldn't be destroyed.
2. Freeze admin edits to agreements during the cutover window.

### 5.2 Copy order (new project, schema applied first)
1. **Auth users**: use `pg_dump` of `auth.users` and `auth.identities` from the old project into the new one. This keeps user IDs, so every `created_by`, `user_roles` and `profiles` foreign key stays valid, and keeps password hashes, so users don't have to reset. Google sign-in keeps working once the Google provider is configured on the new project.
2. `user_roles`, `profiles`.
3. `vehicles`, `vehicle_images` (some images are base64 inside the row; they copy as data).
   - **Vehicles are rebuilt from the reconciled roster (Appendix A plus the retired and inactive cars in 4.3), keyed by uppercase VIN.** Each existing website `vehicles` row is matched to the roster by VIN, so its photos and public description carry over.
   - An old row with no VIN, or with a VIN that isn't on the roster, is listed for manual review instead of being copied blindly.
   - `vehicle_external_refs` is seeded from the roster: the Turo vehicle ID for every vehicle, and the Wheelbase ID wherever the car exists in Wheelbase.
4. Storage: copy every object in `vehicle-images` (public) and `agreements` (private) to the same paths.
5. Agreements: templates, then agreements, versions, signers, signing tokens, events. Load with `session_replication_role = replica`, so the immutability triggers (which block edits to signed records) don't reject the bulk insert. Switch back to `origin` immediately after.
6. **Verify agreements byte-for-byte**:
   - Row counts match.
   - Every frozen version's `document_hash` matches its stored `rendered_content`.
   - Every executed agreement's `final_pdf_path` object exists and has the same SHA-256 as the old copy.
   - Every drawn signature artifact exists.
7. Create `consigners` and `consignments` rows for existing executed consignment agreements (from their `agreement_data`), then send those owners a login invite.

### 5.3 Application config at cutover
- **Vercel env vars** (Production and Preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and later `WHEELBASE_API_KEY`.
  - Today production has **none of the Supabase variables**, which is why every database save from the site currently fails (see PR #20).
- Update `supabase/config.toml` `project_id`, and regenerate `src/integrations/supabase/types.ts` from the new project.
- Redeploy. Smoke test:
  - login (email and Google) and admin routes
  - fleet photos
  - each quote form writes a `leads` row
  - `/list-your-vehicle` writes an `acquisition_leads` row
  - an existing executed agreement's PDF opens
  - a test agreement can be sent and signed end to end

### 5.4 Rollback
The old project stays untouched and read-only until the new one has run cleanly for about 2 weeks. Rollback is reverting the Vercel env vars to the old project and redeploying. Anything created in the new project during that window (new leads, new signatures) must be copied back by hand, so keep the window short.

## 6. Code changes this plan implies (for the build phase)

- **Remove:**
  - `src/pages/Confirmation.tsx` and its route (redirect to `/book`)
  - `src/components/BookingDialog.tsx`, `src/hooks/useCategories.ts`, `src/components/CategoryCard.tsx`
  - the inquiries and events tabs in `AdminLeads`
  - `supabase/functions/*`
- **Replace migrations:** done. A new baseline migration set replaces the 12 historical files. The old files were deleted and remain in git history.
- **Add:**
  - Consigner role handling in `AuthContext` and `ProtectedRoute`
  - Consigner dashboard pages
  - Admin screens for consigners, expenses, unavailable periods, the Turo upload and statements
  - The Wheelbase sync function
- **Fix:** AdminLeads' `body-shop` filter option (real rows use `body-shop-delivery`).

## 7. Suggested build order after approval

1. Baseline schema and RLS in the new project. Add automated RLS tests: a consigner cannot read another consigner's rows.
2. Data migration dry run into a scratch project, with the section 5.2 verification.
3. Cutover (5.3).
4. Consigner onboarding (roles, invite, `consigners` and `consignments` on execution).
5. Wheelbase sync, then the Turo import.
6. Admin expense entry, then consigner dashboard, then statements.

## 8. Open questions for Rent With Heldy

1. Is `zggucizaopvjupfqfzhf` the database being replaced (section 2)?
2. **Platform fees:** the Turo export is already net of Turo's fee (4.2), so the natural reading is that the owner's percentage applies to the **post-fee** amount. Please confirm. The same question applies to Wheelbase's service fee and owner fee, which do appear separately in its ledger.
   - **Cancellation fees:** 538 guest cancellations appear in the export, and some of them earned a cancellation fee. Do those fees count as Rental Revenue that gets split with the owner?
   - **"Other fees":** 16 distinct values appear in this column. Do they count as Rental Revenue, or are they excluded?
3. **Expenses:** which categories are the owner's responsibility under section 8 of the agreement (insurance, maintenance, registration?), so `borne_by` defaults correctly?
4. **Payout cadence:** the template supports a monthly payment schedule plus quarterly reports. Should statements be generated monthly?
5. Should consigners see **per-booking** detail (dates and amounts, never renter identity) or only monthly totals?
6. Which Wheelbase API credential or scope can read bookings (section 4.1)?
7. Do any vehicles have multiple owners, or is it always one consigner per vehicle?

## Appendix A. Active fleet roster (reconciled 2026-09-24)

These are the 36 active vehicles as supplied by Rent With Heldy. Every row was checked against the Turo trip earnings export, and VIN and Turo vehicle ID agree on all 36. VINs are shown normalized to uppercase. Plates match Turo and Wheelbase for every vehicle except the 2017 Subaru Forester (see below). This table is the seed for `vehicles` and `vehicle_external_refs (source = 'turo')` at migration. A sold 2017 Subaru Forester that was on the source spreadsheet is intentionally left out.

| # | Vehicle (roster label) | VIN | Plate | Turo vehicle ID |
|---|---|---|---|---|
| 1 | 2014 Audi A4 BLK | `WAUBFAFL9EN040664` | `88EUVM` | 3080125 |
| 2 | 2014 Honda Accord SIL | `1HGCR3F83EA035670` | `EB41DB` | 3270598 |
| 3 | 2015 Honda Fit SIL | `3HGGK5H80FM780122` | `DY18ZM` | 3224033 |
| 4 | 2015 Kia Optima SIL | `5XXGN4A75FG492860` | `LD416T` | 3575002 |
| 5 | 2015 Mazda CX-5 GRY 2835 | `JM3KE2CYXF0492835` | `07VCLL` | 3750194 |
| 6 | 2015 Merc E350 GRY | `WDDHF8JB5FB088532` | `EB19IY` | 3269497 |
| 7 | 2015 VW Jetta SIL | `3VW2K7AJ8FM409367` | `FKDA26` | 3296058 |
| 8 | 2016 Toyota Camry GRY | `4T4BF1FK9GR545589` | `91VBGJ` | 3524535 |
| 9 | 2017 Chevy Suburban BLK | `1GNSCGKC2HR377153` | `EB40DB` | 3295951 |
| 10 | 2017 Ford Edge BRO | `2FMPK4J97HBB14256` | `78FCDC` | 3073716 |
| 11 | 2017 Kia Optima SIL | `5XXGT4L30HG161266` | `XQP946` | 3707283 |
| 12 | 2017 Subaru Forester WHI | `JF2SJAAC8HH507036` | `DJ02ZS` | 3087797 |
| 13 | 2018 Chevy Tahoe Beige | `1GNSCAKC1JR345278` | `17GCGT` | 3606751 |
| 14 | 2018 GMC Yukon WHI | `1GKS1FKC7JR398793` | `92VBGJ` | 3527009 |
| 15 | 2018 Honda Pilot WHI | `5FNYF5H11JB031725` | `24FYRG` | 3694394 |
| 16 | 2018 Jeep Renegade ORG | `ZACCJABB0JPH13460` | `38FPIQ` | 3494909 |
| 17 | 2019 Audi Q5 GRY | `WA1ANAFY4K2081157` | `DJ00ZS` | 3172654 |
| 18 | 2019 Chevy Express WHI | `1GAZGMFP5K1356514` | `18GCGT` | 3609296 |
| 19 | 2019 Honda CRV GRY | `7FARW1H81KE038335` | `32FVTU` | 3428775 |
| 20 | 2019 VW Atlas BLU | `1V2WR2CA8KC567167` | `08VCLL` | 3633287 |
| 21 | 2019 VW Jetta BLU | `3VWC57BU3KM109203` | `FGJS04` | 3271393 |
| 22 | 2019 VW Jetta RED | `3VWC57BU8KM079101` | `FDMY01` | 3233670 |
| 23 | 2019 VW Jetta WHI | `3VWE57BU1KM119169` | `STLN58` | 3906429 |
| 24 | 2020 Chev Equinox WHI | `3GNAXKEV3LS661445` | `EB42DB` | 3271620 |
| 25 | 2020 Chevy Equinox BLK | `2GNAXHEV3L6264271` | `FDDH36` | 3325188 |
| 26 | 2020 Chevy Equinox SIL | `2GNAXKEV9L6122875` | `81GCGS` | 3599034 |
| 27 | 2020 Infiniti QX60 BRO | `5N1DL0MN0LC500558` | `02FRST` | 3559928 |
| 28 | 2020 Toyota Corolla BLK | `5YFEPRAE5LP096217` | `FDMY03` | 3282329 |
| 29 | 2021 Kia Soul BLU | `KNDJ63AU8M7738907` | `DS17XA` | 3267675 |
| 30 | 2022 Audi A4 BLK | `WAUABAF44NA015999` | `99ANCI` | 3179131 |
| 31 | 2022 Honda Odyssey WHI | `5FNRL6H58NB049215` | `93VBGJ` | 3524513 |
| 32 | 2022 Kia Soul RED | `KNDJ23AUXN7149998` | `51FPIQ` | 3518985 |
| 33 | 2023 Chevy Equinox BLK | `3GNAXKEG8PL235090` | `49FRSS` | 3582591 |
| 34 | 2023 VW Taos GRY | `3VVCX7B2XPM363964` | `FKDA27` | 3049985 |
| 35 | 2023 VW Tiguan BLK | `3VVRB7AX4PM088288` | `65FRRZ` | 3596268 |
| 36 | 2024 Audi Q5 GRY | `WA1EAAFY6R2013451` | `86EUVM` | 2995422 |

**Reconciliation status:** VIN and Turo vehicle ID agree across the roster, Turo and Wheelbase for all 36 active vehicles.

One plate fix remains, on the platforms: the 2017 Subaru Forester's plate is `DJ02ZS` (zero), but Turo and Wheelbase both have `DJO2ZS` (letter O). This doesn't affect matching, which uses VIN and Turo ID. It's listed as Wheelbase cleanup step 5 in 4.3.

Not on this roster, but carried into the new database (see 4.3): the 2020 Passat and 2017 GLE (`retired`, totaled), the 2021 BMW X3 (`retired`), and the 2016 BMW X3 and three Ford Transits (`inactive`).
