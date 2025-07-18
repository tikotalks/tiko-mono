# Tiko Services Layer

## Overview

The services layer provides a clean abstraction between the UI components and the backend implementation. This allows us to easily switch between different backends (Supabase, Firebase, custom API, etc.) without changing any UI code.

## Architecture

```
UI Components (Vue)
        ↓
   Services Layer (interfaces)
        ↓
   Implementation (Supabase/localStorage/etc.)
```

## Available Services

### 1. Authentication Service (`authService`)

Handles all authentication operations:
- Sign in/up with email & password
- Magic link authentication
- OTP verification
- Session management
- User profile updates

```typescript
import { authService } from '@tiko/core'

// Sign in
const result = await authService.signInWithEmail('user@example.com', 'password')

// Send magic link
await authService.signInWithMagicLink('user@example.com')

// Get current session
const session = await authService.getSession()
```

### 2. Parent Mode Service (`parentModeService`)

Manages parental controls and PIN protection:
- Enable/disable parent mode
- PIN verification
- Session management
- Settings configuration

```typescript
import { parentModeService } from '@tiko/core'

// Enable parent mode
await parentModeService.enable(userId, '1234', {
  sessionTimeoutMinutes: 30,
  showVisualIndicator: true,
  autoLockOnAppSwitch: true,
  requirePinForSettings: true
})

// Verify PIN
const { success } = await parentModeService.verifyPin(userId, '1234')
```

### 3. User Settings Service (`userSettingsService`)

Stores app-specific user preferences:
- Save/load settings per app
- Update specific settings
- Bulk operations

```typescript
import { userSettingsService } from '@tiko/core'

// Save settings
await userSettingsService.saveSettings(userId, 'timer', {
  defaultDuration: 300,
  soundEnabled: true
})

// Get settings
const settings = await userSettingsService.getSettings(userId, 'timer')
```

## Current Implementations

Due to issues with the Supabase SDK hanging, we have two implementations for each service:

### localStorage Implementations (Currently Active)
- `LocalStorageParentModeService` - Stores in browser localStorage
- `LocalStorageUserSettingsService` - Stores in browser localStorage
- `ManualAuthService` - Uses direct API calls for auth, localStorage for sessions

### Supabase Implementations (Available)
- `SupabaseParentModeService` - Stores in Supabase database via direct API
- `SupabaseUserSettingsService` - Stores in Supabase database via direct API

## Switching Implementations

To switch from localStorage to Supabase implementations:

```typescript
// In packages/core/src/services/parent-mode.service.ts
// Change:
export const parentModeService = new LocalStorageParentModeService()
// To:
import { SupabaseParentModeService } from './parent-mode-supabase.service'
export const parentModeService = new SupabaseParentModeService()
```

## Adding a New Backend

To add support for a new backend (e.g., Firebase):

1. Create a new implementation file:
```typescript
// firebase-auth.service.ts
import type { AuthService } from './auth.service'

export class FirebaseAuthService implements AuthService {
  async signInWithEmail(email: string, password: string) {
    // Firebase implementation
  }
  // ... implement all interface methods
}
```

2. Update the export:
```typescript
export const authService = new FirebaseAuthService()
```

## Benefits

1. **Backend Agnostic** - UI components don't know or care about the backend
2. **Easy Testing** - Can create mock implementations for tests
3. **Gradual Migration** - Can switch backends one service at a time
4. **Type Safety** - All implementations must follow the interface contract
5. **Fallback Support** - Implementations can fall back to localStorage if API fails

## Database Schema Required

For Supabase implementations to work, these tables are needed:

### user_profiles table
```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  parent_pin_hash TEXT,
  parent_mode_enabled BOOLEAN DEFAULT false,
  parent_mode_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_settings table
```sql
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  app_name TEXT NOT NULL,
  settings JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app_name)
);
```

## Debugging

All services include comprehensive logging:
- Look for `[Service Name]` prefixed logs in console
- Services log both successes and failures
- Failed API calls fall back to localStorage when possible

## Future Improvements

1. **Add caching layer** - Redis or in-memory cache for frequently accessed data
2. **Add offline support** - Queue operations when offline, sync when online
3. **Add real-time updates** - WebSocket support for live data updates
4. **Add encryption** - Encrypt sensitive data in localStorage
5. **Add telemetry** - Track service usage and performance