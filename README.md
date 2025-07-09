# 🧠 Tiko Monorepo

This repository contains a collection of simple, cross-platform apps for children, built using a shared core. All apps share UI components, media assets, authentication, and localization, but are deployed and maintained independently.

---

## 🧱 Monorepo Structure

```
tiko/
├── apps/
│   ├── yes-no/           # Standalone app (web + mobile)
│   ├── timer/            # Another standalone app
│   ├── cards/            # Create and use communication cards
│   ├── speak/            # Sentence builder app
│   ├── repeat/           # Speech recognition practice app
│   ├── match/            # Categorization and matching game
│   ├── story/            # Visual story builder with narration
│   ├── sounds/           # Sound recognition and exploration
│   ├── sequence/         # Order and routine learning
│   ├── board/            # Custom communication boards
│   ├── type/             # Free typing with text-to-speech
│   └── container/        # Optional: hub app linking to others
│
├── packages/
│   ├── ui/               # Shared UI components (e.g., buttons, layouts)
│   ├── core/             # User state, auth, per-app settings
│   ├── i18n/             # Translations & language management
│   ├── speech/           # Text-to-speech playback logic
│   ├── media/            # Dynamic media library (via database)
│   └── ai/               # AI helpers (auto-translate, naming, etc.)
│
├── tools/                # Utility scripts (e.g., preload media)
├── pnpm-workspace.yaml   # Pnpm workspace config
├── nx.json               # Nx monorepo config
├── package.json          # Root scripts & dependencies
└── tsconfig.base.json
```

---

## 🧩 Apps Overview

### ✅ Yes/No

Simple question-answer app with two buttons and speech support.

### ⏱️ Timer

Adjustable timer that counts up/down and shows red after expiration.

### 🧃 Cards

User-built card groups with images, audio, and animation. Grouping via drag, AI auto-naming.

### 🗣 Speak

Sentence builder using card selection. Logic-driven, language-aware multi-language output.

### 🎯 Repeat

Speech recognition practice app where children repeat words/phrases shown on themed cards.

### 🧩 Match

Practice categorization and associations by matching items to categories.

### 📚 Story

Build and narrate simple stories using visual cards.

### 🎵 Sounds

Explore and recognize real-world sounds.

### 🧠 Sequence

Arrange steps in the correct order to learn routines and logic.

### 🗂 Board

Create custom communication boards using existing cards.

### ⌨️ Type

Free typing tool for spoken output.

