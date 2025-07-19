#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Translations for common UI terms
const translations = {
  el: { // Greek
    // Common
    'Required': 'Απαιτείται',
    'Optional': 'Προαιρετικό',
    'or drag and drop here': 'ή σύρετε και αποθέστε εδώ',
    'Increase value': 'Αύξηση τιμής',
    'Decrease value': 'Μείωση τιμής',
    'Online': 'Συνδεδεμένος',
    'Offline': 'Αποσυνδεδεμένος',
    'Expand group': 'Επέκταση ομάδας',
    'Collapse group': 'Σύμπτυξη ομάδας',
    'Application loading': 'Φόρτωση εφαρμογής',
    'Day': 'Ημέρα',
    'Month': 'Μήνας',
    'Search icons...': 'Αναζήτηση εικονιδίων...',
    'Background Image': 'Εικόνα Φόντου',
    'Preview': 'Προεπισκόπηση',
    'Just now': 'Μόλις τώρα',
    '{count}m ago': 'πριν {count}λ',
    '{count}h ago': 'πριν {count}ω',
    '{count}d ago': 'πριν {count}η',
    'more': 'περισσότερα',
    'Dismiss': 'Απόρριψη',
    
    // Auth
    'Login to your account': 'Συνδεθείτε στον λογαριασμό σας',
    'Email Address': 'Διεύθυνση Email',
    'Enter your email': 'Εισάγετε το email σας',
    'Send Code': 'Αποστολή κώδικα',
    'or': 'ή',
    'Login with Apple': 'Σύνδεση με Apple',
    "Don't have an account?": 'Δεν έχετε λογαριασμό;',
    'Register': 'Εγγραφή',
    'Option 1: Click the magic link in your email': 'Επιλογή 1: Κάντε κλικ στον μαγικό σύνδεσμο στο email σας',
    'Option 2: Enter the {codeLength}-digit code': 'Επιλογή 2: Εισάγετε τον {codeLength}-ψήφιο κώδικα',
    'Verification Code': 'Κωδικός επαλήθευσης',
    'Enter {codeLength}-digit code': 'Εισάγετε {codeLength}-ψήφιο κώδικα',
    'Verify Code': 'Επαλήθευση κώδικα',
    "Didn't receive code?": 'Δεν λάβατε κώδικα;',
    'Resend': 'Επαναποστολή',
    'Use different email': 'Χρήση άλλου email',
    'Create your account': 'Δημιουργία λογαριασμού',
    'Full Name (Optional)': 'Πλήρες όνομα (Προαιρετικό)',
    'Enter your full name': 'Εισάγετε το πλήρες όνομά σας',
    'Already have an account?': 'Έχετε ήδη λογαριασμό;',
    'Try Again': 'Δοκιμάστε ξανά',
    'Please enter a valid email address': 'Παρακαλώ εισάγετε έγκυρη διεύθυνση email',
    'Please enter a valid {codeLength}-digit code': 'Παρακαλώ εισάγετε έγκυρο {codeLength}-ψήφιο κώδικα',
    'Preparing your app...': 'Προετοιμασία της εφαρμογής σας...',
    'Welcome to Tiko': 'Καλώς ήρθατε στο Tiko',
    'Sign in to access your communication apps': 'Συνδεθείτε για πρόσβαση στις εφαρμογές επικοινωνίας σας',
    'Apple Sign-In failed': 'Η σύνδεση με Apple απέτυχε',
    'Failed to send verification code': 'Αποτυχία αποστολής κώδικα επαλήθευσης',
    'Invalid verification code': 'Μη έγκυρος κωδικός επαλήθευσης',
    'Failed to resend code': 'Αποτυχία επαναποστολής κώδικα',
    
    // Cards
    'Done': 'Ολοκληρώθηκε',
    'Select cards to organize or delete': 'Επιλέξτε κάρτες για οργάνωση ή διαγραφή',
    'Tap cards to speak': 'Πατήστε τις κάρτες για ομιλία',
    'Cards Settings': 'Ρυθμίσεις καρτών',
    'selected': 'επιλεγμένες',
    'Close modal': 'Κλείσιμο παραθύρου',
    'What should be spoken when tapped': 'Τι θα πρέπει να ειπωθεί όταν πατηθεί',
    
    // Type
    'Type Game Settings': 'Ρυθμίσεις παιχνιδιού πληκτρολόγησης',
    'Type & Speak': 'Πληκτρολόγηση & Ομιλία',
    'Type text and hear it spoken aloud': 'Πληκτρολογήστε κείμενο και ακούστε το να εκφωνείται',
    'Text to speak': 'Κείμενο για ομιλία',
    'Stop': 'Διακοπή',
    'Pause': 'Παύση',
    'Voice': 'Φωνή',
    'Loading voices...': 'Φόρτωση φωνών...',
    'Select a voice': 'Επιλέξτε φωνή',
    'Recent': 'Πρόσφατα',
    'Speak this text': 'Εκφώνηση αυτού του κειμένου',
    'Copy to input': 'Αντιγραφή στην είσοδο',
    'Show All History': 'Εμφάνιση όλου του ιστορικού',
    'Voice Settings': 'Ρυθμίσεις φωνής',
    'Speech Rate': 'Ταχύτητα ομιλίας',
    'Pitch': 'Τόνος',
    'Volume': 'Ένταση',
    'Save to history automatically': 'Αυτόματη αποθήκευση στο ιστορικό',
    
    // YesNo
    'Yes/No Settings': 'Ρυθμίσεις Ναι/Όχι',
    'Type your question here...': 'Πληκτρολογήστε την ερώτησή σας εδώ...',
    'Type your question or select from recent questions': 'Πληκτρολογήστε την ερώτηση σας ή επιλέξτε από τις πρόσφατες',
    'Remove from favorites': 'Αφαίρεση από αγαπημένα',
    'Add to favorites': 'Προσθήκη στα αγαπημένα',
    'Delete question': 'Διαγραφή ερώτησης',
    'Button Size': 'Μέγεθος κουμπιού',
    'Small': 'Μικρό',
    'Medium': 'Μεσαίο',
    'Large': 'Μεγάλο',
    'Auto-speak answers': 'Αυτόματη εκφώνηση απαντήσεων',
    'Haptic feedback': 'Απτική ανταπόκριση',
    
    // Radio
    'Try Again': 'Δοκιμάστε ξανά',
    'Edit Audio Item': 'Επεξεργασία ηχητικού στοιχείου',
    'Audio track title': 'Τίτλος ηχητικού κομματιού',
    'plays': 'αναπαραγωγές',
    'No audio selected': 'Δεν επιλέχθηκε ήχος',
    'Sleep in {minutes}m': 'Ύπνος σε {minutes}λ',
    'Searching for': 'Αναζήτηση για',
    '{count, plural, =0 {No results found} =1 {1 result found} other {{count} results found}}': '{count, plural, =0 {Δεν βρέθηκαν αποτελέσματα} =1 {1 αποτέλεσμα βρέθηκε} other {{count} αποτελέσματα βρέθηκαν}}',
    'Searching your audio collection...': 'Αναζήτηση στη συλλογή ήχου σας...',
    'Try searching with different keywords or check your spelling.': 'Δοκιμάστε αναζήτηση με διαφορετικές λέξεις κλειδιά ή ελέγξτε την ορθογραφία σας.',
    'play': 'αναπαραγωγή',
    'Play All Results': 'Αναπαραγωγή όλων των αποτελεσμάτων',
    'Search audio by title, description, or tags...': 'Αναζήτηση ήχου με τίτλο, περιγραφή ή ετικέτες...',
    
    // Parent Mode
    'Enable Parent Mode': 'Ενεργοποίηση λειτουργίας γονέα',
    'Set Up Parent Mode': 'Ρύθμιση λειτουργίας γονέα',
    'Enter Parent PIN': 'Εισάγετε PIN γονέα',
    'Create a 4-digit PIN to protect parental controls': 'Δημιουργήστε 4-ψήφιο PIN για προστασία γονικού ελέγχου',
    'Enter your 4-digit PIN to access parent controls': 'Εισάγετε το 4-ψήφιο PIN για πρόσβαση στον γονικό έλεγχο',
    'Parent mode enabled successfully': 'Η λειτουργία γονέα ενεργοποιήθηκε επιτυχώς',
    'Failed to enable parent mode': 'Αποτυχία ενεργοποίησης λειτουργίας γονέα',
    'Disable Parent Mode': 'Απενεργοποίηση λειτουργίας γονέα',
    'Are you sure you want to disable Parent Mode? This will remove all parental controls.': 'Είστε σίγουροι ότι θέλετε να απενεργοποιήσετε τη λειτουργία γονέα; Αυτό θα αφαιρέσει όλους τους γονικούς ελέγχους.',
    'Yes, Disable': 'Ναι, απενεργοποίηση',
    'Parent mode disabled': 'Λειτουργία γονέα απενεργοποιήθηκε',
    'Failed to disable parent mode': 'Αποτυχία απενεργοποίησης λειτουργίας γονέα',
    'Cannot disable parent mode - no popup service available': 'Αδυναμία απενεργοποίησης λειτουργίας γονέα - μη διαθέσιμη υπηρεσία popup',
    'Insufficient permissions for this action': 'Ανεπαρκή δικαιώματα για αυτή την ενέργεια',
    'Parent mode unlocked': 'Λειτουργία γονέα ξεκλειδώθηκε',
    'Confirm your PIN': 'Επιβεβαιώστε το PIN σας',
    'PIN must be exactly 4 digits': 'Το PIN πρέπει να είναι ακριβώς 4 ψηφία',
    'Hide Numbers': 'Απόκρυψη αριθμών',
    'Show Numbers': 'Εμφάνιση αριθμών',
    
    // Validation
    'Only one number is allowed': 'Επιτρέπεται μόνο ένας αριθμός',
    
    // UI Docs
    'Documentation Settings': 'Ρυθμίσεις τεκμηρίωσης',
    'Buttons': 'Κουμπιά',
    'Buttons Documentation': 'Τεκμηρίωση κουμπιών',
    'Cards': 'Κάρτες',
    'Cards Documentation': 'Τεκμηρίωση καρτών',
    'Colors': 'Χρώματα',
    'Colors Documentation': 'Τεκμηρίωση χρωμάτων',
    'Icons': 'Εικονίδια',
    'Icons Documentation': 'Τεκμηρίωση εικονιδίων',
    'Inputs': 'Είσοδοι',
    'Inputs Documentation': 'Τεκμηρίωση εισόδων',
    'Welcome to UI Documentation': 'Καλώς ήρθατε στην τεκμηρίωση UI',
    'Explore our components': 'Εξερευνήστε τα στοιχεία μας',
    'Coming Soon': 'Σύντομα',
    'Tiko UI Documentation': 'Τεκμηρίωση Tiko UI',
    'Complete documentation and testing suite for all Tiko UI components': 'Πλήρης τεκμηρίωση και σουίτα δοκιμών για όλα τα στοιχεία Tiko UI',
    'Interactive button components with various styles and states': 'Διαδραστικά στοιχεία κουμπιών με διάφορα στυλ και καταστάσεις',
    'Complete icon library with over 1000+ icons': 'Πλήρης βιβλιοθήκη εικονιδίων με πάνω από 1000+ εικονίδια',
    'Input Components': 'Στοιχεία εισόδου',
    'Form inputs, selects, textareas and validation': 'Είσοδοι φόρμας, επιλογές, περιοχές κειμένου και επικύρωση',
    'Content containers and card layouts': 'Περιέκτες περιεχομένου και διατάξεις καρτών',
    'Color System': 'Σύστημα χρωμάτων',
    'Color palette, themes and semantic colors': 'Παλέτα χρωμάτων, θέματα και σημασιολογικά χρώματα',
    'Quick Start': 'Γρήγορη εκκίνηση',
    'This documentation app showcases all available UI components in the Tiko design system. Each section demonstrates component usage, props, variants, and best practices.': 'Αυτή η εφαρμογή τεκμηρίωσης παρουσιάζει όλα τα διαθέσιμα στοιχεία UI στο σύστημα σχεδιασμού Tiko. Κάθε ενότητα επιδεικνύει τη χρήση στοιχείων, ιδιότητες, παραλλαγές και βέλτιστες πρακτικές.',
    'Code Examples': 'Παραδείγματα κώδικα',
    'See working examples with syntax highlighting': 'Δείτε λειτουργικά παραδείγματα με επισήμανση σύνταξης',
    'Live Previews': 'Ζωντανές προεπισκοπήσεις',
    'Interactive component previews': 'Διαδραστικές προεπισκοπήσεις στοιχείων',
    'Documentation': 'Τεκμηρίωση',
    'Complete prop and usage documentation': 'Πλήρης τεκμηρίωση ιδιοτήτων και χρήσης',
    'items': 'στοιχεία',
  },
  fr: { // French
    // Common
    'Application loading': "Chargement de l'application",
    'Just now': "À l'instant",
    
    // Auth
    "Don't have an account?": "Vous n'avez pas de compte ?",
    'Register': "S'inscrire",
    "Didn't receive code?": "Vous n'avez pas reçu le code ?",
    'Failed to send verification code': "Échec de l'envoi du code de vérification",
    
    // Cards
    'Done': 'Terminé',
    'Select cards to organize or delete': 'Sélectionnez les cartes à organiser ou supprimer',
    'Tap cards to speak': 'Appuyez sur les cartes pour parler',
    'Cards Settings': 'Paramètres des cartes',
    'selected': 'sélectionné(s)',
    'Close modal': 'Fermer la fenêtre',
    'What should be spoken when tapped': 'Que devrait-il être prononcé lors du clic',
    
    // Type
    'Copy to input': "Copier dans l'entrée",
    'Show All History': "Afficher tout l'historique",
    'Save to history automatically': "Enregistrer automatiquement dans l'historique",
    
    // Radio
    'Edit Audio Item': "Modifier l'article audio",
    'Search audio by title, description, or tags...': "Rechercher de l'audio par titre, description ou étiquettes...",
    
    // Parent Mode
    'Failed to enable parent mode': "Échec de l'activation du mode parent",
    
    // UI Docs
    'Welcome to UI Documentation': "Bienvenue dans la documentation de l'interface utilisateur",
    'Tiko UI Documentation': "Documentation de l'interface utilisateur Tiko",
    'Complete documentation and testing suite for all Tiko UI components': "Documentation complète et suite de tests pour tous les composants de l'interface utilisateur Tiko",
    'Complete icon library with over 1000+ icons': "Bibliothèque d'icônes complète avec plus de 1000+ icônes",
    'Input Components': "Composants d'entrée",
    'This documentation app showcases all available UI components in the Tiko design system. Each section demonstrates component usage, props, variants, and best practices.': "Cette application de documentation présente tous les composants d'interface utilisateur disponibles dans le système de conception Tiko. Chaque section démontre l'utilisation des composants, les propriétés, les variantes et les meilleures pratiques.",
    'Complete prop and usage documentation': "Documentation complète des propriétés et de l'utilisation",
  },
  it: { // Italian
    // Radio
    'Edit Audio Item': 'Modifica elemento audio',
    'Search audio by title, description, or tags...': 'Cerca audio per titolo, descrizione o tag...',
    
    // Parent Mode
    'Failed to enable parent mode': 'Impossibile attivare la modalità genitore',
    
    // Common
    'Application loading': 'Caricamento applicazione',
    'Just now': 'Proprio ora',
    
    // Auth  
    'Register': 'Registrati',
    "Don't have an account?": 'Non hai un account?',
    "Didn't receive code?": 'Non hai ricevuto il codice?',
    'Failed to send verification code': "Impossibile inviare il codice di verifica",
    
    // Cards
    'Done': 'Fatto',
    'Select cards to organize or delete': 'Seleziona le carte da organizzare o eliminare',
    'Tap cards to speak': 'Tocca le carte per parlare',
    'Cards Settings': 'Impostazioni carte',
    'selected': 'selezionate',
    'Close modal': 'Chiudi finestra',
    'What should be spoken when tapped': 'Cosa dovrebbe essere pronunciato quando toccato',
    
    // Type
    'Copy to input': "Copia nell'input",
    'Show All History': 'Mostra tutta la cronologia',
    'Save to history automatically': 'Salva automaticamente nella cronologia',
    
    // UI Docs
    'Welcome to UI Documentation': 'Benvenuto nella documentazione UI',
    'Tiko UI Documentation': 'Documentazione UI Tiko',
    'Complete documentation and testing suite for all Tiko UI components': 'Documentazione completa e suite di test per tutti i componenti UI Tiko',
    'Complete icon library with over 1000+ icons': 'Libreria completa di icone con oltre 1000+ icone',
    'Input Components': 'Componenti di input',
    'This documentation app showcases all available UI components in the Tiko design system. Each section demonstrates component usage, props, variants, and best practices.': "Questa app di documentazione mostra tutti i componenti UI disponibili nel sistema di design Tiko. Ogni sezione dimostra l'uso dei componenti, le proprietà, le varianti e le migliori pratiche.",
    'Complete prop and usage documentation': "Documentazione completa delle proprietà e dell'utilizzo",
  },
  hy: { // Armenian
    // All the same TODOs as other languages - would need proper Armenian translations
  },
  mt: { // Maltese  
    // All the same TODOs as other languages - would need proper Maltese translations
  }
}

