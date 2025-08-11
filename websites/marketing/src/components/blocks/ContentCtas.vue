<template>
  <div :class="bemm('')" v-if="items">
    <div :class="bemm('cta')">
      <TButton
        :color="cta.color.toLowerCase() || 'primary'"
        size="large"
        @click="handleAction(cta)"
        v-for="cta in items"
      >
        {{ cta.label }}
      </TButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';

import { useRouter } from 'vue-router';

import { TButton } from '@tiko/ui';

const router = useRouter();
defineProps<{
  items: any[]; // Define the type based on your items structure
}>();

const handleAction = (cta: {
  type?: string;
  color?: string;
  size?: string;
  text: string;
  link: string;
}) => {
  if (cta.link.startsWith('http')) {
    window.open(cta.link, '_blank');
  } else if (cta.link.startsWith('#')) {
    // Handle anchor links
    const targetElement = document.querySelector(cta.link);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  } else if (cta.link.startsWith('router:')) {
    const route = cta.link.replace('router:', '');
    router.push(route);
  } else {
    // Handle internal actions
    console.log(`Action: ${cta.link}`);
  }
};

const bemm = useBemm('content-items'); // Use bemm for styling
</script>

<style lang="scss"></style>
