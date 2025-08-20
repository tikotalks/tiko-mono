<template>
  <div :class="bemm()">
    <form @submit.prevent="handleSubmit" :class="bemm('form')">
      <TInputSelect
        v-model="formData.issueType"
        :label="t('reportIssue.issueType')"
        :placeholder="t('reportIssue.selectType')"
        :options="issueTypeOptions"
        required
      />

      <TTextArea
        v-model="formData.description"
        :label="t('reportIssue.description')"
        :placeholder="t('reportIssue.descriptionPlaceholder')"
        :rows="6"
        required
      />

      <TInputText
        v-model="formData.email"
        type="email"
        :label="t('reportIssue.email')"
        :placeholder="t('reportIssue.emailPlaceholder')"
      />

      <div :class="bemm('info')">
        <p :class="bemm('info-text')">
          {{ t('reportIssue.infoText') }}
        </p>
      </div>

      <div :class="bemm('actions')">
        <TButton
          type="outline"
          color="secondary"
          @click="handleCancel"
        >
          {{ t('common.cancel') }}
        </TButton>
        <TButton
          type="submit"
          color="primary"
          :disabled="!isFormValid || isSubmitting"
          :loading="isSubmitting"
        >
          {{ t('reportIssue.submit') }}
        </TButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '../../../composables/useI18n'
import { useBuildInfo } from '../../../composables/useBuildInfo'
import { reportIssueService } from '../../../services/reportIssue.service'
import TButton from '../../ui-elements/TButton/TButton.vue'
import TInputText from '../../forms/TForm/inputs/TInputText/TInputText.vue'
import TInputSelect from '../../forms/TForm/inputs/TInputSelect/TInputSelect.vue'
import TTextArea from '../../forms/TForm/inputs/TInputTextArea/TInputTextArea.vue'

interface TReportIssueProps {
  appName: string
  userEmail?: string
  recipientEmail?: string
}

interface TReportIssueEmits {
  (e: 'submitted', data: ReportData): void
  (e: 'cancelled'): void
}

interface ReportData {
  appName: string
  issueType: string
  description: string
  email: string
  buildInfo: any
  userAgent: string
  timestamp: string
}

const props = withDefaults(defineProps<TReportIssueProps>(), {
  recipientEmail: 'support@tikotalks.com'
})

const emit = defineEmits<TReportIssueEmits>()

const bemm = useBemm('report-issue')
const { t } = useI18n()
const { buildInfo } = useBuildInfo()

// Form data
const formData = ref({
  issueType: '',
  description: '',
  email: props.userEmail || ''
})

const isSubmitting = ref(false)

// Computed
const issueTypeOptions = computed(() => [
  { value: 'bug', label: t('reportIssue.bug') },
  { value: 'feature', label: t('reportIssue.featureRequest') },
  { value: 'improvement', label: t('reportIssue.improvement') },
  { value: 'other', label: t('reportIssue.other') }
])

const isFormValid = computed(() => {
  return formData.value.issueType &&
         formData.value.description.trim().length > 10
})

// Methods
const handleSubmit = async () => {
  if (!isFormValid.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    const reportData: ReportData = {
      appName: props.appName,
      issueType: formData.value.issueType as 'bug' | 'feature' | 'improvement' | 'other',
      description: formData.value.description,
      email: formData.value.email,
      buildInfo: buildInfo.value,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }

    // Submit via service (with mailto fallback)
    const result = await reportIssueService.submitReport({
      appName: reportData.appName,
      issueType: reportData.issueType,
      description: reportData.description,
      userEmail: reportData.email,
      buildInfo: reportData.buildInfo,
      userAgent: reportData.userAgent,
      timestamp: reportData.timestamp
    })

    console.log('[TReportIssue] Report submission result:', result)

    // Emit success event
    emit('submitted', reportData)

    // Reset form
    formData.value = {
      issueType: '',
      description: '',
      email: props.userEmail || ''
    }
  } catch (error) {
    console.error('[TReportIssue] Failed to submit report:', error)
    // The service handles fallback to mailto, so we still emit success
    emit('submitted', {
      appName: props.appName,
      issueType: formData.value.issueType as any,
      description: formData.value.description,
      email: formData.value.email,
      buildInfo: buildInfo.value,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    })
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  emit('cancelled')
}
</script>

<style lang="scss">
.report-issue {
  padding: var(--space);

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__info {
    padding: var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--radius);
  }

  &__info-text {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  &__actions {
    display: flex;
    gap: var(--space);
    justify-content: flex-end;
    margin-top: var(--space);
  }
}
</style>
