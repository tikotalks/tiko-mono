<template>
  <div :class="bemm()">
    <h2 :class="bemm('title')">
      {{ user ? t(keys.admin.users.editUser) : t(keys.admin.users.addUser) }}
    </h2>

    <form @submit.prevent="handleSubmit" :class="bemm('form')">
      <TFormGroup>
        <TInput
          v-model="form.email"
          :label="t(keys.admin.users.email)"
          :placeholder="t(keys.admin.users.emailPlaceholder)"
          type="email"
          :disabled="!!user"
          :required="!user"
        />

        <TInput
          v-model="form.name"
          :label="t(keys.admin.users.name)"
          :placeholder="t(keys.admin.users.namePlaceholder)"
        />

        <TInput
          v-model="form.username"
          :label="t(keys.admin.users.username)"
          :placeholder="t(keys.admin.users.usernamePlaceholder)"
        />

        <TInputSelect
          v-model="form.role"
          :label="t(keys.admin.users.role)"
          :options="roleOptions"
          :placeholder="t(keys.admin.users.selectRole)"
        />

        <TInputCheckbox
          v-if="user"
          v-model="form.is_active"
          :label="t(keys.admin.users.active)"
        />

        <TInput
          v-model="form.avatar_url"
          :label="t(keys.admin.users.avatarUrl)"
          :placeholder="t(keys.admin.users.avatarUrlPlaceholder)"
          type="url"
        />
      </TFormGroup>

      <div :class="bemm('actions')">
        <TButton
          type="ghost"
          @click="handleCancel"
        >
          {{ t(keys.common.cancel) }}
        </TButton>
        <TButton
          type="default"
          color="primary"
          html-button-type="submit"
          :loading="saving"
        >
          {{ user ? t(keys.common.save) : t(keys.admin.users.create) }}
        </TButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, inject } from 'vue'
import { useBemm } from 'bemm'
import { TInput, TButton, TFormGroup, TInputSelect, TInputCheckbox } from '@tiko/ui'
import { useI18n, userService } from '@tiko/core'
import type { UserProfile, ToastService } from '@tiko/core'

interface Props {
  user?: UserProfile
  onClose?: () => void
  onSave?: (user: UserProfile) => void
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('user-edit-modal')
const { keys, t } = useI18n()
const toastService = inject<ToastService>('toastService')

const saving = ref(false)
const form = reactive({
  email: props.user?.email || '',
  name: props.user?.name || '',
  username: props.user?.username || '',
  role: props.user?.role || 'user',
  is_active: props.user?.is_active ?? true,
  avatar_url: props.user?.avatar_url || ''
})

const roleOptions = [
  { value: 'user', label: t(keys.admin.users.roleUser) },
  { value: 'moderator', label: t(keys.admin.users.roleModerator) },
  { value: 'editor', label: t(keys.admin.users.roleEditor) },
  { value: 'admin', label: t(keys.admin.users.roleAdmin) }
]

const handleSubmit = async () => {
  if (!form.email && !props.user) {
    toastService?.show({
      message: t(keys.admin.users.emailRequired),
      type: 'error'
    })
    return
  }

  saving.value = true

  try {
    if (props.user) {
      // Update existing user
      const updatedUser = await userService.updateUser(props.user.id, {
        name: form.name,
        username: form.username,
        role: form.role as UserProfile['role'],
        is_active: form.is_active,
        avatar_url: form.avatar_url
      })

      toastService?.show({
        message: t(keys.admin.users.updateSuccess, { name: updatedUser.name || updatedUser.email }),
        type: 'success'
      })

      props.onSave?.(updatedUser)
      emit('close')
    } else {
      // Create new user - TODO: Implement when backend supports it
      toastService?.show({
        message: t(keys.admin.users.createUserNotImplemented),
        type: 'warning'
      })
    }
  } catch (error) {
    toastService?.show({
      message: props.user ? t(keys.admin.users.updateError) : t(keys.admin.users.createError),
      type: 'error'
    })
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  props.onClose?.()
  emit('close')
}
</script>

<style lang="scss">
.user-edit-modal {
  min-width: 400px;
  max-width: 600px;

  &__title {
    margin-bottom: var(--space-l);
    font-size: var(--font-size-lg);
    font-weight: 600;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__label {
    font-size: var(--font-size-s);
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  &__actions {
    display: flex;
    gap: var(--space);
    justify-content: flex-end;
    margin-top: var(--space-l);
    padding-top: var(--space);
    border-top: 1px solid var(--color-border);
  }
}
</style>