# Tiko Admin

Internal admin tool for managing the Tiko platform. Currently includes media management with more admin features coming soon.

## Access Control

This tool is restricted to users with **editor** or **admin** roles only. Regular users cannot access this tool.

## Features

### Media Management
- Upload and process images
- Automatic image optimization and variant generation
- Metadata management (tags, categories, descriptions)
- Search and filter media library
- Direct upload to Cloudflare R2 storage

### Coming Soon
- User management
- Analytics dashboard
- App configuration
- Content moderation

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev --filter=@tiko/admin

# Build for production
pnpm build --filter=@tiko/admin
```

## Deployment

The tool is deployed to `admin.tiko.mt` via Netlify.

## Role Management

To grant access to this tool, you need to update a user's role in the database:

```sql
-- Grant editor access
UPDATE user_profiles 
SET role = 'editor' 
WHERE user_id = 'USER_ID_HERE';

-- Grant admin access
UPDATE user_profiles 
SET role = 'admin' 
WHERE user_id = 'USER_ID_HERE';
```

## Architecture

- Built with Vue 3 + TypeScript
- Uses TFramework from @tiko/ui
- Authentication via @tiko/core auth service
- Role-based access control
- Direct integration with Cloudflare R2 for storage

## Future Enhancements

- [ ] Image upload interface
- [ ] Batch processing
- [ ] AI-powered auto-tagging
- [ ] Usage analytics
- [ ] CDN cache purging