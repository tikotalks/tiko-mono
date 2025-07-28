# Cloudflare R2 CORS Configuration

## The Problem
You're getting a CORS error because your R2 bucket doesn't allow requests from `http://localhost:5200`.

## Solution

### 1. Log into Cloudflare Dashboard
1. Go to https://dash.cloudflare.com/
2. Navigate to R2 → Overview
3. Click on your "media" bucket

### 2. Add CORS Rules
In the bucket settings, go to "Settings" tab and find "CORS Policy". Add the following configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5200",
      "http://localhost:5201",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://admin.tiko.dev",
      "https://*.tiko.dev"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD",
      "POST",
      "PUT",
      "DELETE"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Type",
      "Content-Length",
      "x-amz-request-id"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### 3. Alternative: Allow All Origins (Development Only)
For development, you can use a more permissive configuration:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD", "POST", "PUT", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

⚠️ **Warning**: Don't use `"*"` for AllowedOrigins in production!

### 4. Save the Configuration
Click "Save" to apply the CORS rules to your bucket.

### 5. Wait for Propagation
It may take a few minutes for the CORS rules to propagate across Cloudflare's network.

## Production Configuration
For production, update the AllowedOrigins to include only your actual domains:

```json
[
  {
    "AllowedOrigins": [
      "https://admin.tiko.dev",
      "https://app.tiko.dev",
      "https://tiko.dev"
    ],
    "AllowedMethods": ["GET", "HEAD", "POST", "PUT", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## Testing
After setting up CORS, try uploading a file again. The error should be resolved.

## Notes
- R2 uses S3-compatible API, so the CORS configuration follows S3 CORS format
- Make sure your bucket is set to allow public access if you want to serve images directly
- The custom domain (media.tikocdn.org) should also respect these CORS rules