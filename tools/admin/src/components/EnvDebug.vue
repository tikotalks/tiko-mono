<template>
  <div>
    <h1>Environment Debug</h1>
    <pre>{{ JSON.stringify(envInfo, null, 2) }}</pre>
  </div>
</template>

<script setup lang="ts">
const envInfo = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '[PRESENT]' : '[MISSING]',
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  BASE_URL: import.meta.env.BASE_URL,
  allKeys: Object.keys(import.meta.env)
}

console.log('Environment variables:', envInfo)
</script>