For detailed app specs, see [App Specifications](#app-specifications).

---

## 🔁 Shared Libraries

### `@tiko/ui`

Reusable Vue 3 components with BEM methodology and proven patterns:

* **Components**: TButton, TCard, TIcon, TForm, TContextMenu, TContextPanel, TPopup
* **Styling**: BEM methodology with `useBemm()` composable, SCSS with CSS variables
* **Accessibility**: Color inheritance, size variants, screen reader support
* **Interaction**: Long press support, vibration feedback, responsive design
* **Icon System**: Dynamic SVG loading with 'open-icon', size variants (small/medium/large)

**Component Features:**
```ts
// Based on proven tikotalks/lib patterns
interface TButtonProps {
  action?: () => void;
  onLongPress?: () => void;
  longPressTime?: number;
  vibrate?: boolean;
  color: ButtonColor;
  type?: 'default' | 'ghost' | 'fancy';
  icon?: Icons;
  size?: 'small' | 'medium' | 'large';
  status?: 'loading' | 'success' | 'error';
  disabled?: boolean;
}

interface TCardProps {
  title?: string;
  category?: string;
  emoji?: string;
  icon?: string;
  image?: string;
  size?: 'small' | 'medium' | 'large';
  isGroup?: boolean;
  backgroundColor?: string;
  actions?: ActionItem[];
}
```

**BEM Architecture:**
```scss
// Example from your existing Card component
.card {
  &__category-icon { /* Element */ }
  &__content { /* Element */ }
  &__text { /* Element */ }
  &__emoji { /* Element */ }
  &__actions { /* Element */ }
  
  &--small { /* Modifier */ }
  &--medium { /* Modifier */ }
  &--large { /* Modifier */ }
  &--is-group { /* Modifier */ }
}
```

### `@tiko/core`

Central state management and app infrastructure:

* **Pinia Stores**: User auth, app settings, offline sync
* **API Client**: Axios wrapper with auth, retry logic, error handling
* **Device Detection**: Mobile/desktop, capacitor integration
* **Storage**: Local persistence with encryption for sensitive data
* **Sync**: Background sync queue for offline actions

```ts
// Example store structure
interface CoreState {
  user: User | null;
  isAuthenticated: boolean;
  appSettings: Record<string, any>;
  isOffline: boolean;
  syncQueue: SyncAction[];
}
```

### `@tiko/i18n`

Comprehensive internationalization system:

* **Languages**: en, hy, nl, es, fr, de (expandable)
* **Translation Loading**: Lazy loading, fallback chain
* **Pluralization**: ICU message format support
* **RTL Support**: Arabic, Hebrew language support
* **Vue Integration**: Composable API, reactive language switching

```ts
// Translation key structure
interface TranslationKeys {
  common: {
    yes: string;
    no: string;
    save: string;
    cancel: string;
  };
  apps: {
    yesno: YesNoTranslations;
    timer: TimerTranslations;
    cards: CardsTranslations;
    speak: SpeakTranslations;
  };
}
```

### `@tiko/speech`

Text-to-speech and speech recognition with multi-language support:

* **TTS Engines**: Web Speech API, native mobile TTS
* **Speech Recognition**: Web Speech API, native mobile speech recognition
* **Caching**: Audio file caching for consistent pronunciation
* **SSML Support**: Speed, pitch, voice control
* **Fallback**: Graceful degradation when APIs unavailable
* **Queue Management**: Sequential speech playback
* **Recognition Accuracy**: Configurable tolerance for speech matching

```ts
interface SpeechOptions {
  language: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  cache?: boolean;
}

interface SpeechRecognitionOptions {
  language: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  timeout?: number;
  sensitivity?: number; // 0-1 for matching tolerance
}
```

### `@tiko/media`

Asset management with offline support:

* **API Integration**: Fetch media from Node.js backend
* **Local Caching**: Cache API for offline access
* **Lazy Loading**: Progressive image loading
* **Optimization**: WebP/AVIF support, responsive images
* **Upload**: Admin media upload with compression

```ts
interface MediaAsset {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'video';
  url: string;
  animatedUrl?: string;
  tags: string[];
  cached?: boolean;
}
```

### `@tiko/ai`

AI-powered content generation (admin only):

* **OpenAI Integration**: GPT-4 for translations and content
* **Translation Pipeline**: Batch translation generation
* **Content Moderation**: Inappropriate content detection
* **Auto-naming**: Generate names for card groups
* **Caching**: Store generated content in database

---

## 📲 Web & Mobile Apps

All apps are:

* Built with **Vue 3 + Vite**
* Wrapped as native apps using **Capacitor**
* Deployed as PWAs and installable on iOS/Android

### Web

* Hosted per app (e.g. `yesno.tiko.org`)
* Offline-first using service worker
* Built via `vite build`

### Mobile (Capacitor)

* Uses exact same code as web
* Native wrapper for iOS/Android
* Integrates with system (Apple Sign-In, audio, etc.)

### Dev Commands

```bash
# Start web dev server
nx serve yes-no

# Build for web
nx build yes-no

# iOS Development Commands
pnpm run ios:build:yes-no        # Build and sync Yes-No for iOS
pnpm run ios:build:cards         # Build and sync Cards for iOS
pnpm run ios:build:timer         # Build and sync Timer for iOS
pnpm run ios:build:radio         # Build and sync Radio for iOS
pnpm run ios:build:type          # Build and sync Type for iOS

# Open in Xcode
pnpm run ios:open:yes-no         # Open Yes-No in Xcode
pnpm run ios:open:cards          # Open Cards in Xcode
pnpm run ios:open:timer          # Open Timer in Xcode
pnpm run ios:open:radio          # Open Radio in Xcode
pnpm run ios:open:type           # Open Type in Xcode

# Individual app commands
cd apps/cards && pnpm run ios:run    # Build, sync, and open Cards in Xcode
cd apps/timer && pnpm run cap:sync   # Sync Timer with iOS
```

---

## 🗂 Media System

Media assets (images, audio, etc.) are:

* Stored in **AWS S3**
* Indexed via a **backend-managed database**
* Accessed using `@tiko/media` by ID or tag
* Cached locally per app for offline use

---

## 🌍 Language Support

* Predefined list of supported languages (e.g., `en`, `hy`, `nl`, etc.)
* Translations auto-generated via AI if missing
* Translations are stored in a shared DB
* Fallback language always available

---

## 🔐 Authentication

* Apple Sign-In or email-based login (no password)
* Auto-create user on first login
* All apps access shared user data (used for syncing, smarter features)

---

## 🚀 Future Plans

* Admin dashboard for managing media and translations
* Speech input
* More AI assistance in content creation
* More apps

---

## 🧑‍💻 Dev Stack

| Tool             | Purpose                |
| ---------------- | ---------------------- |
| Nx               | Monorepo management    |
| pnpm             | Package management     |
| Vue 3            | UI Framework           |
| Vite             | Build system           |
| Capacitor        | Native mobile wrappers |
| Node.js          | Backend API layer      |
| Supabase         | Database & auth        |
| Pinia            | State management       |
| OpenAI           | AI content generation  |

---

## 🏗️ Backend Architecture

### API Layer (Node.js)
* RESTful API serving all apps
* Authentication middleware
* Media upload/management endpoints
* AI content generation (admin only)
* Rate limiting and security

### Database (Supabase)
* PostgreSQL database
* Row Level Security (RLS) for data isolation
* Real-time subscriptions for live updates
* Built-in auth with JWT tokens

### State Management (Pinia)
* Shared stores across all apps via `@tiko/core`
* Automatic sync with backend API
* Offline-first with local persistence
* Reactive state updates

---

## 🗄️ Database Schema

### Users Table
```sql
users (
  id: uuid PRIMARY KEY,
  email: text UNIQUE,
  apple_id: text UNIQUE,
  created_at: timestamp,
  updated_at: timestamp,
  language: text DEFAULT 'en'
)
```

### App Settings Table
```sql
app_settings (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  app_name: text,
  settings: jsonb,
  created_at: timestamp,
  updated_at: timestamp,
  UNIQUE(user_id, app_name)
)
```

### Media Assets Table
```sql
media_assets (
  id: uuid PRIMARY KEY,
  name: text,
  type: text, -- 'image' | 'audio' | 'video'
  url: text,
  animated_url: text,
  tags: text[],
  created_at: timestamp,
  created_by: uuid REFERENCES users(id)
)
```

### Cards Table
```sql
cards (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  label: text,
  audio_text: text,
  image_id: uuid REFERENCES media_assets(id),
  animated_image_id: uuid REFERENCES media_assets(id),
  group_id: uuid REFERENCES card_groups(id),
  created_at: timestamp,
  updated_at: timestamp
)
```

### Card Groups Table
```sql
card_groups (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  name: text,
  image_id: uuid REFERENCES media_assets(id),
  created_at: timestamp,
  updated_at: timestamp
)
```

### Translations Table
```sql
translations (
  id: uuid PRIMARY KEY,
  key: text,
  language: text,
  value: text,
  context: text, -- app context
  created_at: timestamp,
  UNIQUE(key, language, context)
)
```

### Sentence Grammar Rules Table
```sql
sentence_rules (
  id: uuid PRIMARY KEY,
  language: text,
  pattern: text, -- JSON pattern for word order
  description: text,
  created_at: timestamp
)
```

### Repeat Themes Table
```sql
repeat_themes (
  id: uuid PRIMARY KEY,
  name: text,
  category: text,
  icon: text,
  difficulty_level: text,
  created_at: timestamp
)
```

### Repeat Theme Cards Table
```sql
repeat_theme_cards (
  id: uuid PRIMARY KEY,
  theme_id: uuid REFERENCES repeat_themes(id),
  text: text,
  image_id: uuid REFERENCES media_assets(id),
  audio_id: uuid REFERENCES media_assets(id),
  alternative_pronunciations: text[],
  difficulty: text,
  created_at: timestamp
)
```

### Repeat Sessions Table
```sql
repeat_sessions (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  theme_id: uuid REFERENCES repeat_themes(id),
  total_cards: int,
  correct_answers: int,
  total_attempts: int,
  average_confidence: float,
  time_spent: int, -- seconds
  completed_at: timestamp,
  created_at: timestamp
)
```

### Repeat Progress Table
```sql
repeat_progress (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  theme_id: uuid REFERENCES repeat_themes(id),
  card_id: uuid REFERENCES repeat_theme_cards(id),
  attempts: int,
  correct_attempts: int,
  best_confidence: float,
  last_attempt_at: timestamp,
  created_at: timestamp,
  updated_at: timestamp,
  UNIQUE(user_id, theme_id, card_id)
)
```

---

## 🔐 Authentication & Privacy

### Authentication Flow
* Apple Sign-In (iOS/macOS)
* Email-based login (no password, magic links)
* JWT tokens for API authentication
* Auto-create user profiles on first login

### Privacy & GDPR Compliance
* Minimal data collection (only email/Apple ID)
* No personal information beyond language preference
* User-generated content (cards, settings) tied to user ID
* Right to deletion: cascade delete all user data
* No analytics or tracking beyond basic usage

---

## 🚀 Deployment Architecture

### Individual App Deployment
* Each app deployed to own subdomain:
  - `yesno.tiko.org`
  - `timer.tiko.org`
  - `cards.tiko.org`
  - `speak.tiko.org`
  - `repeat.tiko.org`
  - `match.tiko.org`
  - `story.tiko.org`
  - `sounds.tiko.org`
  - `sequence.tiko.org`
  - `board.tiko.org`
  - `type.tiko.org`

### CI/CD Pipeline per App

**GitHub Actions Workflow:**
```yaml
# .github/workflows/app-deploy.yml
name: Deploy App
on:
  push:
    paths: ['apps/{app-name}/**', 'packages/**']
  pull_request:
    paths: ['apps/{app-name}/**', 'packages/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: nx affected:test --base=main
      - run: nx affected:lint --base=main
      - run: nx affected:build --base=main
      
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: nx affected:deploy --target=staging
      
  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: nx affected:deploy --target=production
```

**Deployment Strategy:**
* **Branch-based**: `develop` → staging, `main` → production
* **Automated**: Deploy on successful tests
* **Rollback**: Keep last 3 deployments for instant rollback
* **Blue-Green**: Zero-downtime deployments
* **Environment Promotion**: Staging → Production approval required

### Offline-First Strategy
* Service Worker for all apps
* Cache API for media assets
* Local storage for settings/state
* Background sync when online
* Graceful offline UX

---

## 🤖 AI Integration Strategy

### Admin/Management Only
* OpenAI API for content generation
* Used for translation generation
* Auto-naming for card groups
* Content moderation and suggestions

### Content Generation Workflow
1. Admin creates base content
2. AI generates translations for supported languages
3. Content cached in database
4. Apps consume pre-generated content
5. No real-time AI calls from user-facing apps

---

## 📘 App Specifications

### ✅ Yes/No

* **Purpose**: Ask a question and answer with Yes or No
* **Users**: Children (3–7), parents, therapists
* **Complexity**: Simple (MVP candidate)

**Core Features:**

* Question input via settings/top nav
* Large, tappable question text with automatic speech
* Prominent Yes/No buttons with haptic feedback
* Question history with quick selection
* Configurable button size and colors
* Offline-first operation

**User Flow:**

1. Open app (shows last question or default)
2. Tap question to hear it spoken
3. Tap Yes/No buttons for answer
4. Optional: Change question via settings
5. App remembers recent questions

**Technical Requirements:**

* Auto-play question speech on app load
* Persistent question storage locally
* Sync question history across devices
* Large touch targets for accessibility
* High contrast mode support

**State Management:**

```ts
interface YesNoAppState {
  currentQuestion: string;
  questionHistory: string[];
  settings: {
    buttonSize: 'small' | 'medium' | 'large';
    autoSpeak: boolean;
    hapticFeedback: boolean;
  };
}
```

**API Endpoints:**

* `GET /api/yesno/questions` - Fetch question history
* `POST /api/yesno/questions` - Save new question
* `GET /api/yesno/settings` - Get app settings
* `PUT /api/yesno/settings` - Update settings

---

### ⏱️ Timer

* **Purpose**: Simple visual timer for activities and transitions
* **Users**: Parents, children, therapists, teachers
* **Complexity**: Simple (keep minimal for now)

**Core Features:**

* Digital time display (minutes:seconds)
* Count up or count down modes
* Start/pause/reset controls
* Visual indicator when time expires (red background)
* Time setting via tap/touch interface
* Audio notification on completion

**User Flow:**

1. Open app (shows 00:00)
2. Set time by tapping numbers or using +/- buttons
3. Choose count up or count down mode
4. Start timer
5. Visual feedback when time completes

**Technical Requirements:**

* Accurate timing using performance.now()
* Background timer continuation (mobile)
* Visual state changes for completion
* Simple audio alert on completion
* Persistent timer state during app navigation

**State Management:**

```ts
interface TimerAppState {
  currentTime: number; // seconds
  targetTime: number; // seconds
  mode: 'up' | 'down';
  isRunning: boolean;
  hasExpired: boolean;
  settings: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
}
```

**API Endpoints:**

* `GET /api/timer/settings` - Get app settings
* `PUT /api/timer/settings` - Update settings

---

### 🧃 Cards

* **Purpose**: Create and use visual communication cards
* **Users**: Children with communication needs, parents, therapists
* **Complexity**: Medium (core communication tool)

**Core Features:**

* **Card Creation**: Image, label, audio text assignment
* **Card Interaction**: Tap to speak, visual feedback
* **Group Management**: Drag cards to create groups
* **AI Integration**: Auto-generate group names (admin)
* **Templates**: Predefined card sets for common needs
* **Search**: Find cards by label or tag
* **Backup/Sync**: Cloud sync across devices

**User Flow:**

1. Open app (shows card grid or groups)
2. Tap card to hear audio
3. Edit mode: Create, modify, or group cards
4. Drag cards together to create groups
5. Use search to find specific cards
6. Switch between personal and template cards

**Technical Requirements:**

* **Performance**: Smooth scrolling with 100+ cards
* **Storage**: Local card cache with cloud sync
* **Media**: Image optimization and lazy loading
* **Speech**: Queue management for rapid card tapping
* **Accessibility**: Screen reader support, high contrast
* **Offline**: Full functionality without internet

**State Management:**

```ts
interface CardsAppState {
  cards: Card[];
  groups: CardGroup[];
  selectedCards: string[];
  editMode: boolean;
  searchQuery: string;
  currentView: 'grid' | 'groups' | 'search';
  settings: {
    cardSize: 'small' | 'medium' | 'large';
    showLabels: boolean;
    enableAnimation: boolean;
    groupView: boolean;
  };
}

interface Card {
  id: string;
  label: string;
  audioText: string;
  imageId: string;
  animatedImageId?: string;
  groupId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CardGroup {
  id: string;
  name: string;
  imageId?: string;
  cardIds: string[];
  color?: string;
  createdAt: Date;
}
```

**API Endpoints:**

* `GET /api/cards` - Fetch user's cards
* `POST /api/cards` - Create new card
* `PUT /api/cards/:id` - Update card
* `DELETE /api/cards/:id` - Delete card
* `GET /api/cards/groups` - Fetch card groups
* `POST /api/cards/groups` - Create group
* `PUT /api/cards/groups/:id` - Update group
* `DELETE /api/cards/groups/:id` - Delete group
* `GET /api/cards/templates` - Fetch card templates
* `POST /api/cards/ai/group-name` - Generate group name (admin)

---

### 🗣 Speak

* **Purpose**: Build and speak complete sentences using cards
* **Users**: Children with communication needs, speech therapists
* **Complexity**: High (advanced sentence construction)

**Core Features:**

* **Sentence Building**: Select cards to build sentences
* **Grammar Engine**: Language-specific word order and grammar
* **Sentence Playback**: Natural speech synthesis of complete sentences
* **Card Integration**: Reuse cards from Cards app
* **Language Support**: Multi-language sentence construction
* **Sentence History**: Save and replay recent sentences
* **Templates**: Common sentence patterns

**User Flow:**

1. Open app (shows sentence builder interface)
2. Select cards from categories (subjects, verbs, objects, etc.)
3. Cards appear in sentence bar with grammar preview
4. Tap play to hear complete sentence
5. Save favorite sentences for quick access
6. Clear and start new sentence

**Technical Requirements:**

* **Grammar Engine**: Language-specific rules for word order
* **Real-time Preview**: Show sentence structure as cards are added
* **Performance**: Smooth card selection with large vocabularies
* **Integration**: Seamless sharing with Cards app data
* **Accessibility**: Screen reader support for sentence building
* **Offline**: Full functionality without internet

**Sentence Building Logic:**

```ts
interface SentenceStructure {
  language: string;
  pattern: string; // e.g., "SUBJECT VERB OBJECT"
  rules: GrammarRule[];
  wordOrder: string[];
}

interface GrammarRule {
  id: string;
  pattern: string;
  replacement: string;
  conditions: string[];
  language: string;
}

// Example for English: "I want food"
// Cards: [I, want, food] → Grammar engine → "I want food"
// Armenian: [Ես, ուզում եմ, կերակուր] → "Ես կերակուր եմ ուզում"
```

**State Management:**

```ts
interface SpeakAppState {
  currentSentence: SelectedCard[];
  sentenceHistory: Sentence[];
  availableCards: Card[];
  cardCategories: CardCategory[];
  grammarRules: GrammarRule[];
  currentLanguage: string;
  previewMode: boolean;
  settings: {
    showGrammarPreview: boolean;
    autoPlay: boolean;
    sentenceTemplate: string;
  };
}

interface SelectedCard {
  cardId: string;
  label: string;
  audioText: string;
  grammaticalRole: 'subject' | 'verb' | 'object' | 'adjective' | 'preposition';
  position: number;
}

interface Sentence {
  id: string;
  cards: SelectedCard[];
  text: string;
  language: string;
  createdAt: Date;
  isFavorite: boolean;
}
```

**Grammar Rules Database:**

* **English**: Subject-Verb-Object (SVO)
* **Armenian**: Subject-Object-Verb (SOV)
* **Dutch**: Subject-Verb-Object (SVO) with variations
* **Future**: Expandable rule system for more languages

**API Endpoints:**

* `GET /api/speak/cards` - Fetch cards for sentence building
* `GET /api/speak/grammar/:language` - Get grammar rules for language
* `POST /api/speak/sentences` - Save sentence
* `GET /api/speak/sentences` - Fetch sentence history
* `DELETE /api/speak/sentences/:id` - Delete sentence
* `GET /api/speak/templates` - Fetch sentence templates
* `POST /api/speak/validate` - Validate sentence structure

**Integration with Cards App:**

* Shared card database and state
* Category-based card organization
* Real-time card updates between apps
* Consistent UI components and interactions

---

### 🎯 Repeat

* **Purpose**: Speech recognition practice with themed learning cards
* **Users**: Children (3-10), parents, speech therapists
* **Complexity**: Medium (speech recognition + theme system)

**Core Features:**

* **Theme Selection**: Colors, animals, numbers, letters, shapes, food
* **Card Display**: Large, colorful cards with images and text
* **Speech Recognition**: Listen to child's pronunciation
* **Feedback System**: Visual and audio feedback for correct/incorrect attempts
* **Progress Tracking**: Track accuracy and improvement over time
* **Difficulty Levels**: Adjustable speech recognition sensitivity
* **Child-Friendly UI**: Encouraging animations and sounds

**User Flow:**

1. Select theme (colors, animals, etc.)
2. Choose difficulty level
3. Card appears with image and text
4. Child speaks the word/phrase
5. App provides instant feedback:
   - ✅ Correct: Celebration animation, positive sound, next card
   - ❌ Incorrect: Gentle "Ehhehhh" sound, card shake, try again
6. Progress through theme cards
7. End with summary and encouragement

**Technical Requirements:**

* **Speech Recognition**: Web Speech API with fallback
* **Audio Feedback**: Custom child-friendly sounds
* **Animations**: Smooth card transitions and shake effects
* **Accessibility**: Visual indicators for hearing-impaired users
* **Offline Support**: Core functionality without internet
* **Performance**: Fast recognition response (< 2 seconds)

**Feedback Design:**

```ts
interface FeedbackResponse {
  isCorrect: boolean;
  confidence: number; // 0-1 recognition confidence
  spokenText: string;
  expectedText: string;
  animation: 'celebration' | 'shake' | 'encourage';
  sound: 'correct' | 'incorrect' | 'tryAgain';
  message?: string;
}
```

**State Management:**

```ts
interface RepeatAppState {
  currentTheme: Theme;
  currentCard: ThemeCard;
  currentLevel: DifficultyLevel;
  isListening: boolean;
  sessionStats: SessionStats;
  userProgress: UserProgress;
  settings: RepeatSettings;
}

interface Theme {
  id: string;
  name: string;
  category: 'colors' | 'animals' | 'numbers' | 'letters' | 'shapes' | 'food';
  icon: string;
  cards: ThemeCard[];
  difficulty: DifficultyLevel;
}

interface ThemeCard {
  id: string;
  text: string;
  imageUrl: string;
  audioUrl?: string; // for pronunciation reference
  alternativePronunciations?: string[]; // accept variations
  difficulty: 'easy' | 'medium' | 'hard';
}

interface DifficultyLevel {
  name: 'easy' | 'medium' | 'hard';
  recognitionSensitivity: number; // 0.5-0.9
  timeoutMs: number;
  maxAttempts: number;
  showHints: boolean;
}

interface SessionStats {
  totalCards: number;
  correctAnswers: number;
  totalAttempts: number;
  averageConfidence: number;
  timeSpent: number;
  cardsCompleted: string[];
}

interface RepeatSettings {
  theme: string;
  difficulty: DifficultyLevel;
  feedbackVolume: number;
  showPronunciationHints: boolean;
  enableHapticFeedback: boolean;
  language: string;
}
```

**Theme System:**

```ts
// Predefined themes with cards
const themes: Theme[] = [
  {
    id: 'colors',
    name: 'Colors',
    category: 'colors',
    icon: 'palette',
    cards: [
      { id: 'red', text: 'Red', imageUrl: '/images/colors/red.png' },
      { id: 'blue', text: 'Blue', imageUrl: '/images/colors/blue.png' },
      { id: 'green', text: 'Green', imageUrl: '/images/colors/green.png' },
      // ... more colors
    ]
  },
  {
    id: 'animals',
    name: 'Animals',
    category: 'animals',
    icon: 'paw',
    cards: [
      { id: 'cat', text: 'Cat', imageUrl: '/images/animals/cat.png' },
      { id: 'dog', text: 'Dog', imageUrl: '/images/animals/dog.png' },
      // ... more animals
    ]
  }
];
```

**Speech Recognition Logic:**

```ts
class SpeechRecognitionService {
  private recognition: SpeechRecognition;
  private currentLanguage: string;
  private sensitivity: number;

  async startListening(expectedText: string, options: SpeechRecognitionOptions): Promise<FeedbackResponse> {
    // Initialize speech recognition
    // Listen for speech input
    // Compare with expected text
    // Return feedback response
  }

  private calculateMatch(spoken: string, expected: string): number {
    // Fuzzy matching algorithm
    // Account for child pronunciation variations
    // Return confidence score 0-1
  }

  private generateFeedback(match: number, spoken: string, expected: string): FeedbackResponse {
    // Generate appropriate feedback based on match quality
  }
}
```

**Animation System:**

```scss
.repeat-card {
  transition: transform 0.3s ease;
  
  &--correct {
    animation: celebrate 0.8s ease;
  }
  
  &--incorrect {
    animation: shake 0.5s ease;
  }
  
  &--listening {
    animation: pulse 1s infinite;
  }
}

@keyframes celebrate {
  0% { transform: scale(1); }
  50% { transform: scale(1.1) rotate(5deg); }
  100% { transform: scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

**API Endpoints:**

* `GET /api/repeat/themes` - Fetch available themes
* `GET /api/repeat/themes/:id/cards` - Get cards for specific theme
* `POST /api/repeat/sessions` - Start new practice session
* `PUT /api/repeat/sessions/:id` - Update session progress
* `GET /api/repeat/progress` - Get user progress across themes
* `GET /api/repeat/settings` - Get app settings
* `PUT /api/repeat/settings` - Update settings

**Accessibility Features:**

* **Visual Indicators**: For users with hearing difficulties
* **Large Text**: Easy-to-read card text
* **High Contrast**: Clear visual feedback
* **Keyboard Navigation**: Alternative to speech input
* **Screen Reader**: Proper ARIA labels and descriptions

**Child-Friendly Design:**

* **Encouraging Messages**: "Great job!", "Try again!", "You're doing great!"
* **Colorful Animations**: Celebrate success, gentle on failure
* **Progress Visualization**: Show improvement over time
* **Reward System**: Unlock new themes as progress is made

---

### 🧩 Match

* **Purpose**: Practice categorization and associations through matching games
* **Users**: Children (3-8), parents, educators
* **Complexity**: Medium (drag & drop + game logic)

**Core Features:**
* **Themed Sets**: Animals, food, colors, shapes, vehicles, household items
* **Drag & Drop**: Intuitive matching interface
* **Multiple Game Modes**: Category matching, property matching, opposite matching
* **Progress Tracking**: Track accuracy and improvement
* **Difficulty Levels**: From simple 2-category to complex multi-category

**Technical Implementation:**
```ts
interface MatchGameState {
  currentTheme: MatchTheme;
  gameMode: 'category' | 'property' | 'opposite';
  items: MatchItem[];
  categories: MatchCategory[];
  matches: Match[];
  score: number;
  timeElapsed: number;
}

interface MatchItem {
  id: string;
  label: string;
  imageUrl: string;
  categoryId: string;
  properties: string[];
}
```

---

### 📚 Story

* **Purpose**: Build and narrate visual stories using cards
* **Users**: Children (4-10), parents, teachers
* **Complexity**: High (AI integration + story logic)

**Core Features:**
* **Story Builder**: Select characters, settings, actions
* **AI Narration**: Generate coherent story text from selected cards
* **Story Playback**: Text-to-speech with synchronized visuals
* **Save & Share**: Store favorite stories, export as audio/video
* **Templates**: Story frameworks (beginning, middle, end)

**Technical Implementation:**
```ts
interface StoryState {
  characters: StoryCard[];
  settings: StoryCard[];
  actions: StoryCard[];
  storySequence: StoryFrame[];
  generatedText: string;
  isNarrating: boolean;
}

interface StoryFrame {
  id: string;
  cards: StoryCard[];
  text: string;
  duration: number;
}
```

---

### 🎵 Sounds

* **Purpose**: Explore and recognize real-world sounds
* **Users**: Children (2-7), parents, therapists
* **Complexity**: Medium (audio system + games)

**Core Features:**
* **Sound Library**: Animals, vehicles, instruments, nature, household
* **Exploration Mode**: Tap images to hear sounds
* **Mini-Games**: Match sound to image, identify sound source
* **Volume Control**: Child-safe audio levels
* **Offline Support**: Cached audio for all sounds

**Technical Implementation:**
```ts
interface SoundsState {
  currentCategory: SoundCategory;
  sounds: SoundItem[];
  gameMode: 'explore' | 'match' | 'identify';
  currentGame: SoundGame;
  volume: number;
}

interface SoundItem {
  id: string;
  name: string;
  imageUrl: string;
  audioUrl: string;
  category: string;
  tags: string[];
}
```

---

### 🧠 Sequence

* **Purpose**: Learn order and routines through sequencing activities
* **Users**: Children (4-10), parents, educators
* **Complexity**: Medium (drag & drop + sequence logic)

**Core Features:**
* **Routine Templates**: Daily activities, task flows, story sequences
* **Drag-to-Order**: Intuitive sequence building
* **Audio Support**: Step-by-step narration
* **Custom Sequences**: Create personal routines
* **Progress Tracking**: Master different sequence types

**Technical Implementation:**
```ts
interface SequenceState {
  currentSequence: SequenceTemplate;
  steps: SequenceStep[];
  userOrder: string[];
  correctOrder: string[];
  isComplete: boolean;
  attempts: number;
}

interface SequenceStep {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  audioUrl?: string;
  order: number;
}
```

---

### 🗂 Board

* **Purpose**: Create custom communication boards using existing cards
* **Users**: Children with communication needs, therapists, caregivers
* **Complexity**: High (grid system + card integration)

**Core Features:**
* **Grid Layout**: Customizable board size and arrangement
* **Card Integration**: Use cards from Cards app
* **Context Boards**: School, mealtime, play, emotions
* **Quick Access**: Frequently used phrases and words
* **Export/Import**: Share boards between devices

**Technical Implementation:**
```ts
interface BoardState {
  boards: CommunicationBoard[];
  currentBoard: CommunicationBoard;
  editMode: boolean;
  gridSize: { rows: number; cols: number };
  selectedCells: string[];
}

interface CommunicationBoard {
  id: string;
  name: string;
  context: string;
  gridSize: { rows: number; cols: number };
  cells: BoardCell[];
  isDefault: boolean;
}

interface BoardCell {
  id: string;
  position: { row: number; col: number };
  cardId?: string;
  text?: string;
  imageUrl?: string;
  backgroundColor?: string;
  isEmpty: boolean;
}
```

---

### ⌨️ Type

* **Purpose**: Free typing tool with text-to-speech output
* **Users**: Children (6+), teens, adults with communication needs
* **Complexity**: Simple (text input + TTS)

**Core Features:**
* **Text Input**: Large, accessible text area
* **Text-to-Speech**: Immediate speech output
* **Customization**: Font size, contrast, keyboard size
* **Word Prediction**: Common phrases and word suggestions
* **History**: Recent phrases for quick access

**Technical Implementation:**
```ts
interface TypeState {
  currentText: string;
  textHistory: string[];
  predictions: string[];
  settings: {
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    contrast: 'normal' | 'high';
    speechRate: number;
    speechVoice: string;
  };
  isPlaying: boolean;
}
```

---

## 🔐 Security & Compliance

### COPPA Compliance (Children's Online Privacy Protection Act)

**Data Collection Restrictions:**
```ts
// @tiko/core/compliance/COPPA.ts
export class COPPACompliance {
  static validateUserAge(birthDate?: Date): boolean {
    if (!birthDate) return false
    
    const age = this.calculateAge(birthDate)
    return age >= 13 // COPPA applies to children under 13
  }
  
  static getRequiredConsent(userAge: number): ConsentType {
    if (userAge < 13) {
      return 'parental_consent'
    } else if (userAge < 18) {
      return 'user_consent'
    }
    return 'none'
  }
  
  static validateDataCollection(data: any, userAge: number): boolean {
    if (userAge < 13) {
      // No personal information collection for children under 13
      const allowedFields = ['username', 'settings', 'progress']
      return Object.keys(data).every(key => allowedFields.includes(key))
    }
    return true
  }
}
```

**GDPR Compliance (EU Users):**
```ts
// @tiko/core/compliance/GDPR.ts
export class GDPRCompliance {
  static async handleDataDeletionRequest(userId: string): Promise<void> {
    // Delete user data across all services
    await Promise.all([
      this.deleteUserCards(userId),
      this.deleteUserProgress(userId),
      this.deleteUserSettings(userId),
      this.deleteUserSessions(userId)
    ])
    
    // Log deletion for audit trail
    Logger.info('GDPR data deletion completed', { userId })
  }
  
  static generateDataExport(userId: string): Promise<UserDataExport> {
    // Export all user data in portable format
    return {
      cards: await CardsService.getUserCards(userId),
      progress: await ProgressService.getUserProgress(userId),
      settings: await SettingsService.getUserSettings(userId),
      exportDate: new Date().toISOString()
    }
  }
}
```

### Security Headers & API Protection

**Security Headers Configuration:**
```js
// security-headers.config.js
export const securityHeaders = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-eval' https://apis.google.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https: blob:;
    media-src 'self' https: blob:;
    connect-src 'self' https://api.tiko.org wss://api.tiko.org;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    frame-ancestors 'none';
  `.replace(/\s+/g, ' ').trim(),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'microphone=self, camera=self, geolocation=(), interest-cohort=()'
}
```

**API Rate Limiting:**
```ts
// backend/middleware/rateLimiting.ts
export const rateLimitConfig = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts'
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Rate limit exceeded'
  },
  media: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 uploads per minute
    message: 'Media upload rate limit exceeded'
  }
}
```

### Data Encryption & Storage

**Sensitive Data Encryption:**
```ts
// @tiko/core/security/Encryption.ts
export class DataEncryption {
  private static key = import.meta.env.VITE_ENCRYPTION_KEY
  
  static encrypt(data: string): string {
    // Encrypt sensitive user data before local storage
    return CryptoJS.AES.encrypt(data, this.key).toString()
  }
  
  static decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.key)
    return bytes.toString(CryptoJS.enc.Utf8)
  }
  
  static hashPassword(password: string, salt: string): string {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 10000
    }).toString()
  }
}
```

**Secure Storage Strategy:**
```ts
// @tiko/core/storage/SecureStorage.ts
export class SecureStorage {
  static setItem(key: string, value: any, encrypt = false): void {
    const serialized = JSON.stringify(value)
    const data = encrypt ? DataEncryption.encrypt(serialized) : serialized
    localStorage.setItem(key, data)
  }
  
  static getItem<T>(key: string, encrypted = false): T | null {
    const data = localStorage.getItem(key)
    if (!data) return null
    
    try {
      const serialized = encrypted ? DataEncryption.decrypt(data) : data
      return JSON.parse(serialized)
    } catch {
      return null
    }
  }
  
  static removeItem(key: string): void {
    localStorage.removeItem(key)
  }
}
```

### Content Moderation

**User-Generated Content Filtering:**
```ts
// @tiko/core/moderation/ContentFilter.ts
export class ContentModerator {
  private static inappropriateWords = ['word1', 'word2'] // Load from config
  
  static moderateText(text: string): ModerationResult {
    const cleanText = text.toLowerCase().trim()
    
    // Check for inappropriate content
    const hasInappropriateContent = this.inappropriateWords.some(word => 
      cleanText.includes(word)
    )
    
    if (hasInappropriateContent) {
      return {
        approved: false,
        reason: 'inappropriate_content',
        suggestedReplacement: this.suggestAlternative(text)
      }
    }
    
    return { approved: true }
  }
  
  static async moderateImage(imageUrl: string): Promise<ModerationResult> {
    // Use AI service for image moderation (admin only)
    const response = await AIService.moderateImage(imageUrl)
    return {
      approved: response.safe,
      confidence: response.confidence,
      reasons: response.flags
    }
  }
}
```

---

## ♿ Accessibility Specifications

### WCAG 2.1 AA Compliance

**Accessibility Component Patterns:**
```vue
<!-- Example: Accessible Button Component -->
<template>
  <button
    :class="bemClass"
    :aria-label="ariaLabel || label"
    :aria-describedby="descriptionId"
    :aria-pressed="pressed"
    :disabled="disabled"
    :type="htmlType"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <TIcon v-if="icon" :name="icon" :aria-hidden="true" />
    <span v-if="label" class="button__label">{{ label }}</span>
    <span v-if="loading" class="button__spinner" aria-hidden="true">⟳</span>
  </button>
  
  <div
    v-if="description"
    :id="descriptionId"
    class="sr-only"
  >
    {{ description }}
  </div>
</template>

<script setup lang="ts">
// Accessibility props
interface Props {
  label?: string
  ariaLabel?: string
  description?: string
  pressed?: boolean
  disabled?: boolean
  loading?: boolean
}

const handleKeydown = (event: KeyboardEvent) => {
  // Handle Enter and Space keys
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}
</script>
```

**Screen Reader Support:**
```scss
// @tiko/ui/styles/accessibility.scss
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only-focusable:active,
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}

// High contrast mode support
@media (prefers-contrast: high) {
  .button {
    border: 2px solid currentColor;
    background: transparent;
    color: inherit;
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Keyboard Navigation:**
```ts
// @tiko/core/accessibility/KeyboardNav.ts
export class KeyboardNavigation {
  static init(): void {
    document.addEventListener('keydown', this.handleGlobalKeydown)
  }
  
  private static handleGlobalKeydown(event: KeyboardEvent): void {
    // Skip links (accessibility)
    if (event.key === 'Tab' && event.shiftKey && event.ctrlKey) {
      this.showSkipLinks()
    }
    
    // Focus management
    if (event.key === 'Escape') {
      this.closeModalsAndMenus()
    }
    
    // App-specific shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case '1':
          router.push('/yesno')
          break
        case '2':
          router.push('/cards')
          break
        // ... more shortcuts
      }
    }
  }
  
  static trapFocus(container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    })
  }
}
```

### Voice Control & Switch Access

**Voice Command Integration:**
```ts
// @tiko/core/accessibility/VoiceControl.ts
export class VoiceControl {
  private recognition: SpeechRecognition
  