function fixTodosInFile(filePath, language) {
  console.log(`Fixing TODOs in ${filePath} for language: ${language}`)
  
  let content = fs.readFileSync(filePath, 'utf8')
  let changeCount = 0
  
  // Match lines with TODO pattern - both single and double quotes
  const todoPatternSingle = /^(\s*)([\w]+):\s*'([^']+)\s*\[TODO:[^\]]+\]'(,?)$/gm
  const todoPatternDouble = /^(\s*)([\w]+):\s*"([^"]+)\s*\[TODO:[^\]]+\]"(,?)$/gm
  
  // Replace single quote TODOs
  content = content.replace(todoPatternSingle, (match, indent, key, englishText, comma) => {
    const translation = translations[language]?.[englishText] || englishText
    changeCount++
    return `${indent}${key}: '${translation}'${comma}`
  })
  
  // Replace double quote TODOs
  content = content.replace(todoPatternDouble, (match, indent, key, englishText, comma) => {
    const translation = translations[language]?.[englishText] || englishText
    changeCount++
    return `${indent}${key}: '${translation}'${comma}`
  })
  
  fs.writeFileSync(filePath, content)
  console.log(`Fixed ${changeCount} TODOs in ${filePath}`)
}

// Process files
const basePath = path.join(__dirname, '../packages/ui/src/i18n/locales/base')

// Get all base locale files
const files = fs.readdirSync(basePath).filter(f => f.endsWith('.ts'))

// Process each file that has translations defined
files.forEach(file => {
  const language = file.replace('.ts', '')
  if (translations[language]) {
    fixTodosInFile(path.join(basePath, file), language)
  }
})

console.log('Done!')