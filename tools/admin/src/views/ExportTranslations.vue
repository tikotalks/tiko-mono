<template>
  <div class="export-translations">
    <div class="header">
      <h1>Export Translations</h1>
      <p>Export all translations from the database to JSON files.</p>
    </div>

    <div class="actions">
      <button @click="exportTranslations" :disabled="loading" class="primary-btn">
        {{ loading ? 'Exporting...' : 'Export All Translations' }}
      </button>
      <button v-if="exportedFiles" @click="downloadAll" class="secondary-btn">
        Download All Files{{ downloadProgress ? ` (${downloadProgress})` : '' }}
      </button>
      <button v-if="exportedFiles" @click="downloadAsZip" class="secondary-btn">
        Download as ZIP
      </button>
    </div>

    <div v-if="status" :class="['status', statusType]">
      {{ status }}
    </div>

    <!-- Exported Files List with Individual Downloads -->
    <div v-if="exportedFiles && Object.keys(exportedFiles).length > 0" class="exported-files">
      <h3>Exported Files</h3>
      <div class="file-list">
        <div v-for="(content, filename) in exportedFiles" :key="filename" class="file-item">
          <span class="file-name">{{ filename }}</span>
          <span class="file-size">{{ formatFileSize(content) }}</span>
          <button @click="downloadFile(filename, content)" class="download-btn">
            Download
          </button>
        </div>
      </div>
    </div>

    <div v-if="languages.length > 0" class="progress">
      <h3>Export Progress:</h3>
      <div v-for="lang in languages" :key="lang.code" :class="['language-item', lang.status]">
        <span class="code">{{ lang.code }}</span>
        <span class="name">{{ lang.name }}</span>
        <span class="status">{{ lang.statusText }}</span>
      </div>
    </div>

    <div v-if="statistics" class="statistics">
      <h3>Translation Statistics</h3>
      <p>Total Keys: {{ statistics.totalKeys }}</p>
      <div class="completeness">
        <div v-for="(data, locale) in statistics.completeness" :key="locale" class="locale-stat">
          <span class="locale">{{ locale }}:</span>
          <span class="percentage">{{ data.percentage }}%</span>
          <span class="count">({{ statistics.totalKeys - data.missing }}/{{ statistics.totalKeys }})</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { translationService } from '@tiko/core'

const loading = ref(false)
const status = ref('')
const statusType = ref('')
const languages = ref<any[]>([])
const exportedFiles = ref<Record<string, string> | null>(null)
const statistics = ref<any>(null)
const downloadProgress = ref('')

