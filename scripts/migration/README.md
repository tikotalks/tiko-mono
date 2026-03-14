# Migration Scripts

This folder holds migration-support artifacts for the Supabase to Cloudflare move.

## Files

- [supabase-row-counts.sql](/Users/silvandiepen/Repositories/_tiko/tiko-mono/scripts/migration/supabase-row-counts.sql)
  Captures row counts for the current critical tables before cutover.

## Recommended Usage

Run the row-count query against production before any live migration step and save the output with a date stamp.

Example:

```bash
psql "$SUPABASE_DATABASE_URL" -f scripts/migration/supabase-row-counts.sql
```

Store the result outside the repo as part of the backup artifacts listed in:

- [supabase-backup-checklist.md](/Users/silvandiepen/Repositories/_tiko/tiko-mono/docs/supabase-backup-checklist.md)
