# Upload Flow Test

## Test Steps:

1. Navigate to the admin app's upload page
2. Add files to the upload queue (drag & drop or click to select)
3. Verify that files are added to the queue but DO NOT start uploading automatically
4. Click the "Start Upload" button
5. Verify that uploads begin processing

## Expected Behavior:

- When files are added: They should appear in the queue with "pending" status
- Files should NOT start uploading until the "Start Upload" button is clicked
- The status bar should show the correct upload progress
- Upload should complete successfully with proper success/error handling

## Implementation Details:

1. **Upload Store** (`packages/core/src/stores/upload.ts`):
   - Added `startUpload()` method that emits a custom event
   - This keeps upload state management centralized

2. **Upload Worker** (`packages/core/src/composables/useUploadWorker.ts`):
   - Listens for the 'upload:start' custom event
   - No longer has automatic watchers that trigger uploads
   - Only one instance created in AdminLayout

3. **Upload View** (`tools/admin/src/views/UploadView.vue`):
   - No longer creates its own upload worker instance
   - Uses `uploadStore.startUpload()` directly

4. **Status Bar** (`packages/ui/src/components/TStatusBar/TStatusBar.vue`):
   - Also uses `uploadStore.startUpload()` for the start button
   - No longer emits events up the component tree