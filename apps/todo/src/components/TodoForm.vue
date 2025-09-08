<template>
  <div :class="bemm()">
    <TForm @submit.prevent="handleSubmit" :class="bemm('form')">
      <div :class="bemm('section', ['main'])">
        <h3 :class="bemm('section-title')">{{ t('common.details') }}</h3>

        <TFormGroup>
          <TFormField :label="t('common.name')" name="name" required>
            <TInputText v-model="formData.name" :placeholder="t('todo.enterTodoName')" />
          </TFormField>

          <TFormField :label="t('common.color')" name="color">
            <TColorPicker v-model="formData.color" />
          </TFormField>

          <div :class="bemm('image-field')">
            <TImageInput
              v-model="formData.image"
              :label="t('common.image')"
              :placeholder="t('common.actions.selectImage')"
            />
          </div>
        </TFormGroup>
      </div>

      <div :class="bemm('section', ['steps'])">
        <h3 :class="bemm('section-title')">
          {{ t('todo.step', { count: formData.steps.length }) }}
        </h3>

        <div :class="bemm('steps')">
          <div v-for="(step, index) in formData.steps" :key="index" :class="bemm('step')">
            <TFormGroup>
              <TFormField
                :label="`${t('todo.step', { count: 1 })} ${index + 1}`"
                :name="`step-${index}`"
                required
              >
                <TInputText v-model="step.name" :placeholder="t('todo.enterStepName')" />
              </TFormField>

              <div :class="bemm('step-image')">
                <TImageInput
                  v-model="step.image"
                  :label="t('todo.stepImage')"
                  :placeholder="t('common.actions.selectImage')"
                  :show-label="false"
                />
              </div>
            </TFormGroup>

            <TButton
              v-if="formData.steps.length > 1"
              :icon="Icons.TRASH"
              :color="Colors.ERROR"
              size="small"
              @click="removeStep(index)"
            />
          </div>

          <TButton
            :icon="Icons.ADD_M"
            :text="t('todo.addStep')"
            :type="ButtonType.DEFAULT"
            @click="addStep"
          />
        </div>
      </div>

      <TFormActions>
        <TButton :type="ButtonType.DEFAULT" @click="handleCancel">{{ t('common.cancel') }}</TButton>
        <TButton
          html-button-type="submit"
          :type="ButtonType.DEFAULT"
          :loading="loading"
          :disabled="!isValid"
          >{{ t('common.create') }}</TButton
        >
      </TFormActions>
    </TForm>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useBemm } from 'bemm'
  import { useI18n } from '@tiko/core'
  import {
    TForm,
    TFormGroup,
    TFormField,
    TFormActions,
    TInputText,
    TColorPicker,
    TImageInput,
    TButton,
    BaseColors,
    ButtonType,
    Colors,
  } from '@tiko/ui'
  import { useTodoStore } from '../stores/todoStore'
  import { Icons } from 'open-icon'

  const props = defineProps<{
    onSave?: (todo: any) => void
    onCancel?: () => void
  }>()

  const bemm = useBemm('todo-form')
  const { t } = useI18n()
  const todoStore = useTodoStore()

  const loading = ref(false)
  const formData = ref({
    name: '',
    color: BaseColors.BLUE,
    image: '',
    steps: [{ name: '', image: '' }],
  })

  const isValid = computed(() => {
    return (
      formData.value.name.trim().length > 0 &&
      formData.value.steps.some(step => step.name.trim().length > 0)
    )
  })

  function addStep() {
    formData.value.steps.push({ name: '', image: '' })
  }

  function removeStep(index: number) {
    formData.value.steps.splice(index, 1)
  }

  async function handleSubmit() {
    if (!isValid.value) return

    loading.value = true
    try {
      const todo = await todoStore.createTodo({
        name: formData.value.name,
        color: formData.value.color,
        image: formData.value.image,
        steps: formData.value.steps.filter(step => step.name.trim()),
      })

      if (props.onSave) {
        props.onSave(todo)
      }
    } catch (error) {
      console.error('Failed to create todo:', error)
    } finally {
      loading.value = false
    }
  }

  function handleCancel() {
    if (props.onCancel) {
      props.onCancel()
    }
  }
</script>

<style lang="scss">
  .todo-form {
    &__form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    &__section {
      &--main {
        // Main section styles
      }

      &--steps {
        // Steps section styles
      }
    }

    &__section-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--color-text-secondary);
    }

    &__image-field {
      margin-top: 1rem;
    }

    &__steps {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    &__step {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      padding: 1rem;
      background: var(--color-background-secondary);
      border-radius: var(--border-radius);

      > .todo-form__step-image {
        flex: 0 0 120px;
      }
    }

    &__step-image {
      margin-top: 1.5rem;
    }
  }
</style>
