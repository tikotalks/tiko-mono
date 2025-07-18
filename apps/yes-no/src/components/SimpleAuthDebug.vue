<template>
  <div class="simple-auth">
    <h2>Debug Auth Flow</h2>
    
    <div class="section">
      <h3>Send Magic Link</h3>
      <input 
        v-model="email" 
        type="email" 
        placeholder="Enter your email"
        @keyup.enter="sendMagicLink"
      />
      <button @click="sendMagicLink" :disabled="isLoading || !email">
        {{ isLoading ? 'Sending...' : 'Send Magic Link' }}
      </button>
    </div>
    
    <div class="section" v-if="debugInfo">
      <h3>Response:</h3>
      <pre>{{ debugInfo }}</pre>
    </div>
    
    <div class="section">
      <h3>Manual Token Entry</h3>
      <p>If you received a code via email, paste it here:</p>
      <input 
        v-model="manualToken" 
        placeholder="Paste token/code"
      />
      <button @click="verifyManualToken" :disabled="!manualToken || !email">
        Verify Token
      </button>
    </div>
    
    <div class="section" v-if="verifyDebug">
      <h3>Verification Response:</h3>
      <pre>{{ verifyDebug }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const isLoading = ref(false)
const debugInfo = ref('')
const manualToken = ref('')
const verifyDebug = ref('')

const SUPABASE_URL = 'https://kejvhvszhevfwgsztedf.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'

const sendMagicLink = async () => {
  isLoading.value = true
  debugInfo.value = ''
  
  try {
    const timestamp = new Date().toISOString()
    debugInfo.value += `Sending at: ${timestamp}\n\n`
    
    const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY
      },
      body: JSON.stringify({
        email: email.value,
        create_user: true,
        options: {
          email_redirect_to: `${window.location.origin}/auth/callback`,
          should_create_user: true
        }
      })
    })
    
    debugInfo.value += `Response status: ${response.status}\n`
    const data = await response.json()
    debugInfo.value += `Response data: ${JSON.stringify(data, null, 2)}\n`
    
    if (response.ok) {
      // Store email and timestamp
      localStorage.setItem('tiko_pending_auth_email', email.value)
      localStorage.setItem('tiko_auth_timestamp', timestamp)
      debugInfo.value += `\nEmail stored. Check your inbox!`
    }
  } catch (err) {
    debugInfo.value += `Error: ${err}`
  } finally {
    isLoading.value = false
  }
}

const verifyManualToken = async () => {
  verifyDebug.value = ''
  
  const types = ['magiclink', 'email', 'signup', 'recovery']
  
  for (const type of types) {
    verifyDebug.value += `\nTrying type: ${type}\n`
    
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY
        },
        body: JSON.stringify({
          type: type,
          email: email.value,
          token: manualToken.value
        })
      })
      
      const data = await response.json()
      verifyDebug.value += `Response: ${response.status}\n`
      verifyDebug.value += `Data: ${JSON.stringify(data, null, 2)}\n`
      
      if (response.ok && data.access_token) {
        verifyDebug.value += `\nSUCCESS! Token is valid for type: ${type}\n`
        
        // Store session
        const session = {
          access_token: data.access_token,
          refresh_token: data.refresh_token || '',
          expires_in: data.expires_in || 3600,
          expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
          token_type: data.token_type || 'bearer',
          user: data.user
        }
        
        localStorage.setItem('tiko_auth_session', JSON.stringify(session))
        verifyDebug.value += `\nSession stored! Redirecting...`
        
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
        return
      }
    } catch (err) {
      verifyDebug.value += `Error: ${err}\n`
    }
  }
  
  verifyDebug.value += `\nAll verification types failed.`
}
</script>

<style scoped>
.simple-auth {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.section {
  background: white;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h2, h3 {
  margin-top: 0;
}

input {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #5a67d8;
}

pre {
  background: #f0f0f0;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.85em;
  max-height: 300px;
  overflow-y: auto;
}
</style>