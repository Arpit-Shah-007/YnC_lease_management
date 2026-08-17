# Y&C Lease Management

Internal lease management dashboard for the Y&C franchise group (Wendy's + Taco Bell locations). Tracks lease terms, CAM reconciliation, and portfolio data across all stores, with AI-assisted lease document extraction.

## Features

- **Portfolio dashboard** — browse all locations with key facts (rent, term, square footage, expiry)
- **Lease detail pages** — full lease terms per location, with a printable PDF summary
- **CAM audit** — common area maintenance reconciliation per lease, including AI comparison of estimate vs. reconciliation documents per year
- **AI lease extraction** — upload a lease PDF and extract structured terms automatically via Groq
- **Admin tools** — manage users, brands, and locations
- **Role-based auth** — Supabase Auth for identity, with `admin` / `user` roles resolved from the `app_users` table
- **Portfolio map** — store locations plotted on an interactive Leaflet map

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack) + React 19 + TypeScript
- [Supabase](https://supabase.com/) (Postgres, Auth, Storage)
- [Groq](https://groq.com/) for AI-powered lease and CAM document extraction
- [Leaflet](https://leafletjs.com/) for the portfolio map
- [`@react-pdf/renderer`](https://react-pdf.org/) for the lease summary PDF, `sharp` for static map images
- `pdf-parse` for document text extraction

## Getting Started

### Prerequisites

- Node.js 20+ (developed on 24)
- A [Supabase](https://supabase.com/) project
- A [Groq](https://console.groq.com/keys) API key

### Setup

1. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/Arpit-Shah-007/YnC_lease_management.git
   cd YnC_lease_management
   npm install
   ```

2. Copy the env template and fill in your own values:

   ```bash
   cp .env.local.example .env.local
   ```

   | Variable | Description |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, bypasses RLS) |
   | `GROQ_API_KEY` | Groq API key for lease and CAM extraction |
   | `NEXT_PUBLIC_SITE_URL` | Public site origin, used to build Supabase auth redirect links |

3. Set up your Supabase database, auth, storage, and SMTP. The full run order, schema/seed scripts, and a few Supabase-specific gotchas are in `data/database/Supabase_Initialization.md`, with SQL under `data/database/sql/`. That directory holds confidential lease data and is deliberately kept out of version control, so ask the repo owner for a copy.

4. Create your login. There are no seeded credentials: add a user in the Supabase dashboard under **Authentication → Users**, then insert a matching row in `app_users` with the role you want:

   ```sql
   insert into app_users (email, role) values ('you@example.com', 'admin');
   ```

   A Supabase Auth user with no `app_users` row can sign in but is treated as having no role, and every data route will refuse them.

5. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and log in.

### Other Scripts

```bash
npm run build   # production build
npm run start   # run a production build locally
npm run lint    # eslint
npm test        # unit tests (node:test via tsx)
```

## Project Structure

```
src/
├── app/                 # Next.js routes (App Router)
│   ├── admin/           # admin pages (users, locations)
│   ├── api/             # API routes (lease PDF, locations, extraction, admin)
│   ├── dashboard/       # portfolio dashboard
│   ├── lease/[id]/      # lease detail pages
│   └── login/           # auth pages
├── components/          # UI components, grouped by feature
├── lib/                 # auth/session, Supabase clients, lease + CAM logic, PDF rendering
├── types/               # shared TypeScript types
└── proxy.ts             # Next 16 proxy (middleware): session refresh + route guarding
tests/                   # unit tests for rent, CAM, KPI, and formatting logic
```

## Authorization model

Two layers, and both matter:

- `src/proxy.ts` runs on every non-public request. No Supabase session means a redirect to `/login`.
- Routes that read through the service-role client (`createAdminClient`) bypass RLS, so they call `getRole()` or `requireAdmin()` from `src/lib/session.ts` themselves. A valid session is not sufficient; the email must also exist in `app_users`.

When adding a route that uses `createAdminClient`, add the role check too.

## Notes

- Real lease and location data, source lease PDFs, database seed/schema scripts, and the Supabase setup guide all live under `data/`, which is gitignored because it contains confidential lease and financial terms. Use your own data when setting up a Supabase instance.
- Lease dates are Postgres `date` columns and are formatted in UTC via `fmtDate` in `src/lib/format.ts`. Do not format them with a bare `new Date(iso).toLocaleDateString()`; that renders a day early in negative-offset timezones.
