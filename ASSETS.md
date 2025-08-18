# Assets System

The Assets system provides a centralized way to manage and serve files (images, videos, audio, documents) across all Tiko applications.

## Architecture

### Components

1. **Supabase Database** - Stores asset metadata and relationships
2. **Cloudflare R2 Bucket** (`tiko-assets`) - Stores actual files
3. **Assets Worker** - Handles uploads and API operations
4. **Admin Panel** - Web interface for asset management
5. **TImage Component** - Client-side component for displaying assets

### URLs

- **API**: `https://assets.tikoapi.org` - Upload and manage assets
- **CDN**: `https://assets.tikocdn.org` - Serve static files

## Database Schema

Assets are stored in the `assets` table with the following structure:

```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic file information
  title VARCHAR(255) NOT NULL,
  description TEXT,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_extension VARCHAR(10) NOT NULL,
  
  -- Categorization
  categories TEXT[],
  tags TEXT[],
  
  -- File metadata
  width INTEGER, -- For images/videos
  height INTEGER, -- For images/videos
  duration INTEGER, -- For audio/video files in seconds
  
  -- Access control
  is_public BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Upload Asset
```http
POST https://assets.tikoapi.org/upload
Content-Type: multipart/form-data

file: File (required)
title: string (optional, defaults to filename)
description: string (optional)
categories: JSON array of strings (optional)
tags: JSON array of strings (optional)
isPublic: boolean (optional, default false)
userId: UUID (optional, inferred from auth)
```

### Get Asset
```http
GET https://assets.tikoapi.org/assets/{id}
```

### List Assets
```http
GET https://assets.tikoapi.org/assets?page=1&limit=20&search=query&category=icons&tag=blue&type=image&public=true&userId=uuid
```

### Update Asset
```http
PUT https://assets.tikoapi.org/assets/{id}
Content-Type: application/json

{
  "title": "New title",
  "description": "New description",
  "categories": ["icons", "ui"],
  "tags": ["blue", "round"],
  "isPublic": true
}
```

### Delete Asset
```http
DELETE https://assets.tikoapi.org/assets/{id}
```

## File Serving

Files are served directly from Cloudflare R2 via `https://assets.tikocdn.org/{file_path}`.

### Image Optimization

The CDN supports URL-based image transformations:

```
https://assets.tikocdn.org/assets/timestamp-filename.jpg?width=300&height=200&format=webp&quality=80
```

Parameters:
- `width` - Target width in pixels
- `height` - Target height in pixels  
- `format` - Output format (webp, jpeg, png)
- `quality` - JPEG/WebP quality (1-100)

## Usage in Applications

### Admin Panel

Navigate to `/assets` in the admin panel to:
- Upload new assets
- Browse and search existing assets
- Edit asset metadata (title, description, categories, tags)
- Set public/private visibility
- Copy asset URLs and IDs
- Delete assets

### TImage Component

The `TImage` component automatically resolves asset IDs:

```vue
<!-- Using asset ID -->
<TImage 
  src="550e8400-e29b-41d4-a716-446655440000" 
  alt="My asset"
  size="medium"
/>

<!-- Using direct URL -->
<TImage 
  src="https://assets.tikocdn.org/assets/1234567890-logo.png"
  alt="Logo"
/>

<!-- With optimization -->
<TImage 
  :src="assetId"
  alt="Optimized image"
  :width="300"
  :height="200"
  responsive
/>
```

### Assets Service

Use the assets service in admin applications:

```typescript
import { assetsService } from '@/services/assets.service'

// Upload asset
const asset = await assetsService.uploadAsset({
  file: selectedFile,
  title: 'My Image',
  categories: ['icons', 'ui'],
  tags: ['blue', 'round'],
  isPublic: true
})

// Get asset URL
const url = assetsService.getAssetUrl(asset)
const optimizedUrl = assetsService.getOptimizedUrl(asset, { 
  width: 300, 
  format: 'webp' 
})

// List assets
const { assets, total } = await assetsService.listAssets({
  search: 'logo',
  category: 'icons',
  isPublic: true,
  page: 1,
  limit: 20
})
```

## Deployment

### 1. Database Migration

Run the migration to create the assets table:

```bash
# Apply migration 20250118_create_assets_table.sql
```

### 2. Cloudflare R2 Bucket

Create the R2 bucket:

```bash
# Create bucket named 'tiko-assets'
# Configure public access for assets.tikocdn.org domain
```

### 3. Deploy Worker

Deploy the assets-upload worker:

```bash
cd workers/assets-upload
npm install
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler deploy
```

### 4. DNS Configuration

Set up DNS records:
- `assets.tikoapi.org` → Assets worker
- `assets.tikocdn.org` → R2 bucket public URL

## Security

### Row Level Security (RLS)

The assets table uses RLS policies:

- **Public assets**: Readable by anyone
- **Private assets**: Only readable by the owner
- **Admin users**: Full access to all assets
- **Insert/Update/Delete**: Only by asset owner or admin

### File Validation

The worker validates:
- File types (images, videos, audio, documents)
- File size limits
- Malicious content detection (planned)

### Access Control

- Private assets require authentication
- Public assets are accessible to all organization members
- Admin panel requires admin role

## Categories and Tags

### Suggested Categories
- `icons` - UI icons and symbols
- `backgrounds` - Background images and patterns
- `logos` - Company and brand logos
- `photos` - Photographs and realistic images
- `illustrations` - Drawn or digital art
- `documents` - PDFs and text files
- `audio` - Sound effects and music
- `videos` - Video content

### Tagging Best Practices
- Use descriptive tags: `blue`, `round`, `button`, `navigation`
- Include style tags: `flat`, `outlined`, `filled`, `gradient`
- Add functional tags: `clickable`, `decorative`, `informational`
- Use consistent naming: prefer `multi-word` over `multiWord`

## File Organization

Files are stored in R2 with the following structure:

```
tiko-assets/
├── assets/
│   ├── 1234567890-logo.png
│   ├── 1234567891-background.jpg
│   └── 1234567892-icon-home.svg
```

Filename format: `{timestamp}-{safe-name}.{extension}`

Where:
- `timestamp` - Unix timestamp for uniqueness
- `safe-name` - Sanitized version of original filename
- `extension` - Original file extension (lowercase)

## Monitoring

### Metrics to Track
- Upload success/failure rates
- File size distribution
- Most accessed assets
- Storage usage over time
- CDN cache hit rates

### Alerts
- Failed uploads exceeding threshold
- Storage quota approaching limits
- Unusual access patterns

## Migration from Existing Systems

To migrate from the existing media system:

1. **Identify assets** to migrate from user-media and public media
2. **Bulk upload** via the assets API with proper metadata
3. **Update references** in applications to use new asset IDs
4. **Test fallback behavior** in TImage component
5. **Gradual migration** to avoid breaking existing functionality