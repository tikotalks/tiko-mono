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

export interface KeyboardLayoutOption {
  value: string
  label: string
}

export interface KeyboardCharacterSetOption {
  value: string
  label: string
}

export interface KeyboardLanguageOption {
  value: string
  label: string
}

export interface ResolvedKeyboardSelection {
  language: string
  layout: string
  characterSet: string
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
        { key: ',', display: ',' },
        { key: '.', display: '.' },
        { key: '!', display: '!' },
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
        { key: 'Backspace', display: '⌫' },
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
        { key: ',', display: ',' },
        { key: '.', display: '.' },
        { key: '!', display: '!' },
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
        { key: ',', display: ',' },
        { key: '.', display: '.' },
        { key: '!', display: '!' },
        { key: '?', display: '?' },
      ],
    ],
  },

  russian: {
    name: 'Russian',
    rows: [
      [
        { key: 'й', display: 'й' },
        { key: 'ц', display: 'ц' },
        { key: 'у', display: 'у' },
        { key: 'к', display: 'к' },
        { key: 'е', display: 'е' },
        { key: 'н', display: 'н' },
        { key: 'г', display: 'г' },
        { key: 'ш', display: 'ш' },
        { key: 'щ', display: 'щ' },
        { key: 'з', display: 'з' },
        { key: 'х', display: 'х' },
        { key: 'ъ', display: 'ъ' },
      ],
      [
        { key: 'ф', display: 'ф' },
        { key: 'ы', display: 'ы' },
        { key: 'в', display: 'в' },
        { key: 'а', display: 'а' },
        { key: 'п', display: 'п' },
        { key: 'р', display: 'р' },
        { key: 'о', display: 'о' },
        { key: 'л', display: 'л' },
        { key: 'д', display: 'д' },
        { key: 'ж', display: 'ж' },
        { key: 'э', display: 'э' },
      ],
      [
        { key: 'я', display: 'я' },
        { key: 'ч', display: 'ч' },
        { key: 'с', display: 'с' },
        { key: 'м', display: 'м' },
        { key: 'и', display: 'и' },
        { key: 'т', display: 'т' },
        { key: 'ь', display: 'ь' },
        { key: 'б', display: 'б' },
        { key: 'ю', display: 'ю' },
        { key: ',', display: ',' },
        { key: '.', display: '.' },
        { key: '!', display: '!' },
        { key: '?', display: '?' },
      ],
    ],
  },

  greek: {
    name: 'Greek',
    rows: [
      [
        { key: ';', display: ';' },
        { key: 'ς', display: 'ς' },
        { key: 'ε', display: 'ε' },
        { key: 'ρ', display: 'ρ' },
        { key: 'τ', display: 'τ' },
        { key: 'υ', display: 'υ' },
        { key: 'θ', display: 'θ' },
        { key: 'ι', display: 'ι' },
        { key: 'ο', display: 'ο' },
        { key: 'π', display: 'π' },
      ],
      [
        { key: 'α', display: 'α' },
        { key: 'σ', display: 'σ' },
        { key: 'δ', display: 'δ' },
        { key: 'φ', display: 'φ' },
        { key: 'γ', display: 'γ' },
        { key: 'η', display: 'η' },
        { key: 'ξ', display: 'ξ' },
        { key: 'κ', display: 'κ' },
        { key: 'λ', display: 'λ' },
      ],
      [
        { key: 'ζ', display: 'ζ' },
        { key: 'χ', display: 'χ' },
        { key: 'ψ', display: 'ψ' },
        { key: 'ω', display: 'ω' },
        { key: 'β', display: 'β' },
        { key: 'ν', display: 'ν' },
        { key: 'μ', display: 'μ' },
        { key: ',', display: ',' },
        { key: '.', display: '.' },
        { key: '!', display: '!' },
        { key: '?', display: '?' },
      ],
    ],
  },

  armenian: {
    name: 'Armenian',
    rows: [
      [
        { key: 'է', display: 'է' },
        { key: 'թ', display: 'թ' },
        { key: 'փ', display: 'փ' },
        { key: 'ձ', display: 'ձ' },
        { key: 'ջ', display: 'ջ' },
        { key: 'ր', display: 'ր' },
        { key: 'չ', display: 'չ' },
        { key: 'ճ', display: 'ճ' },
        { key: 'ժ', display: 'ժ' },
      ],
      [
        { key: 'ք', display: 'ք' },
        { key: 'ո', display: 'ո' },
        { key: 'ե', display: 'ե' },
        { key: 'ռ', display: 'ռ' },
        { key: 'տ', display: 'տ' },
        { key: 'ը', display: 'ը' },
        { key: 'ւ', display: 'ւ' },
        { key: 'ի', display: 'ի' },
        { key: 'օ', display: 'օ' },
        { key: 'պ', display: 'պ' },
      ],
      [
        { key: 'ա', display: 'ա' },
        { key: 'ս', display: 'ս' },
        { key: 'դ', display: 'դ' },
        { key: 'ֆ', display: 'ֆ' },
        { key: 'գ', display: 'գ' },
        { key: 'հ', display: 'հ' },
        { key: 'յ', display: 'յ' },
        { key: 'կ', display: 'կ' },
        { key: 'լ', display: 'լ' },
        { key: 'խ', display: 'խ' },
        { key: 'ծ', display: 'ծ' },
        { key: ',', display: ',' },
        { key: '.', display: '.' },
        { key: '!', display: '!' },
        { key: '?', display: '?' },
      ],
    ],
  },

  persian: {
    name: 'Persian',
    rows: [
      [
        { key: 'ض', display: 'ض' },
        { key: 'ص', display: 'ص' },
        { key: 'ث', display: 'ث' },
        { key: 'ق', display: 'ق' },
        { key: 'ف', display: 'ف' },
        { key: 'غ', display: 'غ' },
        { key: 'ع', display: 'ع' },
        { key: 'ه', display: 'ه' },
        { key: 'خ', display: 'خ' },
        { key: 'ح', display: 'ح' },
        { key: 'ج', display: 'ج' },
        { key: 'چ', display: 'چ' },
      ],
      [
        { key: 'ش', display: 'ش' },
        { key: 'س', display: 'س' },
        { key: 'ی', display: 'ی' },
        { key: 'ب', display: 'ب' },
        { key: 'ل', display: 'ل' },
        { key: 'ا', display: 'ا' },
        { key: 'ت', display: 'ت' },
        { key: 'ن', display: 'ن' },
        { key: 'م', display: 'م' },
        { key: 'ک', display: 'ک' },
        { key: 'گ', display: 'گ' },
      ],
      [
        { key: 'ظ', display: 'ظ' },
        { key: 'ط', display: 'ط' },
        { key: 'ز', display: 'ز' },
        { key: 'ر', display: 'ر' },
        { key: 'ذ', display: 'ذ' },
        { key: 'د', display: 'د' },
        { key: 'پ', display: 'پ' },
        { key: 'و', display: 'و' },
        { key: 'ژ', display: 'ژ' },
        { key: ',', display: ',' },
        { key: '.', display: '.' },
        { key: '!', display: '!' },
        { key: '?', display: '?' },
      ],
    ],
  },

  maltese: {
    name: 'Maltese',
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
        { key: 'għ', display: 'għ' },
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
        { key: 'ħ', display: 'ħ' },
        { key: 'ċ', display: 'ċ' },
      ],
      [
        { key: 'z', display: 'z' },
        { key: 'x', display: 'x' },
        { key: 'c', display: 'c' },
        { key: 'v', display: 'v' },
        { key: 'b', display: 'b' },
        { key: 'n', display: 'n' },
        { key: 'm', display: 'm' },
        { key: 'ż', display: 'ż' },
        { key: 'ġ', display: 'ġ' },
        { key: ',', display: ',' },
        { key: '.', display: '.' },
        { key: '!', display: '!' },
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

const defaultAlphabet = 'abcdefghijklmnopqrstuvwxyz'.split('')

const localeAlphabets: Record<string, string[]> = {
  bg: 'абвгдежзийклмнопрстуфхцчшщъьюя'.split(''),
  de: [...defaultAlphabet, 'ä', 'ö', 'ü', 'ß'],
  el: 'αβγδεζηθικλμνξοπρστυφχψω'.split(''),
  es: [...defaultAlphabet, 'ñ'],
  fa: 'اآبپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی'.split(''),
  fr: [...defaultAlphabet, 'à', 'â', 'æ', 'ç', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'œ', 'ù', 'û', 'ü', 'ÿ'],
  hy: 'աբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցւփքօֆ'.split(''),
  it: [...defaultAlphabet, 'à', 'è', 'é', 'ì', 'ò', 'ù'],
  mt: [...defaultAlphabet, 'ċ', 'ġ', 'għ', 'ħ', 'ż'],
  pt: [...defaultAlphabet, 'á', 'à', 'â', 'ã', 'ç', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú'],
  ru: 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'.split(''),
}

const characterSetLabels: Record<string, string> = {
  auto: 'Match App Language',
  en: 'English',
  de: 'German',
  el: 'Greek',
  fa: 'Persian',
  fr: 'French',
  hy: 'Armenian',
  mt: 'Maltese',
  ru: 'Russian',
}

const keyboardLanguageLabels: Record<string, string> = {
  auto: 'Match App Language',
  en: 'English',
  fr: 'French',
  de: 'German',
  ru: 'Russian',
  hy: 'Armenian',
  el: 'Greek',
  fa: 'Persian',
  mt: 'Maltese',
}

const nativeKeyboardLayoutByLanguage: Record<string, string> = {
  en: 'qwerty',
  fr: 'azerty',
  de: 'qwertz',
  ru: 'russian',
  hy: 'armenian',
  el: 'greek',
  fa: 'persian',
  mt: 'maltese',
}

const selectableLayoutKeys = ['qwerty', 'azerty', 'qwertz', 'alphabet'] as const

function getLocaleCode(locale: string): string {
  return (locale || 'en').toLowerCase().split('-')[0]
}

function getAlphabetForLocale(locale: string): string[] {
  const localeCode = getLocaleCode(locale)
  return localeAlphabets[localeCode] || defaultAlphabet
}

function getAlphabetForCharacterSet(characterSet: string, locale: string): string[] {
  if (!characterSet || characterSet === 'auto') {
    return getAlphabetForLocale(locale)
  }

  return localeAlphabets[characterSet] || getAlphabetForLocale(locale)
}

function splitIntoRows<T>(items: T[], rowCount: number): T[][] {
  const rows: T[][] = []
  let remaining = items.length
  let index = 0

  for (let rowsLeft = rowCount; rowsLeft > 0; rowsLeft -= 1) {
    const currentRowSize = Math.ceil(remaining / rowsLeft)
    rows.push(items.slice(index, index + currentRowSize))
    index += currentRowSize
    remaining -= currentRowSize
  }

  return rows
}

function getAlphabetLayout(locale: string, characterSet = 'auto'): KeyboardLayout {
  const alphabetKeys: KeyboardKey[] = [
    ...getAlphabetForCharacterSet(characterSet, locale).map(letter => ({ key: letter, display: letter })),
    { key: ',', display: ',' },
    { key: '.', display: '.' },
    { key: '!', display: '!' },
    { key: '?', display: '?' },
  ]

  return {
    name: 'Alphabet',
    rows: splitIntoRows(alphabetKeys, 3),
  }
}

export function getAvailableLayouts(_locale = 'en'): KeyboardLayoutOption[] {
  return selectableLayoutKeys.map(layoutKey => {
    if (layoutKey === 'alphabet') {
      return {
        value: 'alphabet',
        label: 'Alphabet',
      }
    }

    return {
      value: layoutKey,
      label: keyboardLayouts[layoutKey].name,
    }
  })
}

export function getAvailableCharacterSets(locale = 'en'): KeyboardCharacterSetOption[] {
  const localeCode = getLocaleCode(locale)
  const autoLabelSuffix = characterSetLabels[localeCode] || localeCode.toUpperCase()

  return Object.entries(characterSetLabels).map(([value, label]) => ({
    value,
    label: value === 'auto' ? `${label} (${autoLabelSuffix})` : label,
  }))
}

export function getAvailableKeyboardLanguages(locale = 'en'): KeyboardLanguageOption[] {
  const localeCode = getLocaleCode(locale)
  const autoLabelSuffix = keyboardLanguageLabels[localeCode] || localeCode.toUpperCase()

  return Object.entries(keyboardLanguageLabels).map(([value, label]) => ({
    value,
    label: value === 'auto' ? `${label} (${autoLabelSuffix})` : label,
  }))
}

export function resolveKeyboardSelection(
  language = 'auto',
  alphabetical = false,
  locale = 'en'
): ResolvedKeyboardSelection {
  const resolvedLanguage = language === 'auto' ? getLocaleCode(locale) : language
  const nativeLayout = nativeKeyboardLayoutByLanguage[resolvedLanguage] || 'qwerty'

  return {
    language: resolvedLanguage,
    layout: alphabetical ? 'alphabet' : nativeLayout,
    characterSet: resolvedLanguage,
  }
}

// Backward-compatible default export for existing settings forms.
export const availableLayouts = getAvailableLayouts()

// Helper to get layout
export function getKeyboardLayout(
  layoutName: string,
  locale = 'en',
  characterSet = 'auto'
): KeyboardLayout {
  if (layoutName === 'alphabet') {
    return getAlphabetLayout(locale, characterSet)
  }

  return keyboardLayouts[layoutName] || keyboardLayouts.qwerty
}
