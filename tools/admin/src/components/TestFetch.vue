<template>
  <div>
    <h1>Test Fetch</h1>
    <button @click="testDirectFetch">Test Direct Fetch</button>
    <button @click="testSupabaseImport">Test Supabase Import</button>
    <pre>{{ log }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const log = ref('')

const addLog = (msg: string) => {
  console.log(msg)
  log.value += msg + '\n'
}

const testDirectFetch = async () => {
  log.value = ''
  try {
    addLog('Testing direct fetch...')
    const response = await fetch('https://httpbin.org/get')
    addLog(`Response status: ${response.status}`)
    const data = await response.json()
    addLog(`Data: ${JSON.stringify(data, null, 2)}`)
  } catch (error) {
    addLog(`Error: ${error}`)
  }
}

const testSupabaseImport = async () => {
  log.value = ''
  try {
    addLog('Importing Supabase...')
    const supabaseModule = await import('@supabase/supabase-js')
    addLog(`Module imported: ${Object.keys(supabaseModule).join(', ')}`)
    
    addLog('Creating client...')
    const client = supabaseModule.createClient(
      'https://kejvhvszhevfwgsztedf.supabase.co',
      import.meta.env.VITE_SUPABASE_ANON_KEY || 'test-key'
    )
    addLog(`Client created: ${!!client}`)
    addLog(`Client auth: ${!!client.auth}`)
    
    addLog('Testing getSession...')
    const start = Date.now()
    const { data, error } = await client.auth.getSession()
    const duration = Date.now() - start
    addLog(`getSession completed in ${duration}ms`)
    addLog(`Session: ${!!data?.session}, Error: ${error?.message || 'none'}`)
  } catch (error) {
    addLog(`Error: ${error}`)
  }
}
</script>