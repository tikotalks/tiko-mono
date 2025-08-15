<template>
  <div :class="bemm()">
    <!-- Mode selector -->
    <div :class="bemm('mode-selector')">
      <TButtonGroup fluid>
        <TButton
          :type="mode === 'single' ? 'default' : 'outline'"
          @click="mode = 'single'"
          size="medium"
        >
          {{ t('cards.addCard') }}
        </TButton>
        <TButton
          :type="mode === 'bulk' ? 'default' : 'outline'"
          @click="mode = 'bulk'"
          size="medium"
        >
          {{ t('cards.bulkAddCards') }}
        </TButton>
      </TButtonGroup>
    </div>

    <!-- Content based on mode -->
    <div :class="bemm('content')">
      <CardForm
        v-if="mode === 'single'"
        :card="singleCard"
        :index="index"
        :is-new="true"
        :translations="[]"
        @save="handleSingleSave"
        @cancel="handleCancel"
      />
      
      <BulkCardCreator
        v-if="mode === 'bulk'"
        :on-create="handleBulkCreate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { useBemm } from 'bemm';
import { useI18n } from '@tiko/ui';
import { TButton, TButtonGroup } from '@tiko/ui';
import CardForm from './CardForm.vue';
import BulkCardCreator from './BulkCardCreator.vue';
import { CardTile } from './CardTile/CardTile.model';

const bemm = useBemm('add-cards-modal');
const { t } = useI18n();

// Inject popup service to close modal
const popupService = inject<any>('popupService');

const props = defineProps<{
  index?: number;
  onSave?: (card: Partial<CardTile>, index: number) => Promise<void>;
  onCreate?: (cards: Partial<CardTile>[]) => Promise<void>;
}>();

// Toggle between single and bulk mode
const mode = ref<'single' | 'bulk'>('single');

// Create empty card for single mode
const singleCard = computed(() => ({
  id: 'new-card',
  title: '',
  icon: 'circle-question' as any,
  color: 'red' as any,
  type: 'card' as any,
  image: '',
  speech: '',
  index: props.index ?? 0,
}));

// Handle single card save
const handleSingleSave = async (cardData: Partial<CardTile>, translations: any[]) => {
  if (props.onSave) {
    await props.onSave(cardData, props.index ?? 0);
  }
  popupService.close();
};

// Handle bulk create
const handleBulkCreate = async (cards: Partial<CardTile>[]) => {
  if (props.onCreate) {
    await props.onCreate(cards);
  }
  // BulkCardCreator handles its own closing
};

// Handle cancel
const handleCancel = () => {
  popupService.close();
};
</script>

<style lang="scss">
.add-cards-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space);
  
  &__mode-selector {
    padding: 0 var(--space);
    padding-top: var(--space);
  }
  
  &__content {
    flex: 1;
    overflow: auto;
  }
}
</style>