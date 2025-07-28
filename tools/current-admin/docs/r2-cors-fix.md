# R2 CORS Fix - Quick Solution

## The Problem
R2's S3 API endpoints (`https://[account-id].r2.cloudflarestorage.com`) do NOT support CORS headers. This is a Cloudflare limitation.

## Quick Solution: Use Your Custom Domain

Since you have `media.tikocdn.org` set up as a custom domain for your R2 bucket:

### 1. Update Transform Rules in Cloudflare
1. Go to your Cloudflare dashboard
2. Select the domain that hosts `media.tikocdn.org`
3. Go to Rules → Transform Rules → Modify Response Header
4. Create a new rule:
   - **When incoming requests match**: `(http.host eq "media.tikocdn.org")`
   - **Then**: Add these headers:
     ```
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Methods: GET, HEAD, OPTIONS, PUT, POST, DELETE
     Access-Control-Allow-Headers: *
     Access-Control-Max-Age: 86400
     ```

### 2. Update your R2 service configuration
Change the endpoint in your `.env` file:

```bash
# Change from:
R2_ENDPOINT=https://dc2b7d14a69351375cab6de9a13ddee9.r2.cloudflarestorage.com

# To:
R2_ENDPOINT=https://media.tikocdn.org
```

### 3. Alternative: Direct URL Upload
If the above doesn't work, you can try constructing URLs directly:

```typescript
// In r2.service.ts, update the uploadImage method:
async uploadImage(
  file: File,
  path: string,
  options: UploadOptions = {}
): Promise<{ key: string; url: string }> {
  const key = `${path}/${file.name}`
  
  // Use fetch API directly instead of AWS SDK
  const response = await fetch(`https://media.tikocdn.org/${key}`, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
      'Content-Length': file.size.toString(),
    }
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return {
    key,
    url: `https://media.tikocdn.org/${key}`
  }
}
```

## Why This Happens
- R2's S3-compatible API (`r2.cloudflarestorage.com`) is meant for server-side use
- It doesn't include CORS headers because it's not meant for browser access
- Your custom domain (`media.tikocdn.org`) CAN have CORS headers via Transform Rules

## Recommended Production Setup
For production, use one of these approaches:
1. **Cloudflare Worker proxy** (most flexible)
2. **Transform Rules on custom domain** (simplest)
3. **Server-side uploads** (most secure)