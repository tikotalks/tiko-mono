// Type overrides for open-icon library to fix TypeScript compilation errors
declare module 'open-icon' {
  export enum Icons {
    // Properly formatted enum names from the rebuilt library
    G_BUTTON_IN = "g-button-in",
    G_BUTTON = "g-button",
    G_CIRCLE_IN = "g-circle-in",
    G_FILE_IN = "g-file-in",
    G_FILE = "g-file",
    G_FOLDER_IN = "g-folder-in",
    G_FOLDER = "g-folder",
    G_NOTE2 = "g-note2",
    G_NOTE = "g-note",
    G_SPEECH_BUBBLE_IN = "g-speech-bubble-in",
    G_SQUARE_IN = "g-square-in",
    G_TRIANGLE_IN = "g-triangle-in",
    G_BROKEN_HEART = "g-broken-heart",
    G_CHECK = "g-check",
    G_EDIT = "g-edit",
    G_EXCLAMATION_MARK = "g-exclamation-mark",
    G_HEART = "g-heart",
    G_HIDDEN = "g-hidden",
    G_INFO = "g-info",
    G_MINUS = "g-minus",
    G_MULTIPLY = "g-multiply",
    G_PLUS = "g-plus",
    G_QUESTION_MARK = "g-question-mark",
    G_SEARCH = "g-search",
    G_STAR = "g-star",
    G_USER = "g-user",
    G_VISIBLE = "g-visible",
    
    // Animal icons
    ANIMAL_STEP = "animal-step",
    BUTTERFLY = "butterfly",
    CAT_HEAD = "cat-head",
    CAT_HEAD2 = "cat-head2",
    CAT = "cat",
    CAT2 = "cat2",
    CAT3 = "cat3",
    FISH = "fish",
    FISH2 = "fish2",
    JELLYFISH = "jellyfish",
    LOBSTER = "lobster",
    PUFFERFISH = "pufferfish",
    SEA_STAR = "sea-star",
    SQUID = "squid",
    STINGRAY = "stingray",
    TURTLE = "turtle",
    WHALE = "whale",
    
    // Arrow icons
    ARROW_CORNER_DOWN = "arrow-corner-down",
    ARROW_CORNER_LEFT = "arrow-corner-left",
    ARROW_CORNER_RIGHT = "arrow-corner-right",
    ARROW_CORNER_UP = "arrow-corner-up",
    ARROW_DIAGONAL_BL_TR_STOP = "arrow-diagonal-bl-tr-stop",
    ARROW_DIAGONAL_BR_TL_STOP = "arrow-diagonal-br-tl-stop",
    ARROW_DIAGONAL_IN_LT_BR = "arrow-diagonal-in-lt-br",
    ARROW_DIAGONAL_IN_TR_BL = "arrow-diagonal-in-tr-bl",
    ARROW_DIAGONAL_TL_BR_SPLIT = "arrow-diagonal-tl-br-split",
    ARROW_DIAGONAL_TL_BR_STOP = "arrow-diagonal-tl-br-stop",
    ARROW_DIAGONAL_TL_BR = "arrow-diagonal-tl-br",
    ARROW_DIAGONAL_TR_BL_SPLIT = "arrow-diagonal-tr-bl-split",
    
    // Common UI icons (using proper enum names)
    SETTINGS = "settings",
    DELETE = "delete",
    EDIT = "edit",
    SAVE = "save",
    SEARCH = "search",
    MENU = "menu",
    ADD = "add",
    MINUS = "minus",
    PLAY = "play",
    PAUSE = "pause",
    STOP = "stop",
    VOLUME = "volume",
    HEART = "heart",
    STAR = "star",
    INFO = "info",
    
    // Generic fallback for any other icons
    [key: string]: string
  }

  export function getIcon(icon: Icons): Promise<string>
}