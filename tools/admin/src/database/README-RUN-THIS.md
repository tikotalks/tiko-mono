# IMPORTANT: Database Fixes Required

## Issue
The `content_fields` table has a constraint that doesn't include 'options' and 'items' as allowed field types, causing a 400 error when trying to create fields with these types.

## Solution
Run the following SQL files to fix the constraints:

```bash
# For options field type
psql $DATABASE_URL -f fix-content-fields-options-constraint.sql

# For items field type (repeater)
psql $DATABASE_URL -f add-items-field-type.sql
```

This will:
1. Drop the existing `content_fields_field_type_check` constraint
2. Create a new constraint that includes both 'options' and 'items' in the allowed field types

## Files to Run
1. `fix-content-fields-options-constraint.sql` - Fixes the constraint to allow 'options' field type
2. `add-items-field-type.sql` - Adds 'items' field type for repeatable field groups

## Verification
After running the fixes, you can verify they worked by running:
```bash
psql $DATABASE_URL -f check-content-fields-constraint.sql
```

This will show you the updated constraint definition which should include both 'options' and 'items'.