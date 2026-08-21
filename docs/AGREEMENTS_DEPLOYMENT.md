# Agreements Production Deployment

## Status

- **Date checked:** 2026-08-19
- **Migration status:** Blocked before application
- **Production smoke test:** Not run
- **Production readiness:** Not established

No production SQL, storage objects, agreement records, invitations, or customer emails were created during this preflight.

## Target-project preflight

The repository and `docs/REDESIGN_BLUEPRINT.md` identify Supabase project reference `zggucizaopvjupfqfzhf`. The current authenticated Supabase connection cannot inspect or manage that project, and it is not present in the connection's project list.

The connection can access a different healthy project named `rentwithheldy-07f92d39`, reference `tubvbwonzdxyejuwlpcd`. Read-only metadata checks show that project currently has:

- zero Supabase migration-history entries;
- zero Auth users;
- no `public.user_roles`, `public.vehicles`, or agreement tables;
- zero Storage buckets.

The matching name is not sufficient evidence that this empty project should replace the repository's documented project. The project-reference mismatch must be resolved before linking or applying migrations.

## Expected migrations

- `20260818200704_agreements_esignature.sql` — primary schema, RLS, private Storage bucket, transactional functions, and initial structured template.
- `20260819201412_agreements_security_hardening.sql` — forward-only relationship, least-privilege, and audit-immutability hardening prepared during production review.
- `20260819204146_add_long_term_rental_template.sql` — identifies the existing consignment data kind and adds the source-preserved Long-Term Vehicle Rental Agreement as a second editable HTML template.

If the empty `tubvbwonzdxyejuwlpcd` project is confirmed as production, every repository migration is currently pending, not only the agreement migrations. Review the entire pending set before using `supabase db push`.

## Migration review outcome

The primary migration is additive and does not reset, drop, or truncate production data. The forward hardening migration:

- removes unnecessary authenticated write privileges and sequence access;
- enforces agreement/version/signer/token relationship consistency with composite foreign keys;
- makes frozen version identity, signed audit material, and executed lifecycle identity immutable;
- requires valid document-hash format and coherent token/event timestamps and relationships;
- deliberately fails on inconsistent historical rows instead of silently rewriting legal or audit data.

All agreement migration files parse successfully with a PostgreSQL 18 grammar parser. Database execution and advisor checks remain pending against the confirmed target.

## Vercel production environment

Project: `andrewheldyai-7144s-projects/rentwithheldy-07f92d39`

| Variable | Production status |
| --- | --- |
| `RESEND_API_KEY` | Configured |
| `SUPABASE_URL` | Missing |
| `SUPABASE_SECRET_KEY` | Missing |
| `RESEND_FROM_EMAIL` | Missing |
| `APP_BASE_URL` | Missing |
| `VITE_SUPABASE_URL` | Missing |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Missing |

The current production browser bundle uses the application's unconfigured Supabase fallback, confirming that client Supabase configuration was absent at build time. No secret values were printed or copied into the repository.

## Remaining deployment gates

1. Confirm whether production is the documented `zggucizaopvjupfqfzhf` project or the empty accessible `tubvbwonzdxyejuwlpcd` project.
2. Ensure the deployment operator has access to the confirmed project and inspect its actual migration history before applying anything.
3. Configure the missing Vercel production variables with correct production scoping; use a verified Resend sender.
4. Apply only pending migrations without `db reset`, then independently verify tables, constraints, RLS, policies, grants, functions, triggers, advisors, and the private bucket.
5. Deploy the agreement code and run a controlled end-to-end test using explicit test recipients only.
6. Obtain Florida counsel approval before real customer use.

## Recovery considerations

Supabase applies each migration transactionally. If the hardening migration detects inconsistent rows, investigate the conflicting records and create a reviewed forward repair; do not disable constraints or rewrite migration history. The migrations are additive, so application rollback can deploy the prior application version while leaving the dormant schema intact. Removing production agreement schema or data is not an approved rollback strategy.
