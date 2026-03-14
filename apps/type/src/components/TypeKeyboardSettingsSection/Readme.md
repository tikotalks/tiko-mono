# TypeKeyboardSettingsSection

Framework settings section for the Type app keyboard language and layout mode.

## Behavior

- Reads current keyboard layout from the Type store.
- Reads the current keyboard language and alphabetical/native mode from the Type store.
- Offers selectable keyboard languages from `VirtualKeyboard.data`.
- Emits `change` payloads containing both the new high-level settings and the derived legacy layout fields for persistence.
