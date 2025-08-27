<template>
  <div class="test-rich-text-direct">
    <AdminPageHeader
      title="Direct Rich Text Editor Test"
      description="Testing TRichTextEditor import directly"
    />
    
    <div v-if="isLoading">Loading...</div>
    
    <div v-else-if="error">Error: {{ error }}</div>
    
    <div v-else>
      <p>Component loaded: {{ componentLoaded }}</p>
      <p>Component type: {{ componentType }}</p>
      
      <TRichTextEditor
        v-if="componentLoaded"
        v-model="content"
        label="Direct Rich Text Test"
        placeholder="Type here..."
        height="300px"
      />
      
      <pre style="margin-top: 20px; padding: 10px; background: #f5f5f5;">{{ content }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { TRichTextEditor } from '@tiko/ui'
import AdminPageHeader from '@/components/AdminPageHeader.vue'

const isLoading = ref(true)
const error = ref('')
const componentLoaded = ref(false)
const componentType = ref('')
const content = ref('<p>Initial content</p>')

onMounted(() => {
  try {
    console.log('TRichTextEditor import:', TRichTextEditor)
    componentLoaded.value = !!TRichTextEditor
    componentType.value = typeof TRichTextEditor
    
    if (!TRichTextEditor) {
      error.value = 'TRichTextEditor is not imported properly'
    }
  } catch (e) {
    error.value = e?.toString() || 'Unknown error'
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.test-rich-text-direct {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}
</style>