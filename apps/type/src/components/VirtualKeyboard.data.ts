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

export const funKeyboardIds = {
  a: '541e7ae2-b00c-45e5-933a-a2f6c6737ea8',
  b: 'fb53c93b-0de1-4824-89a4-e285ee7e73e8',
  c: '8dca3dcb-7654-491d-966d-7a6dd94092a6',
  d: 'e5872ce8-4551-46bc-a367-bf402c635788',
  e: '90effdbe-e6d4-4825-abf2-c7511ffd42a2',
  f: '9a6760fe-f96a-450e-b6de-c48b3780e5a1',
  g: '9337a010-5a62-4402-a257-28d7230c3fa5',
  h: '9dba1990-c3bd-4c97-b7fe-1412cd32d953',
  i: 'c160345a-2aef-4a8a-9993-7efc886b89ac',
  j: 'ab63fcfb-2db4-42fe-8471-d46735c6c775',
  k: 'c9cac002-cf36-4ac8-b3af-6896b19c369c',
  l: '61d9ad9c-be1f-4105-a7b2-13ae290b8cf0',
  m: '192493ce-f66b-4e7b-ae7a-5802d2d8a3d9',
  n: 'f1f3be31-c01b-4eea-969d-b1b76311b357',
  o: '8ea768e1-6848-434b-a68f-e7d2cf6a84e7',
  p: '24e60c9f-b2e0-4f7f-8423-991422b78737',
  q: '809ec4ee-2f71-4b43-9006-96ac363bcaed',
  r: 'ab18b520-cb52-4d1a-91b6-8147299722e6',
  s: '360568ca-4348-48f8-add8-eaebfa032962',
  t: 'bb52a8f0-6371-4ede-b914-7de58a085738',
  u: '49a08035-78dd-418c-9d82-f9d881298dd7',
  v: '9ec2da3d-4ca2-4938-95d1-c0473623edf4',
  w: 'db7bab16-ec75-421f-86a5-616150bc921b',
  x: '27f8965f-e5e2-473e-b559-f6576faf95a8',
  y: '609c4cf4-e024-4889-9a05-f40f6862661a',
  z: 'd86505c9-77d0-4d2f-a215-3ccc4ebf546c',
  '?': 'd98aa245-9a5a-464f-a6d7-9a12d8948d68',
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
        { key: 'p', display: 'p' },
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
        { key: 'l', display: 'l' },
      ],
      [
        { key: 'z', display: 'z' },
        { key: 'x', display: 'x' },
        { key: 'c', display: 'c' },
        { key: 'v', display: 'v' },
        { key: 'b', display: 'b' },
        { key: 'n', display: 'n' },
        { key: 'm', display: 'm' },
        { key: '?', display: '?' },
      ],
    ],
  },

  numbers: {
    name: 'Numbers',
    rows: [
      [
        { key: '1', display: '1' },
        { key: '2', display: '2' },
        { key: '3', display: '3' },
      ],
      [
        { key: '4', display: '4' },
        { key: '5', display: '5' },
        { key: '6', display: '6' },
      ],
      [
        { key: '7', display: '7' },
        { key: '8', display: '8' },
        { key: '9', display: '9' },
        { key: '0', display: '0' },
      ],
    ],
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
        { key: 'p', display: 'p' },
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
        { key: 'm', display: 'm' },
      ],
      [
        { key: 'w', display: 'w' },
        { key: 'x', display: 'x' },
        { key: 'c', display: 'c' },
        { key: 'v', display: 'v' },
        { key: 'b', display: 'b' },
        { key: 'n', display: 'n' },
        { key: '?', display: '?' },
      ],
    ],
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
        { key: 'p', display: 'p' },
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
        { key: 'l', display: 'l' },
      ],
      [
        { key: 'y', display: 'y' },
        { key: 'x', display: 'x' },
        { key: 'c', display: 'c' },
        { key: 'v', display: 'v' },
        { key: 'b', display: 'b' },
        { key: 'n', display: 'n' },
        { key: 'm', display: 'm' },
        { key: '?', display: '?' },
      ],
    ],
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
        { key: ')', display: ')' },
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
        { key: '|', display: '|' },
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
        { key: "'", display: "'" },
      ],
    ],
  },
}

// Special keys that appear on all layouts
export const specialKeys = {
  space: { key: ' ', display: 'Space' },
  backspace: { key: 'Backspace', display: '⌫' },
  enter: { key: 'Enter', display: '⏎' },
  shift: { key: 'Shift', display: '⇧', modifier: true },
  caps: { key: 'CapsLock', display: '⇪', modifier: true },
}

// Get available layout names for settings
export const availableLayouts = Object.keys(keyboardLayouts).map(key => ({
  value: key,
  label: keyboardLayouts[key].name,
}))

// Helper to get layout
export function getKeyboardLayout(layoutName: string): KeyboardLayout {
  return keyboardLayouts[layoutName] || keyboardLayouts.qwerty
}
