<template>
  <div :class="bemm()">
    <slot />
     </div>
</template>


<script lang="ts" setup>
import { useBemm } from 'bemm';
const bemm = useBemm('button-group');
</script>

<style lang="scss">

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s);

  .button{
    margin: 0;
  }
}
</style>
