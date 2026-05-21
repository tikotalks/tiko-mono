-- Make system sound assets public so they can be accessed by all users
-- These are the assets used by the SOUNDS constant in usePlaySound.ts

UPDATE assets 
SET is_public = true
WHERE id IN (
  'c9a2b696-e9ad-4cd0-b8f5-f518a56bee2e', -- SOUNDS.WRONG_ITEM (Error)
  '0ab406c7-25f5-4663-872f-55990cf45904', -- SOUNDS.PLUB (Plub) 
  '0b60deeb-4ce2-4818-8c3f-671614dbbb6b', -- SOUNDS.ROCKET (Rocket)
  'a7109960-e3c0-46a7-a666-a7a1a02b6fd0', -- SOUNDS.WIN (Win)
  '4ab87e97-db4a-42bd-b137-a80f554b0367', -- SOUNDS.ZOOF (Zoof)
  '362cf825-5fe8-427f-b259-a7dbfcf9d617', -- SOUNDS.SLURP (Slurp)
  '4393a16c-3f49-4b33-8ebc-5254bb55bef8', -- SOUNDS.DENY (Deny)
  '09e0367e-337f-49b2-b2e0-ec57e329d184'  -- SOUNDS.EHEH (Eheh)
);