  init(): void {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
      this.recognition.continuous = true
      this.recognition.lang = 'en-US'
      
      this.recognition.onresult = this.handleVoiceCommand.bind(this)
    }
  }
  
  private handleVoiceCommand(event: SpeechRecognitionEvent): void {
    const command = event.results[event.results.length - 1][0].transcript.toLowerCase()
    
    // Navigation commands
    if (command.includes('go to cards')) {
      router.push('/cards')
    } else if (command.includes('yes button')) {
      document.querySelector('[data-cy=yes-button]')?.click()
    } else if (command.includes('no button')) {
      document.querySelector('[data-cy=no-button]')?.click()
    }
  }
}
```

**Switch Access Support:**
```ts
// @tiko/core/accessibility/SwitchAccess.ts
export class SwitchAccess {
  private currentIndex = 0
  private focusableElements: HTMLElement[] = []
  
  init(): void {
    // Listen for switch inputs (space, enter, external switches)
    document.addEventListener('keydown', this.handleSwitchInput.bind(this))
    this.updateFocusableElements()
  }
  
  private handleSwitchInput(event: KeyboardEvent): void {
    if (event.key === ' ' && !event.ctrlKey) {
      event.preventDefault()
      this.advanceFocus()
    } else if (event.key === 'Enter') {
      this.activateCurrentElement()
    }
  }
  
