# Supabase Backup Checklist

## Goal

Capture enough of production to migrate safely and roll back if needed.

You need all of this before the first live cutover:

- schema + data dump
- storage object export
- row counts by critical table
- auth user export or at least email to user ID mapping
- active functions, views, and policies inventory

## Required Outputs

### 1. Postgres backup

Required:

- full schema dump
- full data dump

Prefer:

- one plain SQL dump for inspection
- one custom-format dump for restore flexibility

### 2. Storage export

Required for any buckets still in Supabase Storage.

Important:

- database backups do not include the actual object bytes
- export object metadata and files separately

### 3. Identity export

Required:

- auth user ID
- email
- created timestamp

Useful:

- metadata/role fields
- last sign-in timestamp

### 4. Table inventory

Capture row counts and rough size for:

- `items`
- `media`
- `user_media`
- `assets`
- `media_collections`
- `collection_items`
- `collection_likes`
- `user_profiles`
- `user_settings`
- all `content_*` tables
- `i18n_*` tables
- `sentence_*` tables
- `tts_audio`
- `issue_reports`

### 5. Schema logic inventory

Capture:

- functions
- views
- triggers
- policies

This matters because some of the repo SQL files may not exactly match production anymore.

## Minimum Live Checklist

1. Freeze schema changes or announce a migration window.
2. Export the database.
3. Export storage objects.
4. Export auth users.
5. Save row counts for critical tables.
6. Verify a restore can be attempted on a scratch environment.

## Suggested Backup Artifacts

Store these outside the app repo and outside Supabase:

- `supabase-schema-YYYYMMDD.sql`
- `supabase-data-YYYYMMDD.sql`
- `supabase-full-YYYYMMDD.dump`
- `supabase-auth-users-YYYYMMDD.json`
- `supabase-row-counts-YYYYMMDD.csv`
- `supabase-storage-manifest-YYYYMMDD.json`
- `supabase-storage-export-YYYYMMDD/`

## Migration-Specific Checks

### User ownership

You do not care about preserving old login accounts, but you do care about data ownership.

So you still need:

- a user export
- a mapping from old Supabase user IDs to emails

Without that, you cannot reliably reattach user-owned records later.

### Media

For media, verify where the actual files live today:

- Supabase Storage
- Cloudflare R2
- mixed

If mixed, export both the metadata and the remaining Supabase object bytes.

### Content system

For content, verify production schema against:

- [tools/admin/src/database](/Users/silvandiepen/Repositories/_tiko/tiko-mono/tools/admin/src/database)
- [supabase/migrations](/Users/silvandiepen/Repositories/_tiko/tiko-mono/supabase/migrations)

Do not assume repo SQL equals live SQL.

## Practical Questions to Answer Before Cutover

- Which tables are largest?
- Which tables change most often?
- Which tables are still written directly from browsers?
- Which buckets still contain production files in Supabase?
- Which records still reference legacy auth IDs?

## Exit Criteria

You are ready to start live migration work only when:

- you have a verified database backup
- you have a verified storage export
- you have a user ID to email export
- you have row counts for critical tables
- you know which live tables and buckets are authoritative
