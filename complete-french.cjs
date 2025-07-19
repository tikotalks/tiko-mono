#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Read the complete Armenian locale file as reference
const hyPath = path.join(__dirname, 'packages/ui/src/i18n/locales/hy.ts')
const frPath = path.join(__dirname, 'packages/ui/src/i18n/locales/fr.ts')

let hyContent = fs.readFileSync(hyPath, 'utf8')
let frContent = fs.readFileSync(frPath, 'utf8')

// Extract the translation object content from Armenian file
const hyTranslationMatch = hyContent.match(/export const hy: TranslationSchema = ({[\s\S]*})\s*$/m)
if (!hyTranslationMatch) {
  console.error('Could not parse Armenian file structure')
  process.exit(1)
}

const hyTranslations = hyTranslationMatch[1]

// Replace Armenian translations with French placeholders
let frTranslations = hyTranslations
  // Replace all Armenian text with French TODO placeholders
  .replace(/: '[^']*\[TODO: Translate to Armenian\]'/g, ": '[TODO: Translate to French]'")
  .replace(/: 'Պահպանել'/g, ": 'Enregistrer'")
  .replace(/: 'Չեղարկել'/g, ": 'Annuler'")
  .replace(/: 'Ջնջել'/g, ": 'Supprimer'")
  .replace(/: 'Խմբագրել'/g, ": 'Modifier'")
  .replace(/: 'Փակել'/g, ": 'Fermer'")
  .replace(/: 'Բեռնում\.\.\.'/g, ": 'Chargement...'")
  .replace(/: 'Սխալ'/g, ": 'Erreur'")
  .replace(/: 'Հաջողություն'/g, ": 'Succès'")
  .replace(/: 'Զգուշացում'/g, ": 'Avertissement'")
  .replace(/: 'Հաստատել'/g, ": 'Confirmer'")
  .replace(/: 'Այո'/g, ": 'Oui'")
  .replace(/: 'Ոչ'/g, ": 'Non'")
  .replace(/: 'Կարգավորումներ'/g, ": 'Paramètres'")
  .replace(/: 'Հետ'/g, ": 'Retour'")
  .replace(/: 'Տուն'/g, ": 'Accueil'")
  .replace(/: 'Պատրաստ'/g, ": 'Terminé'")
  .replace(/: 'Ավելացնել'/g, ": 'Ajouter'")
  .replace(/: 'Հեռացնել'/g, ": 'Supprimer'")
  .replace(/: 'Վերակարգավորել'/g, ": 'Réinitialiser'")
  .replace(/: 'Կիրառել'/g, ": 'Appliquer'")
  .replace(/: 'Փնտրել'/g, ": 'Rechercher'")
  .replace(/: 'Զտել'/g, ": 'Filtrer'")
  .replace(/: 'Տեսակավորել'/g, ": 'Trier'")
  .replace(/: 'Թարմացնել'/g, ": 'Actualiser'")
  .replace(/: 'Վերբեռնել'/g, ": 'Télécharger'")
  .replace(/: 'Ներբեռնել'/g, ": 'Télécharger'")
  .replace(/: 'Կիսվել'/g, ": 'Partager'")
  .replace(/: 'Պատճենել'/g, ": 'Copier'")
  .replace(/: 'Տեղադրել'/g, ": 'Coller'")
  .replace(/: 'Կրկնել'/g, ": 'Rétablir'")
  .replace(/: 'Բարի գալուստ \{name\}!'/g, ": 'Bienvenue {name}!'")
  .replace(/: '\{count\} տարր ընտրված'/g, ": '{count} éléments sélectionnés'")
  .replace(/: 'Միացված'/g, ": 'Activé'")
  .replace(/: 'Անջատված'/g, ": 'Désactivé'")
  .replace(/: 'Շուտով'/g, ": 'Bientôt disponible'")
  // Add more common translations...
  .replace(/: '[^']*'/g, function(match) {
    // If it's already a TODO marker, keep it
    if (match.includes('[TODO: Translate to')) return match
    // If it's an Armenian string, replace with French TODO
    if (/[\u0531-\u0556\u0561-\u0587]/.test(match)) {
      return ": '[TODO: Translate to French]'"
    }
    return match
  })

// Create the new French file content
const newFrContent = `import type { TranslationSchema } from '../types'

// French translations
export const fr: TranslationSchema = ${frTranslations}
`

// Write the updated French file
fs.writeFileSync(frPath, newFrContent, 'utf8')
console.log('French locale file updated with all missing keys')