  private advanceFocus(): void {
    this.currentIndex = (this.currentIndex + 1) % this.focusableElements.length
    this.focusableElements[this.currentIndex]?.focus()
  }
}
```

---

## 📱 Mobile & Capacitor Specifications

### Capacitor Configuration

**Platform-Specific Configs:**
```json
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'org.tiko.app',
  appName: 'Tiko',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: true,
      spinnerColor: '#333333'
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff'
    },
    App: {
      deepLinkingEnabled: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  ios: {
    scheme: 'Tiko',
    contentInset: 'automatic'
  },
  android: {
    buildOptions: {
      keystorePath: 'android/release.keystore',
      keystoreAlias: 'tiko-release'
    }
  }
}

export default config
```

**Native Plugin Requirements:**
```ts
// @tiko/core/native/NativePlugins.ts
import { Camera } from '@capacitor/camera'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'
import { TextToSpeech } from '@capacitor-community/text-to-speech'

export class NativePlugins {
  static async takePicture(): Promise<string> {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Base64
    })
    return `data:image/jpeg;base64,${image.base64String}`
  }
  
  static async vibrate(type: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    const style = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy
    }[type]
    
    await Haptics.impact({ style })
  }
  
  static async speak(text: string, language = 'en-US'): Promise<void> {
    await TextToSpeech.speak({
      text,
      lang: language,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      category: 'ambient'
    })
  }
}
```

### App Store Requirements

**iOS App Store Configuration:**
```plist
<!-- ios/App/App/Info.plist -->
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for speech recognition features</string>
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to take pictures for cards</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs photo library access to select images for cards</string>
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

