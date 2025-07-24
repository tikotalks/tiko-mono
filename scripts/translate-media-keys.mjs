#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_LOCALES_DIR = path.join(__dirname, '../packages/ui/src/i18n/locales/base')

// English translations for media keys
const mediaTranslations = {
  details: 'Details',
  filename: 'Filename',
  notFound: 'Media not found',
  backToLibrary: 'Back to Library',
  size: 'Size',
  type: 'Type',
  uploaded: 'Uploaded',
  editDetails: 'Edit Details',
  title: 'Title',
  titlePlaceholder: 'Enter a title for this image',
  description: 'Description',
  descriptionPlaceholder: 'Enter a description',
  tags: 'Tags',
  tagsPlaceholder: 'Enter tags separated by commas',
  tagsHelp: 'Separate tags with commas',
  categories: 'Categories',
  categoriesPlaceholder: 'Enter categories separated by commas',
  categoriesHelp: 'Separate categories with commas',
  edit: 'Edit',
  save: 'Save',
  cancel: 'Cancel',
  saveSuccess: 'Changes saved successfully',
  saveError: 'Failed to save changes',
  loadError: 'Failed to load media',
  replaceImage: 'Replace Image',
  replaceDescription: 'Upload a new image to replace the current one',
  selectNewImage: 'Select New Image',
  replaceSuccess: 'Image replaced successfully',
  replaceError: 'Failed to replace image',
  imageUrls: 'Image URLs',
  originalUrl: 'Original',
  largeUrl: 'Large',
  mediumUrl: 'Medium',
  thumbnailUrl: 'Thumbnail',
  urlCopied: 'URL copied to clipboard',
  dangerZone: 'Danger Zone',
  deleteWarning: 'This action cannot be undone. The image will be permanently deleted.',
  deleteImage: 'Delete Image',
  confirmDeleteTitle: 'Confirm Delete',
  confirmDeleteMessage: 'Are you sure you want to delete this image?',
  delete: 'Delete',
  deleteSuccess: 'Image deleted successfully',
  deleteError: 'Failed to delete image'
}

async function updateLanguageFile(language, translations) {
  const filePath = path.join(BASE_LOCALES_DIR, `${language}.ts`)
  
  try {
    let content = await fs.readFile(filePath, 'utf8')
    
    // Find the media section
    const mediaRegex = /(media:\s*\{[^}]*)\}/s
    const match = content.match(mediaRegex)
    
    if (!match) {
      console.error(`❌ Media section not found in ${language}.ts`)
      return false
    }
    
    // Build the new media section with translations
    let mediaSection = '    media: {\n'
    for (const [key, value] of Object.entries(translations)) {
      const translatedValue = language === 'en-GB' ? value : 'TODO: Translate'
      mediaSection += `      ${key}: '${translatedValue}',\n`
    }
    mediaSection += '    },'
    
    // Replace the media section
    content = content.replace(mediaRegex, mediaSection)
    
    await fs.writeFile(filePath, content, 'utf8')
    console.log(`✅ Updated media translations in ${language}.ts`)
    return true
    
  } catch (error) {
    console.error(`❌ Error updating ${language}.ts:`, error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Adding media translations to all language files...')
  
  try {
    const files = await fs.readdir(BASE_LOCALES_DIR)
    const languages = files
      .filter(file => file.endsWith('.ts'))
      .map(file => file.replace('.ts', ''))
      .sort()
    
    let successCount = 0
    for (const language of languages) {
      const success = await updateLanguageFile(language, mediaTranslations)
      if (success) {
        successCount++
      }
    }
    
    console.log(`\n✅ Successfully updated ${successCount}/${languages.length} language files`)
    console.log('💡 Run "pnpm check:i18n" to validate the translations')
    
  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

main()