async function exportTranslations() {
  loading.value = true
  status.value = 'Starting export...'
  statusType.value = ''
  languages.value = []
  exportedFiles.value = null
  statistics.value = null

  try {
    // Get all active languages
    status.value = 'Fetching languages...'
    const activeLanguages = await translationService.getActiveLanguages()
    
    languages.value = activeLanguages.map(lang => ({
      code: lang.code,
      name: lang.name,
      status: 'pending',
      statusText: 'Pending...'
    }))

    status.value = `Found ${activeLanguages.length} active languages. Exporting...`
    
    const files: Record<string, string> = {}
    const results = []

    // Export each language
    for (const lang of languages.value) {
      lang.status = 'loading'
      lang.statusText = 'Exporting...'

      try {
        // Get translations
        const translations = await translationService.getTranslationsForLanguage(lang.code)
        
        // Convert to nested structure
        const nested = unflattenObject(translations)
        
        // Store for download
        const jsonContent = JSON.stringify(nested, null, 2)
        files[`${lang.code}.json`] = jsonContent
        
        const keyCount = Object.keys(translations).length
        lang.status = 'success'
        lang.statusText = `✓ ${keyCount} translations`
        
        results.push({
          language: lang.code,
          name: lang.name,
          keyCount,
          success: true
        })
      } catch (error) {
        lang.status = 'error'
        lang.statusText = `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        
        results.push({
          language: lang.code,
          name: lang.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        })
      }
    }

    // Get statistics
    status.value = 'Fetching statistics...'
    const stats = await translationService.getStatistics()
    statistics.value = stats

    // Create metadata
    const metadata = {
      exportDate: new Date().toISOString(),
      totalKeys: stats.totalKeys,
      languages: results.filter(r => r.success).map(r => ({
        code: r.language,
        name: r.name,
        keyCount: r.keyCount
      })),
      statistics: stats
    }
    
    files['metadata.json'] = JSON.stringify(metadata, null, 2)
    exportedFiles.value = files

    // Show results
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    status.value = `Export completed! Successfully exported: ${successful} languages, Failed: ${failed} languages`
    statusType.value = failed === 0 ? 'success' : 'warning'

  } catch (error) {
    status.value = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    statusType.value = 'error'
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function downloadAll() {
  if (!exportedFiles.value) return
  
  const files = Object.entries(exportedFiles.value)
  let completed = 0
  
  // Download files with a delay to avoid browser blocking
  for (const [filename, content] of files) {
    downloadFile(filename, content)
    completed++
    downloadProgress.value = `${completed}/${files.length}`
    
    // Add delay between downloads to avoid browser blocking
    if (completed < files.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  // Clear progress after a delay
  setTimeout(() => {
    downloadProgress.value = ''
  }, 2000)
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function formatFileSize(content: string): string {
  const bytes = new TextEncoder().encode(content).length
  const kb = bytes / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

async function downloadAsZip() {
  if (!exportedFiles.value) return
  
  try {
    // Dynamic import of JSZip to avoid loading it if not needed
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    // Add all files to zip
    for (const [filename, content] of Object.entries(exportedFiles.value)) {
      zip.file(filename, content)
    }
    
    // Generate zip
    const blob = await zip.generateAsync({ type: 'blob' })
    
    // Download zip
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `translations-export-${new Date().toISOString().split('T')[0]}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    status.value = 'Downloaded all files as ZIP'
    statusType.value = 'success'
  } catch (error) {
    // If JSZip is not available, fall back to sequential download
    console.warn('JSZip not available, falling back to sequential download')
    await downloadAll()
  }
}

function unflattenObject(flatObj: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(flatObj)) {
    const keys = key.split('.')
    let current = result
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      if (!(k in current)) {
        current[k] = {}
      }
      current = current[k]
    }
    
    current[keys[keys.length - 1]] = value
  }
  
  return result
}
</script>

<style scoped>
.export-translations {
  padding: 2rem;
  max-width: 1200px;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  margin-bottom: 0.5rem;
}

.actions {
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
}

.primary-btn, .secondary-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn {
  background: var(--color-primary, #007bff);
  color: white;
}

.primary-btn:hover:not(:disabled) {
  background: var(--color-primary-dark, #0056b3);
}

.primary-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.secondary-btn {
  background: #6c757d;
  color: white;
}

.secondary-btn:hover {
  background: #545b62;
}

.status {
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
  border: 1px solid;
}

.status.success {
  background: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

.status.error {
  background: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.status.warning {
  background: #fff3cd;
  border-color: #ffeeba;
  color: #856404;
}

.progress h3 {
  margin-bottom: 1rem;
}

.language-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  background: #f8f9fa;
  gap: 1rem;
}

.language-item.success {
  background: #d4edda;
}

.language-item.error {
  background: #f8d7da;
}

.language-item .code {
  font-weight: bold;
  min-width: 60px;
}

.language-item .name {
  flex: 1;
}

.language-item .status {
  font-size: 0.9rem;
}

.statistics {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.statistics h3 {
  margin-bottom: 1rem;
}

.completeness {
  margin-top: 1rem;
}

.locale-stat {
  display: flex;
  align-items: center;
  padding: 0.25rem 0;
  gap: 1rem;
}

.locale-stat .locale {
  font-weight: bold;
  min-width: 60px;
}

.locale-stat .percentage {
  min-width: 50px;
}

.locale-stat .count {
  color: #666;
  font-size: 0.9rem;
}

.exported-files {
  margin: 2rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.exported-files h3 {
  margin-bottom: 1rem;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.file-name {
  font-family: monospace;
  font-weight: bold;
  flex: 1;
}

.file-size {
  color: #666;
  font-size: 0.9rem;
  margin-right: 1rem;
}

.download-btn {
  padding: 0.25rem 1rem;
  background: var(--color-primary, #007bff);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.download-btn:hover {
  background: var(--color-primary-dark, #0056b3);
}
</style>