**Android Play Store Configuration:**
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.VIBRATE" />

<application
  android:label="Tiko"
  android:icon="@mipmap/ic_launcher"
  android:theme="@style/AppTheme">
  
  <meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx"/>
</application>
```

### Push Notifications

**Notification Service:**
```ts
// @tiko/core/notifications/PushService.ts
export class PushNotificationService {
  static async init(): Promise<void> {
    const permission = await PushNotifications.requestPermissions()
    
    if (permission.receive === 'granted') {
      await PushNotifications.register()
    }
    
    PushNotifications.addListener('registration', (token) => {
      // Send token to backend
      ApiClient.post('/notifications/register', { token: token.value })
    })
    
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      // Handle foreground notification
      NotificationService.show(notification.title, 'info')
    })
  }
  
  static async scheduleReminder(type: 'practice' | 'session', delay: number): Promise<void> {
    await LocalNotifications.schedule({
      notifications: [{
        title: 'Time to practice!',
        body: 'Your Tiko session is ready',
        id: Date.now(),
        schedule: { at: new Date(Date.now() + delay) },
        actionTypeId: 'OPEN_APP'
      }]
    })
  }
}
```

---

## 🛡️ Backup & Disaster Recovery

**Automated Backup Strategy:**
```ts
// backend/services/BackupService.ts
export class BackupService {
  static async createDailyBackup(): Promise<void> {
    const timestamp = new Date().toISOString()
    
    // Backup user data
    await this.backupUserData(`backup-users-${timestamp}`)
    
    // Backup media assets
    await this.backupMediaAssets(`backup-media-${timestamp}`)
    
    // Backup application data
    await this.backupAppData(`backup-apps-${timestamp}`)
    
    // Clean old backups (keep 30 days)
    await this.cleanOldBackups(30)
  }
  
