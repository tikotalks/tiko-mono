<template>
  <div class="test-drag-drop">
    <AdminPageHeader
      title="Drag & Drop Test"
      description="Testing the TDragList component functionality"
    />

    <TCard class="test-section">
      <h3>Test Items</h3>
      <TDragList
        :items="testItems"
        :enabled="true"
        :on-reorder="handleReorder"
      >
        <template v-slot="{ item }">
          <div class="test-item">
            <span class="test-name">{{ item.name }}</span>
            <span class="test-id">ID: {{ item.id }}</span>
          </div>
        </template>
      </TDragList>
    </TCard>

    <TCard class="log-section">
      <h3>Event Log</h3>
      <pre>{{ eventLog }}</pre>
    </TCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TCard, TDragList } from '@tiko/ui'
import AdminPageHeader from '@/components/AdminPageHeader.vue'

interface TestItem {
  id: string
  name: string
  order: number
}

const testItems = ref<TestItem[]>([
  { id: '1', name: 'First Item', order: 0 },
  { id: '2', name: 'Second Item', order: 1 },
  { id: '3', name: 'Third Item', order: 2 },
  { id: '4', name: 'Fourth Item', order: 3 },
])

const eventLog = ref<string[]>([])

function handleReorder(reorderedItems: TestItem[]) {
  eventLog.value.push(`Reorder event triggered at ${new Date().toLocaleTimeString()}`)
  eventLog.value.push(`New order: ${reorderedItems.map(item => item.name).join(', ')}`)
  
  // Update the items
  testItems.value = reorderedItems.map((item, index) => ({
    ...item,
    order: index
  }))
  
  eventLog.value.push('Items updated successfully')
}
</script>

<style lang="scss" scoped>
.test-drag-drop {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg);
}

.test-section {
  h3 {
    margin-bottom: var(--space);
  }
}

.test-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.test-name {
  font-weight: 500;
}

.test-id {
  color: var(--color-foreground-secondary);
  font-size: var(--font-size-sm);
}

.log-section {
  h3 {
    margin-bottom: var(--space);
  }
  
  pre {
    white-space: pre-wrap;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
  }
}
</style>