<template>
  <TFramework 
    :app-name="'marketing'" 
    :show-user="false"
    :require-auth="false"
    :theme="'light'"
  >
    <router-view />
  </TFramework>
</template>

<script setup lang="ts">
import { TFramework } from '@tiko/ui'
</script>