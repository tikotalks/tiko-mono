# Group Functionality Test Plan

## Fixed Issues
1. ✅ **GroupModal component**: Removed `show` prop dependency that was causing the modal to not open
2. ✅ **Import fix**: Changed to `import { type TCardTile }` to fix TypeScript errors
3. ✅ **Watch logic**: Updated to watch `group` prop instead of `show` prop
4. ✅ **Popup integration**: Component now works with `popupService.open()` pattern

## How to Test

### 1. Create Group via Drag-and-Drop
1. Open the sequence app (should be running on localhost:3004)
2. Make sure you have at least 2 sequences visible
3. Drag one sequence and drop it onto another sequence
4. A modal should open asking for:
   - Group name
   - Group icon (selection)
   - Group color (selection)
   - List of sequences to include
5. Fill in the form and click "Create"
6. The new group should appear in the first available spot
7. The original sequences should be moved into the group

### 2. Create Group via + Button
1. Enter edit mode (toggle edit mode button)
2. Click the + button in the top controls
3. A modal should open with the same group creation form
4. Create an empty group
5. The empty group should appear in the first available spot

### 3. Verify Group Functionality
1. Click on a group to enter it
2. You should see the sequences that belong to the group
3. Drag additional sequences onto the group to add them
4. Use breadcrumb navigation to go back to parent level

## Expected Behavior
- ✅ Modal opens when dragging sequence onto sequence  
- ✅ Modal opens when clicking + button in edit mode
- ✅ Groups auto-place in first available position
- ✅ Original sequences are moved into groups
- ✅ Groups can contain multiple sequences
- ✅ Groups show count of contained sequences
- ✅ Empty groups can be created and filled later

## Code Changes Made
- `/apps/sequence/src/components/GroupModal.vue`: Fixed to work with popupService
- `/apps/sequence/src/views/SequenceView.vue`: Already had correct implementation
- Database schema: Updated to support `sequences` array and `sequence_count` fields

## Status
Ready for testing. The core functionality should now work correctly.