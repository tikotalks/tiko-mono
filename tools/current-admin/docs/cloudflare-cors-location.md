# Where to Configure CORS in Cloudflare

## The Problem
Transform Rules are NOT in R2 settings. They're in the domain settings for the domain that's connected to your R2 bucket.

## Finding the Right Place

### Option 1: Check if media.tikocdn.org is a subdomain
1. Go to Cloudflare Dashboard
2. Look for the domain `tikocdn.org` (NOT in R2, in your domains list)
3. Click on `tikocdn.org`
4. Look in the left sidebar for:
   - **Rules** (might be under different names)
   - **Page Rules** (older feature)
   - **Workers Routes** (if using Workers)

### Option 2: R2 Custom Domain Settings
If `media.tikocdn.org` is set up as an R2 custom domain:
1. Go to R2 → Overview
2. Click on your "media" bucket
3. Go to "Settings" tab
4. Look for "Custom Domains"

**Unfortunately, R2 custom domains don't support adding custom headers directly.**

## The Real Solution

Since R2 doesn't support CORS on its endpoints, you have these options:

### 1. Use Cloudflare Workers (Recommended)
1. Go to "Workers & Pages" in Cloudflare dashboard
2. Create a new Worker
3. Use the worker code I provided earlier
4. Deploy it to a route like `upload.media.tikocdn.org/*`

### 2. Use a Different Upload Method
Instead of direct browser uploads, consider:
- Upload to your backend first, then to R2
- Use presigned URLs (if R2 supports them)
- Use the R2 public bucket URL (if the bucket is public)

### 3. Check Your Plan
Transform Rules might require a paid Cloudflare plan. Check if you're on:
- Free plan (limited features)
- Pro plan or higher (has Transform Rules)

## Quick Test
Try accessing your R2 bucket via its public URL:
- `https://media.tikocdn.org/test.txt`
- Check the response headers in browser DevTools

If there are no CORS headers, then the custom domain isn't configured to add them.