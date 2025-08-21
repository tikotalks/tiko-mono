<template>
  <div :class="bemm()">
    <h3>Content Debug Panel</h3>
    
    <div :class="bemm('section')">
      <h4>Test Query Results</h4>
      <button @click="testNullQuery">Test NULL Query</button>
      <button @click="testDirectApi">Test Direct API</button>
      <button @click="clearCache">Clear Cache & Reload</button>
    </div>

    <pre :class="bemm('output')">{{ debugOutput }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBemm } from 'bemm'
import { contentService, useContent } from '@tiko/core'

const bemm = useBemm('content-debug')
const debugOutput = ref<any>({})
const content = useContent({ 
  projectSlug: 'marketing',
  useWorker: import.meta.env.VITE_USE_CONTENT_WORKER === 'true',
  workerUrl: import.meta.env.VITE_CONTENT_API_URL,
  deployedVersionId: import.meta.env.VITE_DEPLOYED_VERSION_ID
})

async function testNullQuery() {
  try {
    debugOutput.value = { status: 'Testing NULL query...' }
    
    // Test the exact query for Intro section
    const introSectionId = '2be87ea5-20b6-4d35-a4ac-90b2724db534'
    
    // Test with null language code (global sections)
    const result = await contentService.getSectionData(introSectionId, null)
    
    debugOutput.value = {
      test: 'getSectionData with null language',
      sectionId: introSectionId,
      result,
      resultKeys: Object.keys(result),
      isEmpty: Object.keys(result).length === 0
    }
  } catch (error) {
    debugOutput.value = {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }
  }
}

async function testDirectApi() {
  try {
    debugOutput.value = { status: 'Testing direct API...' }
    
    // Make a direct API call to test
    const baseUrl = import.meta.env.VITE_SUPABASE_URL + '/rest/v1'
    const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    const response = await fetch(
      `${baseUrl}/content_section_data?section_id=eq.2be87ea5-20b6-4d35-a4ac-90b2724db534&language_code=is.null`,
      {
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      }
    )
    
    const data = await response.json()
    
    debugOutput.value = {
      test: 'Direct API call',
      url: response.url,
      status: response.status,
      dataLength: data.length,
      data
    }
  } catch (error) {
    debugOutput.value = {
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function clearCache() {
  content.clearCache()
  window.location.reload()
}
</script>

<style lang="scss">
.content-debug {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: var(--color-background);
  border: 2px solid var(--color-primary);
  padding: var(--space);
  max-width: 600px;
  max-height: 400px;
  overflow: auto;
  z-index: 9999;
  
  &__section {
    margin-bottom: var(--space);
    
    button {
      margin-right: var(--space-s);
      padding: var(--space-xs) var(--space-s);
      background: var(--color-primary);
      color: var(--color-primary-text);
      border: none;
      cursor: pointer;
      
      &:hover {
        opacity: 0.8;
      }
    }
  }
  
  &__output {
    background: #000;
    color: #0f0;
    padding: var(--space-s);
    font-family: monospace;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 300px;
    overflow: auto;
  }
}
</style>