# Language Persistence Fix Summary

## Problem
When changing the language in the profile, it was applied immediately but would revert to English on page refresh.

## Root Cause
TFramework was trying to load the user's language preference on mount, but the user data wasn't available yet due to asynchronous auth initialization in TAuthWrapper.

## Solution
Added an additional watcher in TFramework.vue that watches for when the user object first becomes available (from null/undefined to a user object) and applies the saved language at that time.

### Changes Made:

1. **TFramework.vue** - Added a new watcher:
```typescript
// Additional watcher for when user first becomes available (handles refresh timing)
watch(() => authStore.user, (newUser, oldUser) => {
  // Only apply if user just became available (was null/undefined before)
  if (newUser && !oldUser && newUser.user_metadata?.settings?.language) {
    const savedLanguage = newUser.user_metadata.settings.language
    if (savedLanguage !== locale.value) {
      console.log('[TFramework] User authenticated, applying saved language:', savedLanguage)
      setLocale(savedLanguage as Locale)
    }
  }
}, { immediate: true })
```

2. **useI18n.ts** - Added debug logging to help diagnose issues:
- Log initial locale from localStorage on load
- Log when locale is being set

## Testing
To verify the fix:
1. Change language in profile to Dutch (nl-NL)
2. Refresh the page
3. The interface should remain in Dutch instead of reverting to English

## How It Works
1. On page load, useI18n loads the language from localStorage (if available)
2. TAuthWrapper initializes authentication and loads user data
3. When user data becomes available, TFramework's new watcher detects this
4. If the user has a saved language preference different from current, it applies it
5. This ensures the user's language preference is always respected, even with async auth loading