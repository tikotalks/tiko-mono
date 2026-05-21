# Translation Authentication Fix

## Issue
When using the translation admin interface, you're getting 404 errors on these endpoints:
- `https://kejvhvszhevfwgsztedf.supabase.co/rest/v1/i18n_locale_details`
- `https://kejvhvszhevfwgsztedf.supabase.co/rest/v1/user_profiles?select=id,role,is_active,created_at`

## Root Cause
1. The translation system expects a `user_profiles` table with `role` and `is_active` columns
2. The existing `user_profiles` table (created for parent mode) doesn't have these columns
3. The views and RLS policies depend on these columns existing

## Solution

### Step 1: Run the Quick Fix SQL
Run this SQL script in your Supabase SQL editor:

```sql
-- Copy contents from: tools/admin/src/database/quick-fix-translation-auth.sql
```

This script will:
- Add the missing `role` and `is_active` columns to `user_profiles`
- Create user profiles for all existing auth users
- Fix RLS policies to allow authenticated users to read translation data
- Grant necessary permissions

### Step 2: Set Yourself as Admin
After running the script above, update your user to have admin role:

```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

### Step 3: If Tables Don't Exist
If you get errors about missing tables, run the complete translation system setup:

```sql
-- Copy contents from: tools/admin/src/database/complete-translation-system.sql
```

## Verification
To verify everything is working:

1. Run the diagnostic script:
```sql
-- Copy contents from: tools/admin/src/database/diagnose-translation-tables.sql
```

2. Check that you can query the views:
```sql
SELECT * FROM i18n_locale_details LIMIT 5;
SELECT * FROM user_profiles WHERE user_id = auth.uid();
```

## Authentication Flow
The translation service checks for authentication tokens in this order:
1. `tiko_auth_session` in localStorage
2. `supabase.auth.token` in localStorage (fallback)

The token is then used to make authenticated requests to the Supabase REST API.

## Common Issues

### "No rows returned" on views
- Make sure you have translation data in the `i18n_translation_versions` table
- Check that your user has a profile in `user_profiles`

### Still getting 404s
- Ensure RLS is enabled on all tables
- Check that the views exist in your database
- Verify permissions are granted to `authenticated` role

### Authentication not persisting
- Check browser console for localStorage issues
- Ensure cookies are enabled
- Try logging out and back in