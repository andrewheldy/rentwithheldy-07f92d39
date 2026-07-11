# Rent With Heldy

Marketing and booking website for Rent With Heldy, a family-owned South Florida car rental company.

See `CLAUDE.md` for project context, business goals, and operating rules. Design and product source-of-truth documents live in `/docs`.

## Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn-ui component primitives
- React Router
- i18next (English, Spanish, French, Portuguese, Hebrew)
- Supabase (auth, database, edge functions)
- Vercel (hosting + `/api` serverless functions)

## Getting Started

Requires Node.js.

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in the Supabase variables (`VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`) — never commit real values.

**Package manager note:** local development is documented here with npm (`package-lock.json`). `bun.lock` and `bun.lockb` are also present in the repo, and commit history contains conflicting claims about which one Vercel actually uses to deploy. This has not been resolved — check the Vercel project's Install Command / detected framework before assuming either lockfile is authoritative for production deploys.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview a production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler in check-only mode |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run i18n:check` | Validate locale files for missing/stale/duplicate keys |
| `npm run i18n:scaffold` | Scaffold new locale keys from English source |

## Project Structure

- `src/pages` — routed pages
- `src/components` — shared and page-specific components (`src/components/ui` holds shadcn primitives)
- `src/i18n/locales` — translation files per locale
- `src/integrations/supabase` — Supabase client and generated types
- `supabase/` — database migrations and edge functions
- `api/` — Vercel serverless functions
- `docs/` — design, art direction, copy, and interaction source-of-truth documents
- `e2e/` — Playwright end-to-end specs
