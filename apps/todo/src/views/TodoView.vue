<template>
  <TAuthWrapper :title="currentTodo?.name || t('todo.appTitle')">
    <TAppLayout
      :title="currentTodo?.name || t('todo.appTitle')"
      :show-header="true"
      :show-back-button="true"
      @back="router.push('/')"
    >
      <template #header-actions>
        <TButton
          :icon="todoStore.viewMode === 'horizontal' ? 'table-rows' : 'table-columns'"
          :tooltip="t('common.actions.toggleView')"
          variant="ghost"
          size="small"
          @click="todoStore.toggleViewMode"
        />
      </template>

      <div :class="bemm('', ['', todoStore.viewMode])">
        <div v-if="currentTodo?.steps?.length" :class="bemm('container')" ref="containerRef">
          <div
            v-for="(step, index) in currentTodo.steps"
            :key="step.id"
            :class="
              bemm('step', {
                done: step.status === 'done',
                todo: step.status === 'todo',
                active: activeStepIndex === index,
              })
            "
            @click="handleStepClick(step, index)"
          >
            <div :class="bemm('step-content')">
              <TImage
                v-if="step.image"
                :src="step.image"
                :alt="step.name"
                :class="bemm('step-image')"
              />

              <div :class="bemm('step-info')">
                <h3 :class="bemm('step-name')">
                  {{ step.translations?.[step.locale || 'en']?.name || step.name }}
                </h3>

                <TButton
                  v-if="step.status === 'todo' && activeStepIndex === index"
                  :icon="'check'"
                  :text="t('todo.markDone')"
                  variant="success"
                  size="large"
                  :class="bemm('done-button')"
                  @click.stop="handleMarkDone(step)"
                />
              </div>

              <div v-if="step.status === 'done'" :class="bemm('done-badge')">
                <TIcon name="check-circle" />
              </div>
            </div>
          </div>
        </div>

        <div v-else :class="bemm('empty')">
          <TEmptyState
            :icon="'list-check'"
            :title="t('todo.noSteps')"
            :description="t('todo.addStepsDescription')"
          />
        </div>
      </div>
    </TAppLayout>
  </TAuthWrapper>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useBemm } from 'bemm'
  import { useI18n } from '@tiko/core'
  import { TAppLayout, TAuthWrapper, TButton, TImage, TIcon, TEmptyState } from '@tiko/ui'
  import { useTodoStore } from '../stores/todoStore'

  const bemm = useBemm('todo-view')
  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const todoStore = useTodoStore()

  const containerRef = ref<HTMLElement>()
  const activeStepIndex = ref(-1)

  const currentTodo = computed(() => {
    return todoStore.todos.find(todo => todo.id === route.params.id)
  })

  // Find first incomplete step index
  const firstIncompleteIndex = computed(() => {
    if (!currentTodo.value?.steps) return 0
    const index = currentTodo.value.steps.findIndex(step => step.status === 'todo')
    return index >= 0 ? index : 0
  })

  onMounted(() => {
    if (!todoStore.todos.length) {
      todoStore.loadTodos()
    }

    // Set active step to first incomplete
    activeStepIndex.value = firstIncompleteIndex.value

    // Scroll to active step after mount
    nextTick(() => {
      scrollToStep(activeStepIndex.value)
    })
  })

  // Watch for view mode changes
  watch(
    () => todoStore.viewMode,
    () => {
      nextTick(() => {
        scrollToStep(activeStepIndex.value)
      })
    }
  )

  function handleStepClick(step: any, index: number) {
    if (step.status === 'todo') {
      activeStepIndex.value = index
    }
  }

  async function handleMarkDone(step: any) {
    await todoStore.updateStepStatus(step.id, 'done')

    // Move to next incomplete step
    const nextIndex = firstIncompleteIndex.value
    activeStepIndex.value = nextIndex

    // Scroll to next step
    nextTick(() => {
      scrollToStep(nextIndex)
    })
  }

  function scrollToStep(index: number) {
    if (!containerRef.value || !currentTodo.value?.steps?.[index]) return

    const container = containerRef.value
    const steps = container.querySelectorAll(`.${bemm('step')}`)
    const targetStep = steps[index] as HTMLElement

    if (!targetStep) return

    if (todoStore.viewMode === 'horizontal') {
      const containerWidth = container.clientWidth
      const stepWidth = targetStep.clientWidth
      const stepLeft = targetStep.offsetLeft

      // Center the step horizontally
      const scrollLeft = stepLeft - containerWidth / 2 + stepWidth / 2
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      })
    } else {
      const containerHeight = container.clientHeight
      const stepHeight = targetStep.clientHeight
      const stepTop = targetStep.offsetTop

      // Center the step vertically
      const scrollTop = stepTop - containerHeight / 2 + stepHeight / 2
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      })
    }
  }
</script>

<style lang="scss">
  .todo-view {
    height: 100%;
    display: flex;
    flex-direction: column;

    &--horizontal {
      .todo-view__container {
        display: flex;
        flex-direction: row;
        gap: 2rem;
        padding: 2rem;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
      }

      .todo-view__step {
        flex: 0 0 300px;
        height: 400px;
      }
    }

    &--vertical {
      .todo-view__container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 2rem;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .todo-view__step {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
      }
    }

    &__container {
      flex: 1;
      position: relative;
    }

    &__step {
      background: var(--color-background);
      border: 2px solid var(--color-border);
      border-radius: var(--border-radius-large);
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      scroll-snap-align: center;
      position: relative;

      &--todo {
        &:hover {
          transform: scale(1.02);
          box-shadow: var(--shadow-medium);
        }
      }

      &--active {
        transform: scale(1.05);
        border-color: var(--color-primary);
        box-shadow: var(--shadow-large);
      }

      &--done {
        opacity: 0.7;
        border-color: var(--color-success);

        .todo-view__step-content {
          filter: grayscale(0.3);
        }
      }
    }

    &__step-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 1rem;
    }

    &__step-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: var(--border-radius);
    }

    &__step-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    &__step-name {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    &__done-button {
      margin-top: auto;
    }

    &__done-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      color: var(--color-success);
      font-size: 2rem;
    }

    &__empty {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
</style>
