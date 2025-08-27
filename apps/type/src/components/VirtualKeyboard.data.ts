export interface KeyboardKey {
  key: string
  display?: string
  modifier?: boolean
  width?: number
}

export interface KeyboardLayout {
  name: string
  rows: KeyboardKey[][]
}

export const keyboardLayouts: Record<string, KeyboardLayout> = {
  qwerty: {
    name: 'QWERTY',
    rows: [
      [
        { key: 'q', display: 'q' },
        { key: 'w', display: 'w' },
        { key: 'e', display: 'e' },
        { key: 'r', display: 'r' },
        { key: 't', display: 't' },
        { key: 'y', display: 'y' },
        { key: 'u', display: 'u' },
        { key: 'i', display: 'i' },
        { key: 'o', display: 'o' },
        { key: 'p', display: 'p' }
      ],
      [
        { key: 'a', display: 'a' },
        { key: 's', display: 's' },
        { key: 'd', display: 'd' },
        { key: 'f', display: 'f' },
        { key: 'g', display: 'g' },
        { key: 'h', display: 'h' },
        { key: 'j', display: 'j' },
        { key: 'k', display: 'k' },
        { key: 'l', display: 'l' }
      ],
      [
        { key: 'z', display: 'z' },
        { key: 'x', display: 'x' },
        { key: 'c', display: 'c' },
        { key: 'v', display: 'v' },
        { key: 'b', display: 'b' },
        { key: 'n', display: 'n' },
        { key: 'm', display: 'm' }
      ]
    ]
  },
  
  numbers: {
    name: 'Numbers',
    rows: [
      [
        { key: '1', display: '1' },
        { key: '2', display: '2' },
        { key: '3', display: '3' }
      ],
      [
        { key: '4', display: '4' },
        { key: '5', display: '5' },
        { key: '6', display: '6' }
      ],
      [
        { key: '7', display: '7' },
        { key: '8', display: '8' },
        { key: '9', display: '9' },
        { key: '0', display: '0' }
      ]
    ]
  },

  azerty: {
    name: 'AZERTY',
    rows: [
      [
        { key: 'a', display: 'a' },
        { key: 'z', display: 'z' },
        { key: 'e', display: 'e' },
        { key: 'r', display: 'r' },
        { key: 't', display: 't' },
        { key: 'y', display: 'y' },
        { key: 'u', display: 'u' },
        { key: 'i', display: 'i' },
        { key: 'o', display: 'o' },
        { key: 'p', display: 'p' }
      ],
      [
        { key: 'q', display: 'q' },
        { key: 's', display: 's' },
        { key: 'd', display: 'd' },
        { key: 'f', display: 'f' },
        { key: 'g', display: 'g' },
        { key: 'h', display: 'h' },
        { key: 'j', display: 'j' },
        { key: 'k', display: 'k' },
        { key: 'l', display: 'l' },
        { key: 'm', display: 'm' }
      ],
      [
        { key: 'w', display: 'w' },
        { key: 'x', display: 'x' },
        { key: 'c', display: 'c' },
        { key: 'v', display: 'v' },
        { key: 'b', display: 'b' },
        { key: 'n', display: 'n' }
      ]
    ]
  },

  qwertz: {
    name: 'QWERTZ',
    rows: [
      [
        { key: 'q', display: 'q' },
        { key: 'w', display: 'w' },
        { key: 'e', display: 'e' },
        { key: 'r', display: 'r' },
        { key: 't', display: 't' },
        { key: 'z', display: 'z' },
        { key: 'u', display: 'u' },
        { key: 'i', display: 'i' },
        { key: 'o', display: 'o' },
        { key: 'p', display: 'p' }
      ],
      [
        { key: 'a', display: 'a' },
        { key: 's', display: 's' },
        { key: 'd', display: 'd' },
        { key: 'f', display: 'f' },
        { key: 'g', display: 'g' },
        { key: 'h', display: 'h' },
        { key: 'j', display: 'j' },
        { key: 'k', display: 'k' },
        { key: 'l', display: 'l' }
      ],
      [
        { key: 'y', display: 'y' },
        { key: 'x', display: 'x' },
        { key: 'c', display: 'c' },
        { key: 'v', display: 'v' },
        { key: 'b', display: 'b' },
        { key: 'n', display: 'n' },
        { key: 'm', display: 'm' }
      ]
    ]
  },

  symbols: {
    name: 'Symbols',
    rows: [
      [
        { key: '!', display: '!' },
        { key: '@', display: '@' },
        { key: '#', display: '#' },
        { key: '$', display: '$' },
        { key: '%', display: '%' },
        { key: '^', display: '^' },
        { key: '&', display: '&' },
        { key: '*', display: '*' },
        { key: '(', display: '(' },
        { key: ')', display: ')' }
      ],
      [
        { key: '-', display: '-' },
        { key: '+', display: '+' },
        { key: '=', display: '=' },
        { key: '[', display: '[' },
        { key: ']', display: ']' },
        { key: '{', display: '{' },
        { key: '}', display: '}' },
        { key: '\\', display: '\\' },
        { key: '|', display: '|' }
      ],
      [
        { key: '.', display: '.' },
        { key: ',', display: ',' },
        { key: '?', display: '?' },
        { key: '/', display: '/' },
        { key: '<', display: '<' },
        { key: '>', display: '>' },
        { key: ':', display: ':' },
        { key: ';', display: ';' },
        { key: '"', display: '"' },
        { key: "'", display: "'" }
      ]
    ]
  }
}

// Special keys that appear on all layouts
export const specialKeys = {
  space: { key: ' ', display: 'Space' },
  backspace: { key: 'Backspace', display: '⌫' },
  enter: { key: 'Enter', display: '⏎' },
  shift: { key: 'Shift', display: '⇧', modifier: true },
  caps: { key: 'CapsLock', display: '⇪', modifier: true }
}

// Get available layout names for settings
export const availableLayouts = Object.keys(keyboardLayouts).map(key => ({
  value: key,
  label: keyboardLayouts[key].name
}))

// Helper to get layout
export function getKeyboardLayout(layoutName: string): KeyboardLayout {
  return keyboardLayouts[layoutName] || keyboardLayouts.qwerty
}