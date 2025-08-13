# Debug Collections Issue Summary

## Changes Made

### 1. Updated CuratedCollections.vue
- **Location**: `websites/media/src/components/CuratedCollections.vue`
- **Changes**:
  - Added comprehensive console.log statements to debug data loading
  - Modified template to show loading, error, and empty states
  - Added debug information display when no collections are found
  - Added CSS styles for debug states

### 2. Updated Collections Store
- **Location**: `packages/core/src/stores/collections.store.ts`
- **Changes**:
  - Added console.log statements in `loadCuratedCollections` method
  - Enhanced error logging and state tracking

### 3. Updated Collections Service
- **Location**: `packages/core/src/services/collections-supabase.service.ts`
- **Changes**:
  - Added console.log statements in `getCuratedCollections` method
  - Enhanced query result logging

### 4. Updated Navigation Menu
- **Location**: `websites/media/src/components/PageHeader.vue`
- **Changes**:
  - Added "Collections" link to navigation menu between Library and Categories

## Debug Files Created

### 1. check-curated-collections.sql
- Basic SQL queries to check if curated collections exist in database
- Query to count collections by type
- Template for creating test collection

### 2. debug-collections.sql
- Comprehensive debugging script with:
  - Table structure verification
  - Current collections listing
  - Collection counts by type
  - User verification
  - RLS policies check
  - Template for creating multiple test collections

### 3. create-test-collections.js
- Node.js script to programmatically create test curated collections
- Requires Supabase URL and anon key environment variables
- Creates 4 sample curated collections with cover images

## Testing Steps

### 1. Check Browser Console
With the development server running (`http://localhost:5000/`):
1. Open browser developer tools (F12)
2. Go to Console tab
3. Navigate to the home page
4. Look for console messages starting with:
   - `CuratedCollections - onMounted`
   - `loadCuratedCollections - Starting load`
   - `getCuratedCollections - Starting query`

### 2. Check Database
Run the debug SQL scripts to verify:
1. Collections table exists and has correct structure
2. Any existing collections (especially curated ones)
3. Users exist in the auth.users table
4. RLS policies are properly configured

### 3. Check UI States
The CuratedCollections component should now show:
- **Loading state**: "Loading curated collections..." when data is being fetched
- **Error state**: Error message if loading fails
- **Empty state**: "No curated collections available yet" with debug info if no collections found
- **Success state**: Grid of collection cards if collections exist

### 4. Create Test Data
If no curated collections exist:
1. Use the SQL scripts to manually insert test data
2. Or run the Node.js script (after setting up environment variables)
3. Or use the admin interface at the collections page

## Expected Behavior

1. **On page load**: Console should show the loading sequence
2. **If no collections**: Empty state should be displayed with debug information
3. **If collections exist**: Grid of collection cards should appear
4. **Navigation**: Collections link should appear in header navigation

## Next Steps for Investigation

1. **Check console logs**: Look for any error messages or unexpected behavior
2. **Verify database**: Ensure curated collections exist with `is_curated=true` and `is_public=true`
3. **Check authentication**: Verify user authentication isn't blocking the query
4. **Check RLS policies**: Ensure Row Level Security isn't preventing access to curated collections
5. **Test with sample data**: Create test collections using provided scripts
6. **Admin interface**: Use the admin collections page to create and manage curated collections

## Files to Monitor
- Browser console for debug messages
- Network tab for API requests to Supabase
- Database queries and results
- Component rendering states