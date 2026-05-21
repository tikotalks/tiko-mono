# Update show_in_navigation Column Migration

## Overview
This migration updates the `show_in_navigation` column in the `content_pages` table from a BOOLEAN type to a TEXT type with specific allowed values to provide more granular control over navigation visibility.

## Changes
- Column type: BOOLEAN → TEXT
- Allowed values: 'false', 'mobile', 'desktop', 'true'
- Default value: 'true'
- Added CHECK constraint to enforce allowed values

## Value Meanings
- `'false'` - Page is hidden from all navigation
- `'mobile'` - Page only shows in mobile navigation
- `'desktop'` - Page only shows in desktop navigation  
- `'true'` - Page shows in all navigation (mobile and desktop)

## Running the Migration

### Option 1: Using psql directly
```bash
psql $DATABASE_URL -f supabase/migrations/20250205_update_show_in_navigation_column.sql
```

### Option 2: Using Supabase CLI (if installed)
```bash
supabase db push
```

### Option 3: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `20250205_update_show_in_navigation_column.sql`
4. Paste and run the SQL

## Verification
After running the migration, verify it worked:
```sql
-- Check the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'check_show_in_navigation';

-- Check some sample data
SELECT id, title, show_in_navigation 
FROM content_pages 
LIMIT 10;
```

## Rollback
If you need to rollback this migration:
```bash
psql $DATABASE_URL -f supabase/migrations/20250205_update_show_in_navigation_column_rollback.sql
```

## Impact on Application Code
After this migration, any code that interacts with the `show_in_navigation` column should:
- Use string values ('false', 'mobile', 'desktop', 'true') instead of booleans
- Update any TypeScript types or interfaces to reflect the new type
- Update any UI components that set this value to use the appropriate string values