  static async restoreFromBackup(backupId: string): Promise<void> {
    // Restore process with rollback capability
    const transaction = await db.transaction()
    
    try {
      await this.restoreUserData(backupId, transaction)
      await this.restoreMediaAssets(backupId, transaction)
      await this.restoreAppData(backupId, transaction)
      
      await transaction.commit()
      Logger.info('Backup restore completed', { backupId })
    } catch (error) {
      await transaction.rollback()
      throw new Error(`Backup restore failed: ${error.message}`)
    }
  }
}
```

---

## 🎛️ Admin Dashboard & CMS

### Admin Interface Requirements

**Admin Dashboard Structure:**
```
admin.tiko.org/
├── /dashboard          # Overview & analytics
├── /users             # User management
├── /content           # Content management
├── /media             # Media library
├── /translations      # Translation management
├── /analytics         # Usage analytics
├── /moderation        # Content moderation
└── /settings          # System settings
```

**Authentication & Authorization:**
```ts
// @tiko/admin/auth/AdminAuth.ts
export class AdminAuth {
  static roles = {
    super_admin: ['*'],
    content_admin: ['content:*', 'media:*', 'translations:*'],
    moderator: ['moderation:*', 'users:read'],
    analyst: ['analytics:read', 'users:read']
  } as const
  
  static hasPermission(userRole: string, permission: string): boolean {
    const permissions = this.roles[userRole as keyof typeof this.roles]
    return permissions.includes('*') || 
           permissions.includes(permission) ||
           permissions.some(p => p.endsWith(':*') && permission.startsWith(p.split(':')[0]))
  }
}
```

### Content Management System

**Media Library Management:**
```ts
// @tiko/admin/services/MediaCMS.ts
export class MediaCMS {
  static async uploadMedia(file: File, metadata: MediaMetadata): Promise<MediaAsset> {
    // Validate file type and size
    this.validateFile(file)
    
    // Generate optimized versions
    const versions = await this.generateVersions(file)
    
    // Upload to S3
    const urls = await this.uploadToStorage(versions)
    
    // Save to database
    return await this.saveMediaAsset({
      ...metadata,
      urls,
      uploadedBy: getCurrentAdmin().id
    })
  }
  
  static async moderateContent(mediaId: string): Promise<ModerationResult> {
    const media = await this.getMedia(mediaId)
    
    // AI-powered content moderation
    const aiResult = await OpenAI.moderateImage(media.url)
    
    // Manual review required for uncertain cases
    if (aiResult.confidence < 0.8) {
      await this.flagForManualReview(mediaId, aiResult)
    }
    
    return aiResult
  }
}
```

**Translation Management:**
```ts
// @tiko/admin/services/TranslationCMS.ts
export class TranslationCMS {
  static async generateMissingTranslations(language: string): Promise<void> {
    const missingKeys = await this.findMissingTranslations(language)
    
    for (const key of missingKeys) {
      const baseText = await this.getBaseTranslation(key)
      
      // Generate translation using AI
      const translation = await OpenAI.translate(baseText, language)
      
      // Save as draft for review
      await this.saveDraftTranslation(key, language, translation)
    }
  }
  
  static async exportTranslations(language: string): Promise<Record<string, string>> {
    return await this.getTranslationsForLanguage(language)
  }
  
