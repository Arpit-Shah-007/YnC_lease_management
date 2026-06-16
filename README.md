# Y&C Lease Management

Internal lease management dashboard for the Y&C franchise group (Wendy's + Taco Bell locations). Tracks lease terms, CAM reconciliation, and portfolio data across all stores, with AI-assisted lease document extraction.

## Features

- **Portfolio dashboard** — browse all locations with key facts (rent, term, square footage, expiry)
- **Lease detail pages** — full lease terms per location
- **CAM audit** — common area maintenance reconciliation per lease
- **AI lease extraction** — upload a lease PDF and extract structured terms automatically via Groq
- **Admin tools** — manage users, brands, and locations
- **Role-based auth** — admin vs. standard user access via signed session cookies
- **Portfolio map** — store locations plotted on an interactive map

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack) + React 19 + TypeScript
- [Supabase](https://supabase.com/) (Postgres + storage)
- [Groq](https://groq.com/) for AI-powered lease data extraction
- [Leaflet](https://leafletjs.com/) for the portfolio map
- `pdf-parse` / `xlsx` for document parsing

## Getting Started

### Prerequisites

- Node.js 20+
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
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
   | `GROQ_API_KEY` | Groq API key for lease extraction |
   | `AUTH_SECRET` | Random secret used to sign session tokens |
   | `AUTH_ADMIN_EMAIL` / `AUTH_ADMIN_PASSWORD` | Admin login credentials |
   | `AUTH_USER_EMAIL` / `AUTH_USER_PASSWORD` | Standard user login credentials |

3. Set up your Supabase database schema (tables for locations, leases, brands, and users) to match the types in `src/types/database.ts`, then seed it with your own data.

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and log in with the credentials from step 2.

### Other Scripts

```bash
npm run build   # production build
npm run start   # run a production build locally
npm run lint     # eslint
```

## Project Structure

```
src/
├── app/                # Next.js routes (App Router)
│   ├── admin/           # admin pages (user management)
│   ├── api/              # API routes (leases, locations, extraction, admin)
│   ├── dashboard/       # portfolio dashboard
│   ├── lease/[id]/      # lease detail pages
│   └── login/            # auth pages
├── components/         # UI components, grouped by feature
├── lib/                 # auth, session, Supabase clients, lease extraction logic
└── types/               # shared TypeScript types
```

## Notes

- Real lease and location data, plus database seed/schema scripts, are kept out of version control (`sql/`, `src/data/`) since they contain confidential lease and financial terms. Use your own data when setting up a Supabase instance.
