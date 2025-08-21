# Secrets Store Setup for Content API Worker

## What Changed
The content-api worker now uses Cloudflare's account-level Secrets Store instead of per-worker secrets. This provides centralized secret management across all workers.

## Setup Instructions

### 1. Find Your Store ID
1. Go to Cloudflare Dashboard > Secrets Store
2. Copy the Store ID (it will look like a UUID)

### 2. Update wrangler.toml
Replace `YOUR_STORE_ID` in the wrangler.toml file with your actual store ID:

```toml
[[secrets_store_secrets]]
binding = "SUPABASE_URL"
store_id = "YOUR_STORE_ID"  # <-- Replace this
secret_name = "SUPABASE_URL"

[[secrets_store_secrets]]
binding = "SUPABASE_SERVICE_KEY"
store_id = "YOUR_STORE_ID"  # <-- Replace this
secret_name = "SUPABASE_SERVICE_KEY"
```

### 3. Deploy the Worker
```bash
cd workers/content-api
wrangler deploy
```

## Benefits
- Centralized secret management
- Same secrets can be used across multiple workers
- Better security with account-level access control
- No need to set secrets per worker anymore

## Troubleshooting
If you get errors about missing bindings:
1. Ensure both SUPABASE_URL and SUPABASE_SERVICE_KEY exist in your Secrets Store
2. Verify the store_id is correct
3. Check that the secret names match exactly