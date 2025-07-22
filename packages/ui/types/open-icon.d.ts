// Type overrides for open-icon library to fix TypeScript compilation errors
declare module 'open-icon' {
  export enum Icons {
    // Animal icons
    ANIMAL_STEP = "ANIMAL_STEP",
    BUTTERFLY = "BUTTERFLY",
    CAT_HEAD = "CAT_HEAD",
    CAT_HEAD2 = "CAT_HEAD2",
    CAT = "CAT",
    CAT2 = "CAT2",
    CAT3 = "CAT3",
    FISH = "FISH",
    FISH2 = "FISH2",
    JELLYFISH = "JELLYFISH",
    LOBSTER = "LOBSTER",
    PUFFERFISH = "PUFFERFISH",
    SEA_STAR = "SEA_STAR",
    SQUID = "SQUID",
    STINGRAY = "STINGRAY",
    TURTLE = "TURTLE",
    WHALE = "WHALE",
    
    // Arrow icons
    ARROW_CORNER_DOWN = "ARROW_CORNER_DOWN",
    ARROW_CORNER_LEFT = "ARROW_CORNER_LEFT",
    ARROW_CORNER_RIGHT = "ARROW_CORNER_RIGHT",
    ARROW_CORNER_UP = "ARROW_CORNER_UP",
    ARROW_DIAGONAL_BL_TR_STOP = "ARROW_DIAGONAL_BL_TR_STOP",
    ARROW_DIAGONAL_BR_TL_STOP = "ARROW_DIAGONAL_BR_TL_STOP",
    ARROW_DIAGONAL_IN_LT_BR = "ARROW_DIAGONAL_IN_LT_BR",
    ARROW_DIAGONAL_IN_TR_BL = "ARROW_DIAGONAL_IN_TR_BL",
    ARROW_DIAGONAL_TL_BR_SPLIT = "ARROW_DIAGONAL_TL_BR_SPLIT",
    ARROW_DIAGONAL_TL_BR_STOP = "ARROW_DIAGONAL_TL_BR_STOP",
    ARROW_DIAGONAL_TL_BR = "ARROW_DIAGONAL_TL_BR",
    ARROW_DIAGONAL_TR_BL_SPLIT = "ARROW_DIAGONAL_TR_BL_SPLIT",
    
    // Basic UI icons (common ones likely to be used)
    CLOSE = "CLOSE",
    BACK = "BACK",
    HOME = "HOME",
    SETTINGS = "SETTINGS",
    DELETE = "DELETE",
    EDIT = "EDIT",
    SAVE = "SAVE",
    SEARCH = "SEARCH",
    MENU = "MENU",
    ADD = "ADD",
    MINUS = "MINUS",
    PLAY = "PLAY",
    PAUSE = "PAUSE",
    STOP = "STOP",
    SKIP_FORWARD = "SKIP_FORWARD",
    SKIP_BACKWARD = "SKIP_BACKWARD",
    VOLUME = "VOLUME",
    MUTE = "MUTE",
    SHUFFLE = "SHUFFLE",
    REPEAT = "REPEAT",
    SHARE = "SHARE",
    FAVORITE = "FAVORITE",
    HEART = "HEART",
    STAR = "STAR",
    BOOKMARK = "BOOKMARK",
    FLAG = "FLAG",
    INFO = "INFO",
    WARNING = "WARNING",
    ERROR = "ERROR",
    SUCCESS = "SUCCESS",
    QUESTION = "QUESTION",
    HELP = "HELP",
    LOCK = "LOCK",
    UNLOCK = "UNLOCK",
    VISIBILITY = "VISIBILITY",
    VISIBILITY_OFF = "VISIBILITY_OFF",
    REFRESH = "REFRESH",
    SYNC = "SYNC",
    DOWNLOAD = "DOWNLOAD",
    UPLOAD = "UPLOAD",
    COPY = "COPY",
    CUT = "CUT",
    PASTE = "PASTE",
    UNDO = "UNDO",
    REDO = "REDO",
    
    // Other common icons
    G_BUTTON_IN = "G_BUTTON_IN",
    G_BUTTON = "G_BUTTON",
    G_CIRCLE_IN = "G_CIRCLE_IN",
    G_FILE_IN = "G_FILE_IN",
    G_FILE = "G_FILE",
    G_FOLDER_IN = "G_FOLDER_IN",
    G_FOLDER = "G_FOLDER",
    G_NOTE2 = "G_NOTE2",
    G_NOTE = "G_NOTE",
    G_SPEECH_BUBBLE_IN = "G_SPEECH_BUBBLE_IN",
    G_SQUARE_IN = "G_SQUARE_IN",
    G_TRIANGLE_IN = "G_TRIANGLE_IN",
    G_BROKEN_HEART = "G_BROKEN_HEART",
    G_CHECK = "G_CHECK",
    G_EDIT = "G_EDIT",
    G_EXCLAMATION_MARK = "G_EXCLAMATION_MARK",
    G_HEART = "G_HEART",
    G_HIDDEN = "G_HIDDEN",
    G_INFO = "G_INFO",
    G_MINUS = "G_MINUS",
    G_MULTIPLY = "G_MULTIPLY",
    G_PLUS = "G_PLUS",
    G_QUESTION_MARK = "G_QUESTION_MARK",
    G_SEARCH = "G_SEARCH",
    G_STAR = "G_STAR",
    G_USER = "G_USER",
    G_VISIBLE = "G_VISIBLE"
  }

  // Extended Icons type that allows any string key
  export interface IconsMap {
    [key: string]: string;
  }
  
  export const IconsExtended: IconsMap & typeof Icons;
  
  export function getIcon(icon: Icons | string): Promise<string>
  
  // Fix the searchIcons function that has the type error
  export function searchIcons(query: string, searchIn?: 'name' | 'category' | 'tag' | 'description' | 'title'): Array<{
    id: string;
    name: string;
    category?: string;
    tag?: string;
    description?: string;
    title?: string;
  }>
  
  // Additional exports to fix type issues
  export const meta: Record<string, any>
}