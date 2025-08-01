# IMPORTANT: Database Fix Required

## Issue
The `content_fields` table has a constraint that doesn't include 'options' as an allowed field type, causing a 400 error when trying to create fields with type 'options'.

## Solution
Run the following SQL file to fix the constraint:

```bash
psql $DATABASE_URL -f fix-content-fields-options-constraint.sql
```

This will:
1. Drop the existing `content_fields_field_type_check` constraint
2. Create a new constraint that includes 'options' in the allowed field types

## Files to Run
1. `fix-content-fields-options-constraint.sql` - Fixes the constraint to allow 'options' field type

## Verification
After running the fix, you can verify it worked by running:
```bash
psql $DATABASE_URL -f check-content-fields-constraint.sql
```

This will show you the updated constraint definition.