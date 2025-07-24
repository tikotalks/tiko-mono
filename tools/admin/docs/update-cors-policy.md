# Update Your R2 CORS Policy

Your current CORS policy only allows GET requests. To enable uploads, you need to allow PUT requests as well.

## Current Policy (Broken for uploads)
```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5200"
    ],
    "AllowedMethods": [
      "GET"
    ]
  }
]
```

## Required Policy (For uploads to work)
```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5200",
      "http://localhost:5201"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "HEAD",
      "DELETE"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Type",
      "Content-Length"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

## What Changed:
1. Added `PUT` method (required for uploads)
2. Added `POST`, `HEAD`, `DELETE` methods (for complete S3 compatibility)
3. Added `AllowedHeaders: ["*"]` (allows all headers from the client)
4. Added `ExposeHeaders` (allows the client to read these response headers)
5. Added `MaxAgeSeconds` (caches preflight requests for 1 hour)
6. Added `http://localhost:5201` (your current dev server port)

## Steps to Update:
1. Go to Cloudflare Dashboard
2. Navigate to R2 → Your "media" bucket → Settings
3. Find the CORS Policy section
4. Replace the current policy with the new one above
5. Click Save
6. Wait a minute for changes to propagate
7. Try uploading again

The key issue was that `PUT` method was missing, which is required for uploading files to R2/S3.