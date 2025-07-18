<template>
  <div>
    <h1>Minimal Supabase Test</h1>
    <button @click="test1">Test 1: Import from @tiko/core</button>
    <button @click="test2">Test 2: Create new client</button>
    <button @click="test3">Test 3: Direct HTTP call</button>
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

const test1 = async () => {
  log.value = ''
  addLog('Test 1: Importing from @tiko/core...')
  
  try {
    const { supabase } = await import('@tiko/core')
    addLog('Imported successfully')
    
    addLog('Calling getSession with 3s timeout...')
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 3000)
    )
    
    const sessionPromise = supabase.auth.getSession()
    const result = await Promise.race([sessionPromise, timeoutPromise])
    
    addLog(`Result: ${JSON.stringify(result)}`)
  } catch (e) {
    addLog(`Error: ${e}`)
  }
}

const test2 = async () => {
  log.value = ''
  addLog('Test 2: Creating new client...')
  
  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    const client = createClient(
      'https://kejvhvszhevfwgsztedf.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'
    )
    
    addLog('Client created')
    
    addLog('Calling getSession with 3s timeout...')
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 3000)
    )
    
    const sessionPromise = client.auth.getSession()
    const result = await Promise.race([sessionPromise, timeoutPromise])
    
    addLog(`Result: ${JSON.stringify(result)}`)
  } catch (e) {
    addLog(`Error: ${e}`)
  }
}

const test3 = async () => {
  log.value = ''
  addLog('Test 3: Direct HTTP call...')
  
  try {
    const response = await fetch('https://kejvhvszhevfwgsztedf.supabase.co/auth/v1/settings', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'
      }
    })
    
    addLog(`Response: ${response.status} ${response.statusText}`)
    const data = await response.json()
    addLog(`Data: ${JSON.stringify(data, null, 2)}`)
  } catch (e) {
    addLog(`Error: ${e}`)
  }
}
</script>

<style scoped>
button {
  display: block;
  margin: 10px;
  padding: 10px;
}
pre {
  background: #f0f0f0;
  padding: 10px;
  white-space: pre-wrap;
}
</style>