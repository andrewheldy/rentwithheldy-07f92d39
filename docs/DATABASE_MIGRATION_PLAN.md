# Supabase Migration Plan: Standalone Rent With Heldy Database

*Drafted 2026-09-24. Status: **proposal for review**. No SQL has been written or applied yet.*

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

- `vehicles.status` (`active`, `inactive`, `retired`), so ended consignments disappear from the public fleet without deleting history.
- `vehicle_external_refs (vehicle_id, source, external_id, unique(source, external_id))`, where `source` is `wheelbase` or `turo`. This ties synced revenue to the right car. Wheelbase vehicle IDs come from its fleet report (39 vehicles today).

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

- Turo has no public host API. The admin downloads the **earnings CSV** from the Turo host dashboard and uploads it on an admin page.
- The server parses the file and upserts `rental_bookings` and `rental_transactions` with `source = 'turo'`, keyed on the Turo reservation ID, so re-uploading overlapping date ranges doesn't double-count.
- Turo's host fee is recorded as `platform_fee_cents`. Whether it reduces the consigner's Rental Revenue is a **contract question** (see section 8).
- Each Turo vehicle is mapped once in `vehicle_external_refs`, using the Turo vehicle ID or the listing name as `external_id`.

## 5. Data migration

### 5.1 Before cutover
1. Export `acquisition_leads`, `leads`, `booking_inquiries` and `reservations` to CSV and store the files privately. That history is not migrated, but shouldn't be destroyed.
2. Freeze admin edits to agreements during the cutover window.

### 5.2 Copy order (new project, schema applied first)
1. **Auth users**: use `pg_dump` of `auth.users` and `auth.identities` from the old project into the new one. This keeps user IDs, so every `created_by`, `user_roles` and `profiles` foreign key stays valid, and keeps password hashes, so users don't have to reset. Google sign-in keeps working once the Google provider is configured on the new project.
2. `user_roles`, `profiles`.
3. `vehicles`, `vehicle_images` (some images are base64 inside the row; they copy as data).
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
- **Replace migrations:** a new baseline migration set for the new project replaces the 12 historical files. The old files move to `supabase/migrations_legacy/` for reference.
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
2. **Turo host fees:** does Turo's fee reduce the consigner's Rental Revenue before the split? The agreement's section 5 doesn't name platform fees. The same question applies to Wheelbase's service fee and owner fee.
3. **Expenses:** which categories are the owner's responsibility under section 8 of the agreement (insurance, maintenance, registration?), so `borne_by` defaults correctly?
4. **Payout cadence:** the template supports a monthly payment schedule plus quarterly reports. Should statements be generated monthly?
5. Should consigners see **per-booking** detail (dates and amounts, never renter identity) or only monthly totals?
6. Which Wheelbase API credential or scope can read bookings (section 4.1)?
7. Do any vehicles have multiple owners, or is it always one consigner per vehicle?
