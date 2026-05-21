# Migration Scripts

This folder holds migration-support artifacts for the legacy backend to Cloudflare move.

## Files

- [legacy-backend-row-counts.sql](/Users/silvandiepen/Repositories/_tiko/tiko-mono/scripts/migration/legacy-backend-row-counts.sql)
  Captures row counts for the current critical tables before cutover.

## Recommended Usage

Run the row-count query against production before any live migration step and save the output with a date stamp.

Example:

```bash
psql "$LEGACY_BACKEND_REMOVED" -f scripts/migration/legacy-backend-row-counts.sql
```

Store the result outside the repo as part of the backup artifacts listed in:

- [legacy-backend-backup-checklist.md](/Users/silvandiepen/Repositories/_tiko/tiko-mono/docs/legacy-backend-backup-checklist.md)