  static async importTranslations(language: string, translations: Record<string, string>): Promise<void> {
    // Validate and import translations
    for (const [key, value] of Object.entries(translations)) {
      await this.validateAndSaveTranslation(key, language, value)
    }
  }
}
```

### Analytics Dashboard

**Usage Analytics:**
```ts
// @tiko/admin/analytics/UsageAnalytics.ts
export class UsageAnalytics {
  static async getDashboardData(): Promise<DashboardData> {
    const timeRange = { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() }
    
    return {
      totalUsers: await this.getTotalUsers(),
      activeUsers: await this.getActiveUsers(timeRange),
      appUsage: await this.getAppUsageStats(timeRange),
      sessionData: await this.getSessionAnalytics(timeRange),
      progressMetrics: await this.getProgressMetrics(timeRange),
      performanceData: await this.getPerformanceMetrics(timeRange)
    }
  }
  
  static async getAppUsageStats(timeRange: TimeRange): Promise<AppUsageStats[]> {
    return [
      { app: 'yes-no', sessions: 1245, avgDuration: 180, uniqueUsers: 456 },
      { app: 'cards', sessions: 892, avgDuration: 420, uniqueUsers: 321 },
      { app: 'speak', sessions: 567, avgDuration: 360, uniqueUsers: 234 },
      // ... more apps
    ]
  }
}
```

**User Progress Tracking:**
```ts
// @tiko/admin/analytics/ProgressTracking.ts
export class ProgressTracking {
  static async getUserProgressReport(userId: string): Promise<UserProgressReport> {
    return {
      user: await this.getUserInfo(userId),
      appProgress: {
        'repeat': await this.getRepeatProgress(userId),
        'cards': await this.getCardsProgress(userId),
        'speak': await this.getSpeakProgress(userId)
      },
      milestones: await this.getUserMilestones(userId),
      recommendations: await this.generateRecommendations(userId)
    }
  }
  
  static async getAggregatedProgress(): Promise<AggregatedProgressData> {
    return {
      averageAccuracy: await this.getAverageAccuracy(),
      completionRates: await this.getCompletionRates(),
      progressTrends: await this.getProgressTrends(),
      strugglingAreas: await this.identifyStrugglingAreas()
    }
  }
}
```

### Admin Interface Components

**Admin Dashboard Layout:**
```vue
<!-- @tiko/admin/components/AdminDashboard.vue -->
<template>
  <div class="admin-dashboard">
    <AdminSidebar />
    
    <main class="admin-main">
      <AdminHeader />
      
      <div class="admin-content">
        <DashboardCards :stats="dashboardStats" />
        
        <div class="admin-grid">
          <UsageChart :data="usageData" />
          <RecentActivity :activities="recentActivities" />
          <UserGrowth :data="userGrowthData" />
          <SystemHealth :metrics="healthMetrics" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const dashboardStats = await UsageAnalytics.getDashboardData()
const usageData = await UsageAnalytics.getAppUsageStats(last30Days)
const recentActivities = await ActivityLogger.getRecentActivities()
const userGrowthData = await UserAnalytics.getGrowthData()
const healthMetrics = await SystemMonitor.getHealthMetrics()
</script>
```

**Content Moderation Queue:**
```vue
<!-- @tiko/admin/components/ModerationQueue.vue -->
<template>
  <div class="moderation-queue">
    <h2>Content Moderation Queue</h2>
    
    <div class="filter-controls">
      <select v-model="filter.type">
        <option value="all">All Content</option>
        <option value="flagged">Flagged Content</option>
        <option value="pending">Pending Review</option>
      </select>
      
      <select v-model="filter.app">
        <option value="all">All Apps</option>
        <option value="cards">Cards</option>
        <option value="story">Story</option>
      </select>
    </div>
    
    <div class="moderation-items">
      <ModerationItem
        v-for="item in filteredItems"
        :key="item.id"
        :item="item"
        @approve="approveContent"
        @reject="rejectContent"
        @flag="flagContent"
      />
    </div>
  </div>
</template>
```

### System Configuration

**Feature Flags Management:**
```ts
// @tiko/admin/config/FeatureFlags.ts
export class FeatureFlags {
  static flags = {
    'speech-recognition': { enabled: true, rollout: 100 },
    'ai-story-generation': { enabled: false, rollout: 0 },
    'advanced-analytics': { enabled: true, rollout: 50 },
    'new-ui-theme': { enabled: false, rollout: 5 }
  }
  
  static isEnabled(flag: string, userId?: string): boolean {
    const config = this.flags[flag]
    if (!config || !config.enabled) return false
    
    // Rollout percentage check
    if (userId) {
      const hash = this.hashUserId(userId)
      return hash % 100 < config.rollout
    }
    
    return true
  }
  
  static async updateFlag(flag: string, enabled: boolean, rollout: number): Promise<void> {
    await this.saveFeatureFlag(flag, { enabled, rollout })
    this.flags[flag] = { enabled, rollout }
  }
}
```

---

## 🔄 Migration from Existing tikotalks/lib

### Component Migration Strategy

**Proven Components to Migrate:**

1. **Button Component** (`tikotalks/lib/components/ui/Button/`)
   - ✅ Long press functionality with vibration
   - ✅ Multiple variants (default, ghost, fancy)
   - ✅ Icon support (left/right positioning)
   - ✅ Status states (loading, success, error)
   - ✅ Router integration
   - **Migration**: Copy to `packages/ui/src/components/TButton/`

2. **Card Component** (`tikotalks/lib/components/ui/Card/`)
   - ✅ Dynamic background color extraction
   - ✅ Flexible sizing (small, medium, large)
   - ✅ Multi-content support (emoji, icon, image)
   - ✅ Action buttons integration
   - **Migration**: Adapt for `packages/ui/src/components/TCard/`

3. **Icon Component** (`tikotalks/lib/components/ui/Icon/`)
   - ✅ Dynamic SVG loading with 'open-icon'
   - ✅ Size variants with em-based scaling
   - ✅ Color inheritance
   - **Migration**: Copy to `packages/ui/src/components/TIcon/`

**Additional Components to Extract:**
- ContextMenu, ContextPanel, Form, Popup components
- ButtonGroup for related actions

### BEM Architecture Migration

**useBemm() Composable:**
```ts
// Migrate from tikotalks/lib
export const useBemm = (block: string) => {
  const bem = (element?: string, modifier?: string) => {
    let className = block;
    if (element) className += `__${element}`;
    if (modifier) className += `--${modifier}`;
    return className;
  };
  
  return { bem };
};
```

**SCSS Structure:**
```scss
// Migrate your proven patterns
@import '@tiko/ui/styles/variables';
@import '@tiko/ui/styles/mixins';

.component {
  // Base styles
  
  &__element {
    // Element styles
  }
  
  &--modifier {
    // Modifier styles
  }
  
  &--small { font-size: 0.8em; }
  &--medium { font-size: 1em; }
  &--large { font-size: 1.2em; }
}
```

### Migration Checklist

- [ ] Copy proven Button component with all features
- [ ] Migrate Card component with background color extraction
- [ ] Set up Icon system with 'open-icon' integration
- [ ] Extract useBemm() composable
- [ ] Migrate SCSS variables and mixins
- [ ] Update TypeScript interfaces
- [ ] Test component compatibility
- [ ] Add Storybook documentation

---

## 🛠️ Development Workflow

### Getting Started

```bash
# Clone and setup
git clone <repo-url>
cd tiko-mono
pnpm install

# Start development
nx serve yes-no    # Start Yes/No app
nx serve cards     # Start Cards app
nx serve speak     # Start Speak app
nx serve timer     # Start Timer app
nx serve repeat    # Start Repeat app

# Run tests
nx test <app-name>
nx test --all

# Build for production
nx build <app-name>
nx build --all
```

### Monorepo Commands

```bash
# Add new package
nx g @nrwl/node:app new-app
nx g @nrwl/node:lib new-package

# Run tasks across multiple projects
nx run-many --target=build --all
nx run-many --target=test --projects=yes-no,timer

# Dependency graph
nx dep-graph

# Affected commands (only changed projects)
nx affected:build
nx affected:test
```

### Code Standards

* **TypeScript**: Strict mode enabled
* **ESLint**: Airbnb config with Vue extensions
* **Prettier**: Auto-formatting on save
* **Husky**: Pre-commit hooks for linting and tests
* **Conventional Commits**: Semantic commit messages

### Testing Strategy

**Unit Testing (Jest + Vue Test Utils)**
```ts
// Example: TButton component test
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TButton from '@tiko/ui/TButton.vue'

