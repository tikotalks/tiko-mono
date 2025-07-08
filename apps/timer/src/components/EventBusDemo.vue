<template>
  <div :class="bemm()">
    <h3 :class="bemm('title')">EventBus Demo</h3>
    
    <div :class="bemm('buttons')">
      <TButton
        type="default"
        color="primary"
        @click="emitNotification"
        size="small"
      >
        Emit Notification
      </TButton>
      
      <TButton
        type="default"
        color="success"
        @click="emitTimerEvent"
        size="small"
      >
        Emit Timer Event
      </TButton>
      
      <TButton
        type="ghost"
        color="secondary"
        @click="clearEvents"
        size="small"
      >
        Clear Events
      </TButton>
    </div>
    
    <div :class="bemm('events')">
      <h4 :class="bemm('subtitle')">Received Events:</h4>
      <div 
        v-for="event in receivedEvents" 
        :key="event.id"
        :class="bemm('event')"
      >
        <strong>{{ event.type }}</strong>: {{ event.data }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useBemm } from 'bemm'
import { TButton, useEventBus, type TikoEvents } from '@tiko/ui'

// Define custom timer events extending TikoEvents
interface TimerEvents extends TikoEvents {
  'timer:demo': { message: string; timestamp: number }
}

const bemm = useBemm('event-bus-demo')
const eventBus = useEventBus<TimerEvents>()

const receivedEvents = ref<Array<{ id: string; type: string; data: string }>>([])

/**
 * Emit a notification event
 */
const emitNotification = () => {
  eventBus.emit('notification:show', {
    message: 'Hello from EventBus!',
    type: 'success',
    duration: 3000
  })
}

/**
 * Emit a custom timer event
 */
const emitTimerEvent = () => {
  eventBus.emit('timer:demo', {
    message: 'Timer demo event triggered',
    timestamp: Date.now()
  })
}

/**
 * Clear all received events
 */
const clearEvents = () => {
  receivedEvents.value = []
}

/**
 * Handle notification events
 */
const handleNotification = (data: { message: string; type: string; duration?: number }) => {
  receivedEvents.value.unshift({
    id: `notif-${Date.now()}`,
    type: 'notification:show',
    data: `${data.message} (${data.type})`
  })
}

/**
 * Handle timer demo events
 */
const handleTimerDemo = (data: { message: string; timestamp: number }) => {
  receivedEvents.value.unshift({
    id: `timer-${Date.now()}`,
    type: 'timer:demo',
    data: `${data.message} at ${new Date(data.timestamp).toLocaleTimeString()}`
  })
}

// Setup event listeners
onMounted(() => {
  eventBus.on('notification:show', handleNotification)
  eventBus.on('timer:demo', handleTimerDemo)
})

// Cleanup event listeners
onUnmounted(() => {
  eventBus.off('notification:show', handleNotification)
  eventBus.off('timer:demo', handleTimerDemo)
})
</script>

<style lang="scss" scoped>
/**
 * EventBusDemo component styles following Tiko design system standards
 */
.event-bus-demo {
  display: flex;
  flex-direction: column;
  gap: var(--space-md, 1em);
  padding: var(--space-md, 1em);
  background: var(--color-background);
  border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 80%);
  border-radius: var(--radius-md, 0.5em);

  &__title,
  &__subtitle {
    font-weight: 600;
    color: var(--color-foreground);
    text-align: center;
  }

  &__title {
    font-size: 1.125em;
  }

  &__subtitle {
    font-size: 1em;
  }

  &__buttons {
    display: flex;
    gap: var(--space-xs, 0.5em);
    justify-content: center;
    flex-wrap: wrap;
  }

  &__events {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 0.5em);
  }

  &__event {
    padding: var(--space-xs, 0.5em);
    background: color-mix(in srgb, var(--color-primary), transparent 90%);
    border-radius: var(--radius-sm, 0.25em);
    font-size: 0.875em;
    color: var(--color-foreground);
  }
}
</style>