# Supabase Setup

How to stand up the database for this project from scratch, and how the `sql/` scripts fit together. `sql/` is gitignored (it contains real lease/financial data via the seed files) — this doc is the reference for what's in it and how to run it.

## Prerequisites

- A Supabase project (free tier is fine)
- Project's API URL + anon key + service role key, from **Project Settings → API** — these go in `.env.local` (see `.env.local.example`)

## Run Order

Run each file in the Supabase Dashboard's **SQL Editor**, in this order:

| File | Purpose |
|---|---|
| `00_drop_all.sql` | **Destructive.** Drops every table. Only run this to wipe and start over. |
| `01_schema.sql` | Creates all tables (`brands`, `locations`, `leases`, `lease_files`, `cam_line_items`, `rent_schedule`, `critical_dates`, `clauses`), indexes, RLS policies, and table grants. |
| `02_users.sql` | Creates `app_users` (portal login credentials — separate from Supabase Auth). Locked down to `service_role` only. |
| `03_seed_brands.sql` | Upserts `wendys` / `tacobell` brand rows. |
| `04_seed_locations.sql` | Upserts all 38 location rows (address, city, state, lat/lng). |
| `05_seed_leases.sql` | Upserts all 38 lease rows (real rent/lessee/lessor data — this is why `sql/` stays out of git). |

All seed files are safe to re-run — they use `on conflict ... do update`/`do nothing`.

## The Grants Gotcha

Postgres requires a base table `GRANT` before a role can touch a table at all — RLS policies only filter *rows*, they don't substitute for a grant. Supabase does not always auto-grant table access to `anon` / `authenticated` / `service_role` for tables created via the SQL Editor (as opposed to the dashboard's Table Editor).

**Symptom:** API routes fail with `permission denied for table <name>`, even though the table exists and RLS policies look correct, and even when using the service role key.

**Fix:** `01_schema.sql` now ends with explicit grants for this reason:

```sql
grant usage on schema public to anon, authenticated, service_role;

grant select on
  brands, locations, leases, lease_files,
  cam_line_items, rent_schedule, critical_dates, clauses
  to anon, authenticated;

grant select, insert, update, delete on
  brands, locations, leases, lease_files,
  cam_line_items, rent_schedule, critical_dates, clauses
  to authenticated, service_role;
```

If you only ever ran an older copy of `01_schema.sql` (before this section existed), just re-run the `grant` block above directly — it's idempotent.

## Auth Model

This app does **not** use Supabase Auth. Login is custom: a signed HMAC cookie (`yandc_auth`), checked in `src/proxy.ts` middleware on every request except static assets.

- Reads (`/api/locations`, `/api/leases`, etc.) use the **anon key** (`src/lib/supabase/server.ts`) — gated by the `anon_read` RLS policies (select-only, all rows).
- Admin writes (`/api/admin/*`) use the **service role key** (`src/lib/supabase/admin.ts`), which bypasses RLS.
- The `authenticated` role/policies in `01_schema.sql` exist for completeness but aren't actually exercised by this app, since the Supabase client never carries a Supabase Auth JWT.

### Bootstrapping the first login

Before any row exists in `app_users`, the login action falls back to these env vars:

```
AUTH_ADMIN_EMAIL / AUTH_ADMIN_PASSWORD
AUTH_USER_EMAIL  / AUTH_USER_PASSWORD
```

Log in with the admin env-var credentials, create a real admin user via `/admin/users`, then you can remove those env vars. Passwords in `app_users` are hashed with PBKDF2-SHA256 (100k iterations) by the app — you cannot seed a user with a raw password via SQL.

## Storage

Lease PDFs are uploaded to a private Supabase Storage bucket named `leases` (no public URL). Create it once, either via **Dashboard → Storage → New bucket** (private), or SQL:

```sql
insert into storage.buckets (id, name, public)
  values ('leases', 'leases', false)
  on conflict (id) do nothing;
```

To empty it later: **Dashboard → Storage → leases → Empty bucket**, or `delete from storage.objects where bucket_id = 'leases';`.

## Resetting Everything

1. Run `00_drop_all.sql`
2. Re-run `01_schema.sql` through `05_seed_leases.sql` in order
3. Optionally empty/recreate the `leases` storage bucket