describe('TButton', () => {
  it('emits action on click', async () => {
    const action = vi.fn()
    const wrapper = mount(TButton, {
      props: { action, color: 'primary' }
    })
    
    await wrapper.trigger('click')
    expect(action).toHaveBeenCalled()
  })
  
  it('handles long press', async () => {
    const onLongPress = vi.fn()
    const wrapper = mount(TButton, {
      props: { onLongPress, longPressTime: 500 }
    })
    
    wrapper.trigger('pointerdown')
    await new Promise(resolve => setTimeout(resolve, 600))
    expect(onLongPress).toHaveBeenCalled()
  })
})
```

**Integration Testing (Pinia Stores)**
```ts
// Example: Speech store test
import { createPinia, setActivePinia } from 'pinia'
import { useSpeechStore } from '@tiko/core/stores/speech'

describe('Speech Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('queues speech correctly', async () => {
    const store = useSpeechStore()
    store.speak('Hello')
    store.speak('World')
    
    expect(store.queue).toHaveLength(2)
    expect(store.isPlaying).toBe(true)
  })
})
```

**E2E Testing (Cypress)**
```ts
// Example: Yes/No app flow
describe('Yes/No App', () => {
  it('completes question-answer flow', () => {
    cy.visit('/yesno')
    cy.get('[data-cy=question-input]').type('Do you like ice cream?')
    cy.get('[data-cy=save-question]').click()
    cy.get('[data-cy=question-display]').should('contain', 'Do you like ice cream?')
    cy.get('[data-cy=yes-button]').click()
    cy.get('[data-cy=feedback]').should('be.visible')
  })
})
```

**Accessibility Testing (axe-core)**
```ts
// Example: Accessibility test
describe('Accessibility', () => {
  it('meets WCAG standards', () => {
    cy.visit('/cards')
    cy.injectAxe()
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true }
      }
    })
  })
})
```

**Performance Testing (Lighthouse CI)**
```js
// lighthouse.config.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/yesno', 'http://localhost:3000/cards'],
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }]
      }
    }
  }
}
```

**Test Coverage Requirements:**
* **Unit Tests**: 80% minimum coverage for shared packages
* **Integration Tests**: All store actions and API calls
* **E2E Tests**: Critical user journeys for each app
* **Accessibility**: 100% WCAG AA compliance
* **Performance**: Core Web Vitals thresholds

### Contribution Guidelines

1. **Branch Naming**: `feature/app-name-description` or `fix/app-name-issue`
2. **Pull Requests**: Require 2 approvals, all tests passing
3. **Code Review**: Focus on accessibility, performance, and maintainability
4. **Documentation**: Update README and inline comments
5. **Testing**: Add tests for new features and bug fixes

### Error Handling & Logging

**Error Handling Strategy**
```ts
// @tiko/core/errors/ErrorHandler.ts
export class ErrorHandler {
  static handle(error: Error, context: string): void {
    // Log error
    Logger.error(error.message, {
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    })
    
    // Show user-friendly message
    if (error instanceof NetworkError) {
      NotificationService.show('Connection lost. Trying to reconnect...', 'warning')
    } else if (error instanceof ValidationError) {
      NotificationService.show(error.userMessage, 'error')
    } else {
      NotificationService.show('Something went wrong. Please try again.', 'error')
    }
    
    // Send to monitoring service
    if (import.meta.env.PROD) {
      Sentry.captureException(error, { tags: { context } })
    }
  }
}

// Custom error types
export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public userMessage: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
```

**Logging Service**
```ts
// @tiko/core/services/Logger.ts
export class Logger {
  static debug(message: string, data?: any): void {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, data)
    }
  }
  
  static info(message: string, data?: any): void {
    console.info(`[INFO] ${message}`, data)
    this.sendToService('info', message, data)
  }
  
  static warn(message: string, data?: any): void {
    console.warn(`[WARN] ${message}`, data)
    this.sendToService('warn', message, data)
  }
  
  static error(message: string, data?: any): void {
    console.error(`[ERROR] ${message}`, data)
    this.sendToService('error', message, data)
  }
  
  private static sendToService(level: string, message: string, data?: any): void {
    if (import.meta.env.PROD) {
      // Send to logging service (e.g., DataDog, LogRocket)
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          message,
          data,
          timestamp: new Date().toISOString(),
          app: import.meta.env.VITE_APP_NAME,
          userId: useAuthStore().user?.id
        })
      }).catch(() => {
        // Silently fail - don't log errors about logging
      })
    }
  }
}
```

**API Error Handling**
```ts
// @tiko/core/api/client.ts
export class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    try {
      const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
          ...options.headers
        }
      })
      
      if (!response.ok) {
        throw new ApiError(response.status, await response.text())
      }
      
      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      // Network or other errors
      throw new NetworkError('Unable to connect to server')
    }
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}
```

### Performance Monitoring

**Core Web Vitals Tracking**
```ts
// @tiko/core/performance/WebVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

export class WebVitalsTracker {
  static init(): void {
    getCLS(this.sendToAnalytics)
    getFID(this.sendToAnalytics)
    getFCP(this.sendToAnalytics)
    getLCP(this.sendToAnalytics)
    getTTFB(this.sendToAnalytics)
  }
  
  private static sendToAnalytics(metric: any): void {
    // Send to analytics service
    if (import.meta.env.PROD) {
      gtag('event', metric.name, {
        value: Math.round(metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta
      })
    }
  }
}
```

**Performance Budget**
```js
// performance-budget.json
{
  "budgets": [
    {
      "path": "/**",
      "timings": [
        { "metric": "interactive", "budget": "3s" },
        { "metric": "first-contentful-paint", "budget": "1.5s" },
        { "metric": "largest-contentful-paint", "budget": "2.5s" }
      ],
      "resourceSizes": [
        { "resourceType": "script", "budget": "200kb" },
        { "resourceType": "total", "budget": "500kb" }
      ]
    }
  ]
}
```

### Environment Management

**Environment Configuration**
```ts
// config/environments.ts
export const environments = {
  development: {
    API_BASE_URL: 'http://localhost:3001',
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_ANON_KEY: 'dev-key',
    LOG_LEVEL: 'debug',
    ENABLE_ANALYTICS: false
  },
  staging: {
    API_BASE_URL: 'https://api-staging.tiko.org',
    SUPABASE_URL: 'https://staging-project.supabase.co',
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    LOG_LEVEL: 'info',
    ENABLE_ANALYTICS: true
  },
  production: {
    API_BASE_URL: 'https://api.tiko.org',
    SUPABASE_URL: 'https://prod-project.supabase.co',
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    LOG_LEVEL: 'warn',
    ENABLE_ANALYTICS: true
  }
}
```

### Release Process

* **Apps**: Independent versioning and deployment
* **Packages**: Semantic versioning with changesets
* **Staging**: Automatic deployment to staging environment
* **Production**: Manual deployment after QA approval
* **Rollback**: Automated rollback on critical errors
* **Monitoring**: Real-time alerts for performance degradation

---

## 🚀 Ready to Build

This comprehensive specification defines a complete monorepo for building accessibility-focused, multilingual apps for children. The architecture supports:

* **Scalability**: Independent app development and deployment
* **Consistency**: Shared components and design system
* **Accessibility**: Built-in support for various needs
* **Performance**: Offline-first with optimal loading
* **Maintainability**: Clear separation of concerns and shared utilities

**Recommended Build Order:**

**Phase 1 - Foundation (MVP)**
1. **Yes/No** - Simple MVP to establish patterns
2. **Timer** - Add basic state management
3. **Type** - Simple text-to-speech implementation

**Phase 2 - Core Features**
4. **Cards** - Implement media system and complex interactions
5. **Sounds** - Add audio system and caching
6. **Repeat** - Add speech recognition and theme system

**Phase 3 - Advanced Features**
7. **Match** - Implement drag & drop and game logic
8. **Sequence** - Add sequencing and routine logic
9. **Board** - Advanced grid system with card integration

**Phase 4 - AI Integration**
10. **Speak** - Complex sentence building with grammar engine
11. **Story** - AI-powered story generation and narration

This progression builds complexity gradually while establishing your core architecture patterns. Each phase introduces new technical capabilities that subsequent apps can leverage.
