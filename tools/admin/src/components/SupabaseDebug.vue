<template>
  <div :class="bemm()">
    <h1>Supabase Debug</h1>
    <pre>{{ debugInfo }}</pre>
    <button @click="testSupabase">Test Supabase</button>
    <button @click="testDirectFetch">Test Direct Fetch</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBemm } from 'bemm'

const bemm = useBemm('supabase-debug')
const debugInfo = ref('')

const log = (message: string, data?: any) => {
  console.log(message, data)
  debugInfo.value += `${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`
}

const testSupabase = async () => {
  debugInfo.value = ''
  
  log('Environment variables:', {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '[PRESENT]' : '[MISSING]',
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV
  })
  
  try {
    log('Importing Supabase client...')
    const { supabase } = await import('@tiko/core')
    
    log('Supabase client imported:', {
      hasSupabase: !!supabase,
      hasAuth: !!supabase?.auth,
      supabaseUrl: (supabase as any)?.supabaseUrl || (supabase as any)?.restUrl || 'not found',
      methods: supabase?.auth ? Object.getOwnPropertyNames(Object.getPrototypeOf(supabase.auth)) : []
    })
    
    log('Testing getSession with timeout...')
    const getSessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout after 3s')), 3000)
    )
    
    try {
      const result = await Promise.race([getSessionPromise, timeoutPromise])
      log('getSession result:', result)
    } catch (e) {
      log('getSession error:', { message: (e as Error).message })
    }
    
  } catch (error) {
    log('Error:', { message: (error as Error).message, stack: (error as Error).stack })
  }
}

const testDirectFetch = async () => {
  debugInfo.value = ''
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kejvhvszhevfwgsztedf.supabase.co'
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  log('Testing direct fetch to Supabase...')
  log('URL:', supabaseUrl)
  log('Has key:', !!anonKey)
  
  try {
    log('Fetching /auth/v1/settings...')
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    })
    
    log('Response status:', response.status)
    const data = await response.json()
    log('Response data:', data)
    
  } catch (error) {
    log('Fetch error:', { message: (error as Error).message })
  }
  
  try {
    log('\nTesting external fetch...')
    const testResponse = await fetch('https://httpbin.org/get')
    log('External fetch status:', testResponse.status)
  } catch (error) {
    log('External fetch error:', { message: (error as Error).message })
  }
}
</script>

<style lang="scss" scoped>
.supabase-debug {
  padding: var(--space);
  
  pre {
    background: var(--color-background);
    border: 1px solid var(--color-foreground);
    padding: var(--space);
    white-space: pre-wrap;
    word-wrap: break-word;
    max-height: 400px;
    overflow-y: auto;
  }
  
  button {
    margin: var(--space-s);
    padding: var(--space-s) var(--space);
    background: var(--color-primary);
    color: var(--color-primary-text);
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    
    &:hover {
      opacity: 0.8;
    }
  }
}
</style>