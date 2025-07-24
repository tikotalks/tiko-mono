# Cloudflare R2 CORS Solution

## The Problem
You're getting CORS errors because R2 doesn't support CORS headers on the S3 API endpoint you're using.

## Solution Options

### Option 1: Use Cloudflare Workers (Recommended)
Create a Cloudflare Worker to proxy uploads and add CORS headers:

1. Go to Cloudflare Dashboard → Workers & Pages
2. Create a new Worker with this code:

```javascript
export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    // Forward request to R2
    const url = new URL(request.url);
    url.hostname = 'media.dc2b7d14a69351375cab6de9a13ddee9.r2.cloudflarestorage.com';
    
    const response = await fetch(url, request);
    
    // Add CORS headers to response
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, HEAD, OPTIONS');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
};
```

3. Deploy the worker to a route like `upload.tikocdn.org/*`
4. Update your R2 endpoint in `.env`:
   ```
   R2_ENDPOINT=https://upload.tikocdn.org
   ```

### Option 2: Use the Custom Domain
Since you have `media.tikocdn.org` set up, ensure it's configured with Transform Rules:

1. Go to your domain in Cloudflare
2. Rules → Transform Rules → HTTP Response Headers
3. Create a new rule:
   - If: Hostname equals `media.tikocdn.org`
   - Then: Add these headers:
     - `Access-Control-Allow-Origin`: `*`
     - `Access-Control-Allow-Methods`: `GET, PUT, POST, DELETE, HEAD, OPTIONS`
     - `Access-Control-Allow-Headers`: `*`

4. Update your endpoint to use the custom domain:
   ```
   R2_ENDPOINT=https://media.tikocdn.org
   ```

### Option 3: Server-Side Upload (Alternative)
Instead of uploading directly from the browser, upload through your backend:

1. Create an API endpoint in your admin tool
2. Upload file to your server first
3. Then upload from server to R2 (no CORS issues)

```typescript
// In a new file: /tools/admin/src/api/upload.ts
import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const upload = multer({ memory: true });

app.post('/api/upload', upload.single('file'), async (req, res) => {
  const client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
  });

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: `uploads/${Date.now()}-${req.file.originalname}`,
    Body: req.file.buffer,
    ContentType: req.file.mimetype
  });

  await client.send(command);
  
  res.json({ success: true });
});
```

## Quick Fix (For Testing)
The issue is that R2's S3 API endpoint doesn't support CORS. The quickest solution for development is to use Option 1 (Worker) or Option 2 (Transform Rules).

## Verification
After implementing one of these solutions, test with:
```bash
curl -X OPTIONS https://your-endpoint/test \
  -H "Origin: http://localhost:5200" \
  -H "Access-Control-Request-Method: PUT" \
  -v
```

You should see `Access-Control-Allow-*` headers in the response.