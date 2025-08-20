# Required Translation Keys for User Profile

The following translation keys need to be added to the translation database for the enhanced User Profile functionality:

## Profile Information
- `profile.userType` - "User Type" / "Account Type"  
- `profile.administrator` - "Administrator"
- `profile.standardUser` - "Standard User"
- `profile.memberSince` - "Member Since"
- `profile.language` - "Language"
- `profile.parentMode` - "Parent Mode"
- `profile.accountActions` - "Account Actions"

## Avatar Management
- `profile.changeAvatar` - "Change Avatar"
- `profile.uploadImage` - "Upload Image"
- `profile.chooseFromMedia` - "Choose from Media"
- `profile.invalidFileType` - "Invalid file type. Please select an image."
- `profile.fileTooLarge` - "File too large. Please select an image under 5MB."
- `profile.profileUpdated` - "Profile updated successfully"
- `profile.updateFailed` - "Failed to update profile"
- `profile.imageProcessingFailed` - "Failed to process image"
- `profile.noMediaFound` - "No media files found"
- `profile.chooseFromMediaFailed` - "Failed to load media files"

## Password Management
- `profile.changePassword` - "Change Password"
- `profile.setupParentMode` - "Setup Parent Mode"

## Account Removal
- `profile.removeAccount` - "Remove Account"
- `profile.removeAccountConfirmation` - "Remove Account Confirmation"
- `profile.removeAccountWarning` - "⚠️ WARNING: This will permanently delete your account and ALL associated data including:\n\n• All your sequences, cards, and items\n• All your uploaded media files\n• All your app settings and preferences\n• Your entire user profile\n\nThis action cannot be undone!"
- `profile.removeAccountConfirm` - "Yes, Remove My Account"
- `profile.finalConfirmation` - "Final Confirmation"
- `profile.finalConfirmationWarning` - "Are you absolutely sure you want to delete everything? This will:\n\n• Remove ALL your data from ALL apps\n• Delete ALL your media files permanently\n• Cannot be recovered or undone\n\nType your email address below to confirm:"
- `profile.yesRemoveEverything` - "Yes, Remove Everything"
- `profile.removingUserData` - "Removing user data..."
- `profile.accountRemoved` - "Account removed successfully"
- `profile.removalError` - "Error occurred during account removal"
- `profile.removalFailed` - "Failed to remove account"

## Common Actions
- `common.cancel` - "Cancel" (already exists)
- `common.enabled` - "Enabled" (already exists)
- `common.disabled` - "Disabled" (already exists)

## Notes for Implementation

1. These keys should be added to the translation database that the system uses
2. The keys follow the existing naming convention of `category.specific_key`
3. All user-facing text in the TProfile component references these keys
4. The user removal functionality includes multiple confirmation steps with progressively stronger warnings
5. The system will gracefully fallback to showing the key name if translations are not available

## Usage in Component

The component uses these keys via the `useI18n` composable:
```typescript
const { t } = useI18n()
const userTypeDisplay = computed(() => {
  return userType.value === 'admin' ? t('profile.administrator') : t('profile.standardUser')
})
```