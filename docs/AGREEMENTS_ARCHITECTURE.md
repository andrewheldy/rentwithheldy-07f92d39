# Agreements Architecture

## System boundary

The agreements feature remains inside the existing Vite/React application. Admin routes reuse Supabase Auth and the existing `admin` role. Public signers do not receive database access; they use a Vercel Function that validates an unguessable, hashed signer token with the server-only Supabase client.

## Data model

- `agreement_templates`: versioned template metadata and structured document definition.
- `agreements`: stable business identity, lifecycle status, current version, and execution/storage timestamps.
- `agreement_versions`: instantiated agreement data plus the immutable resolved document snapshot and SHA-256 hash frozen at send time.
- `agreement_signers`: version-scoped signer identity, role, requirement, signature method/artifact, consent, and safe audit timestamps.
- `agreement_signing_tokens`: one-way SHA-256 token hashes, signing/download purpose, expiration, revocation, and last-use metadata. Multiple active tokens allow a copied link without storing recoverable credentials.
- `agreement_events`: append-only legal/application audit history separate from product analytics.

All tables use RLS. Anonymous roles receive no table grants. Authenticated access is restricted to admins as defense in depth; public reads and signing use server-side validation only.

## Lifecycle and immutability

`draft → sent → partially_signed → executed`, with `sent|partially_signed → voided` and optional expiration.

Sending resolves the selected template and structured data into a canonical snapshot, computes its SHA-256 hash, freezes the version, creates signer-specific token hashes, and records the audit event. Database triggers prevent changes to frozen document content and material signer identity fields. The explicit revision operation atomically invalidates the active version, revokes its links, copies its structured data and parties into a new draft version, and requires fresh signatures. Executed agreements never return to draft.

## Server operations

- Admin list/create/read/update/send/remind/link/void/download operations validate the bearer session with Supabase Auth and verify the `admin` role server-side.
- Public review and sign operations accept the token in a POST body, set `Cache-Control: no-store`, validate token/version/status/expiry, and return only the signer-permitted snapshot.
- Signature completion is transactional in Postgres: it validates the token and frozen hash, records consent/signature metadata, revokes the signer's signing tokens, appends an event, and recalculates agreement status. A distinct download-only token is issued after execution; consumed signing credentials cannot regain access.
- Draft edits update the structured document and signer rows in one database transaction, preventing partial saves.
- The final required signature triggers PDF generation from the same structured snapshot, private Storage upload, and completion emails. Failures are recorded and can be retried without changing signatures.
- Completion emails use download-only tokens, so every party can retrieve the executed PDF without reopening signature authority.

## Rendering

Both canonical Google Drive agreements are represented as versioned, structured HTML templates:

- Vehicle Consignment & Rental Management Agreement — operator, owners, vehicles, revenue split, payment cadence, and trial dates.
- Long-Term Vehicle Rental Agreement — renter/license, vehicle, rental term/rates, insurance, permitted use, maintenance, return, and delivery-condition fields.

Staff edit the variable legal fields through typed HTML controls while the source-preserved legal prose remains versioned template content. Calendar popovers use the project's existing `react-day-picker`, `date-fns`, and Radix primitives, including month/year dropdown navigation, dependent end-date rules, and calculated term/expiration shortcuts. One pure rendering layer resolves variables and repeated parties/vehicles into a normalized document model. Admin preview and public signing share the React HTML document renderer; PDF generation consumes the same normalized model and signature records.

## Existing infrastructure reused

- Supabase Auth, role helper, database, RLS, and Storage.
- Resend transactional email and existing server-only environment pattern.
- Vercel Node Functions.
- Existing event-log conventions, React Router, TanStack Query, shadcn primitives, and global design tokens.

## New configuration

- `APP_BASE_URL`: canonical HTTPS origin used in signing and download links.
- Existing `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL` remain required.

No new email or storage provider is introduced.
