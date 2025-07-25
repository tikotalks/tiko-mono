# StatusBar Refactoring Summary

## What we did:

### 1. Made TStatusBar a generic container component
- Now it's just a fixed bottom bar that can show any content via slots
- Has a `show` prop to control visibility
- Handles the positioning, styling, and transitions
- Can be reused for any bottom-bar UI needs

### 2. Created TUploadStatus component
- Contains all the upload-specific logic and UI
- Uses the `useUpload` composable to get upload state
- Handles all upload controls (start, retry, clear, etc.)
- Shows progress, status icons, and expandable queue details
- Emits a `close` event when user wants to hide it

### 3. Updated AdminLayout
- Uses TStatusBar as a container
- Places TUploadStatus inside the status bar
- Controls visibility based on `hasItems` from useUpload

## Benefits:
- Better separation of concerns
- TStatusBar is now reusable for other purposes
- Upload logic is contained in one component
- Cleaner architecture overall

## Usage:
```vue
<TStatusBar :show="hasItems">
  <TUploadStatus @close="hasItems = false" />
</TStatusBar>
```