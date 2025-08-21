# Fix for "Legacy API keys are disabled" Error

## Problem
The content worker is showing "Legacy API keys are disabled" error when trying to fetch content from Supabase.

## Root Cause
Supabase has updated their security policies and no longer allows certain operations with anonymous (anon) keys. The worker was previously configured to use the anon key.

## Solution Options

### Option 1: Get Service Role Key (Recommended)
1. Go to your Supabase dashboard
2. Navigate to Settings > API
3. Copy the `service_role` key (NOT the `anon` key)
4. Run the deployment fix:
   ```bash
   cd workers/content-api
   ./deploy-fix.sh
   ```
5. When prompted, paste the service role key

### Option 2: Update Supabase RLS Policies
If you cannot access the service role key, you can update your Supabase Row Level Security (RLS) policies to allow public read access:

1. Go to Supabase dashboard > Authentication > Policies
2. For the tables used by content (items, translations, etc.), ensure they have policies that allow SELECT operations for anonymous users
3. Example policy:
   ```sql
   CREATE POLICY "Allow public read access" ON items
   FOR SELECT
   TO anon
   USING (true);
   ```

### Option 3: Create a New Service Role Key
If the original service role key is lost:
1. Contact Supabase support to regenerate the service role key
2. Or create a new Supabase project and migrate your data

## Updated Configuration
The worker has been updated to use `SUPABASE_SERVICE_KEY` instead of `SUPABASE_ANON_KEY`. This change is reflected in:
- `wrangler.toml` - Removed hardcoded anon key
- `src/types.ts` - Updated interface to use SUPABASE_SERVICE_KEY
- `src/supabase-client.ts` - Updated to use service key

## Deployment Steps
Once you have the service role key:

```bash
# Set the secret
wrangler secret put SUPABASE_SERVICE_KEY

# Deploy the worker
wrangler deploy

# Test the deployment
curl https://content.tikoapi.org/health
```

## Security Note
The service role key has full access to your database. Keep it secure and only use it in server-side environments like Cloudflare Workers.