<template>
  <div :class="bemm()">
    <h3>Field Values Debug for Page: {{ pageId }}</h3>
    
    <div v-if="loading">Loading...</div>
    
    <div v-else>
      <h4>Section Templates on this page:</h4>
      <ul>
        <li v-for="section in sections" :key="section.section_template_id">
          {{ section.section_template_id }} - {{ section.override_name }}
        </li>
      </ul>

      <h4>Fields for each section:</h4>
      <div v-for="(fields, templateId) in fieldsByTemplate" :key="templateId">
        <h5>Template: {{ templateId }}</h5>
        <ul>
          <li v-for="field in fields" :key="field.id">
            {{ field.field_key }} ({{ field.label }}) - ID: {{ field.id }}
          </li>
        </ul>
      </div>

      <h4>Field Values:</h4>
      <pre>{{ JSON.stringify(fieldValues, null, 2) }}</pre>

      <h4>Add Test Values:</h4>
      <TButton @click="addTestValues" color="primary">
        Add Sample Field Values
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { useBemm } from 'bemm'
import { TButton } from '@tiko/ui'
import { contentService } from '@tiko/core'
import type { ToastService } from '@tiko/core'

interface Props {
  pageId: string
  languageCode: string
}

const props = defineProps<Props>()
const bemm = useBemm('field-values-debug')
const toastService = inject<ToastService>('toastService')

const loading = ref(false)
const sections = ref<any[]>([])
const fieldsByTemplate = ref<Record<string, any[]>>({})
const fieldValues = ref<any[]>([])

async function loadData() {
  loading.value = true
  try {
    // Load page sections
    sections.value = await contentService.getPageSections(props.pageId)
    
    // Load fields for each section template
    for (const section of sections.value) {
      const fields = await contentService.getFieldsBySectionTemplate(section.section_template_id)
      fieldsByTemplate.value[section.section_template_id] = fields
    }
    
    // Load field values
    fieldValues.value = await contentService.getFieldValues(props.pageId, props.languageCode)
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

async function addTestValues() {
  try {
    const valuesToAdd = []
    
    for (const section of sections.value) {
      const fields = fieldsByTemplate.value[section.section_template_id] || []
      
      for (const field of fields) {
        let testValue = ''
        
        switch (field.field_key) {
          case 'title':
            testValue = `Test Title for ${section.override_name}`
            break
          case 'subtitle':
            testValue = `Test Subtitle for ${section.override_name}`
            break
          case 'content':
            testValue = `Test content for ${section.override_name}. This is a sample text to verify that field values are working correctly.`
            break
          default:
            testValue = `Test value for ${field.field_key}`
        }
        
        valuesToAdd.push({
          page_id: props.pageId,
          section_template_id: section.section_template_id,
          field_id: field.id,
          language_code: props.languageCode,
          value: testValue
        })
      }
    }
    
    // Add all values
    await contentService.setFieldValues(valuesToAdd)
    
    toastService?.show({
      message: `Added ${valuesToAdd.length} test field values`,
      type: 'success'
    })
    
    // Reload to see the new values
    await loadData()
  } catch (error) {
    console.error('Failed to add test values:', error)
    toastService?.show({
      message: 'Failed to add test values',
      type: 'error'
    })
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss">
.field-values-debug {
  padding: var(--space);
  background: var(--color-background-secondary);
  border-radius: var(--radius);
  
  h3, h4, h5 {
    margin: var(--space) 0 var(--space-s) 0;
  }
  
  ul {
    margin: var(--space-s) 0;
    padding-left: var(--space);
  }
  
  pre {
    background: var(--color-background);
    padding: var(--space);
    border-radius: var(--radius);
    overflow-x: auto;
    font-size: var(--font-size-sm);
  }
}
</style>