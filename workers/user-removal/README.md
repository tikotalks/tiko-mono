# User Removal Worker

A secure Cloudflare Worker that handles complete user account and data removal from the Tiko platform.

## Overview

This worker provides a secure backend service for permanently removing user accounts and all associated data. It includes:

- **Complete Data Removal**: Removes all user items, media, profile data, and settings
- **Secure Authentication**: Requires admin API key for access
- **Progress Tracking**: Logs removal progress to KV storage
- **CORS Support**: Enables cross-origin requests from the frontend

## Features

### Data Removal Scope

The worker removes:
1. **User Items**: All sequences, cards, and items from all applications
2. **User Media**: All uploaded media files from storage
3. **User Profile**: Profile data and preferences
4. **User Settings**: App-specific settings and configurations
5. **Authentication Account**: Supabase auth user account

### Security

- Requires `ADMIN_API_KEY` for authentication
- Uses Supabase service role key for admin operations
- Includes progress logging with automatic expiration
- CORS headers configured for security

### Progress Tracking

The worker logs removal progress to Cloudflare KV storage:
- Real-time status updates
- Error logging and tracking
- Automatic log expiration (24 hours)
- Queryable status endpoint

## API Endpoints

### `DELETE /remove-user`

Initiates complete user removal process.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "adminKey": "secure-admin-key"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User account and all associated data have been removed",
  "details": {
    "userItems": 25,
    "userMedia": 12,
    "userProfiles": 1,
    "userSettings": 1,
    "authAccount": true
  }
}
```

### `GET /removal-status?userId=uuid`

Retrieves removal progress for a user.

**Response:**
```json
{
  "success": true,
  "progress": [
    {
      "step": "initiated",
      "status": "completed",
      "message": "User removal process started",
      "timestamp": "2023-12-01T10:00:00.000Z"
    }
  ]
}
```

## Environment Variables

### Required Secrets

Set these via `wrangler secret put`:

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_SERVICE_KEY` - Supabase service role key (for admin operations)
- `ADMIN_API_KEY` - Secret key for authenticating admin requests

### KV Namespace

- `USER_REMOVAL_LOG` - KV namespace for storing removal progress logs

## Deployment

### Manual Deployment
```bash
cd workers/user-removal
npm install
wrangler deploy --env production
```

### GitHub Actions
Trigger via commit message:
```bash
git commit -m "feat: update user removal worker [build:user-removal]"
```

Or deploy all workers:
```bash
git commit -m "feat: deploy workers [build:workers]"
```

### Set Secrets
```bash
wrangler secret put VITE_SUPABASE_URL --env production
wrangler secret put VITE_SUPABASE_SERVICE_KEY --env production  
wrangler secret put ADMIN_API_KEY --env production
```

## Frontend Integration

The worker is called by the `UserRemovalService` in the UI package:

```typescript
import { userRemovalService } from '@tiko/ui'

// Remove user with progress tracking
await userRemovalService.removeUserAndAllData(
  userId,
  (progress) => {
    console.log(`${progress.step}: ${progress.message}`)
  }
)
```

## Security Considerations

1. **Admin Key**: Generate a strong, unique admin API key and store securely
2. **Service Key**: Use Supabase service role key, not anon key
3. **CORS**: Configure allowed origins appropriately for production
4. **Logging**: Progress logs automatically expire after 24 hours
5. **Rate Limiting**: Consider implementing rate limiting for production use

## Development

### Local Development
```bash
npm run dev
```

### Testing
Use a tool like curl or Postman to test the endpoints:

```bash
# Test user removal
curl -X DELETE https://localhost:8787/remove-user \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-id","adminKey":"your-admin-key"}'

# Check removal status  
curl "https://localhost:8787/removal-status?userId=test-user-id"
```

## Error Handling

The worker includes comprehensive error handling:
- Invalid admin key → 401 Unauthorized
- Missing user ID → 400 Bad Request  
- Database errors → 500 Internal Server Error
- Progress logging failures → Logged but don't block removal

## Monitoring

Monitor the worker via:
- Cloudflare Workers analytics dashboard
- KV storage usage for progress logs
- Worker execution logs and errors
- Supabase database activity logs

## Notes

- User removal is irreversible - implement with appropriate warnings
- The worker requires database admin privileges to delete auth users
- Progress logging helps with debugging and user communication
- Consider implementing email notifications for completed removals