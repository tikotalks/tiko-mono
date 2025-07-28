# Cloudflare R2 CORS Configuration

To allow uploads from your local development environment, you need to configure CORS on your R2 bucket.

## Steps to Configure CORS:

1. Go to Cloudflare Dashboard
2. Navigate to R2 → Your bucket (media)
3. Click on "Settings" tab
4. Find "CORS policy" section
5. Add this CORS configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5200",
      "http://localhost:*",
      "https://admin.tiko.mt"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

6. Save the CORS policy

## Alternative: Using Worker for Uploads

If CORS configuration doesn't work, you can create a Cloudflare Worker to handle uploads:

1. Create a new Worker
2. Use it as a proxy for R2 uploads
3. The Worker can add proper CORS headers

## Temporary Workaround

For now, you can also test uploads by:
1. Deploying the admin tool to a public URL
2. Adding that URL to the CORS allowed origins
3. Or using the Cloudflare R2 dashboard to upload files manually