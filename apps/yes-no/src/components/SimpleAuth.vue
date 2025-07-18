<template>
  <div class="simple-auth">
    <div v-if="!isAuthenticated" class="login-form">
      <h2>Login</h2>
      <form @submit.prevent="handleSubmit">
        <input 
          v-model="email" 
          type="email" 
          placeholder="Enter your email"
          required
        />
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Sending...' : 'Send Magic Link' }}
        </button>
      </form>
      <p v-if="message" :class="{ error: isError }">{{ message }}</p>
    </div>
    
    <div v-else class="welcome">
      <h2>Welcome!</h2>
      <p>{{ user?.email }}</p>
      <button @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStoreNew } from '@tiko/core'

const authStore = useAuthStoreNew()

const email = ref('')
const message = ref('')
const isError = ref(false)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isLoading = computed(() => authStore.isLoading)
const user = computed(() => authStore.user)

const handleSubmit = async () => {
  message.value = ''
  isError.value = false
  
  try {
    await authStore.sendMagicLink(email.value)
    message.value = 'Check your email for the magic link!'
    email.value = ''
  } catch (err) {
    message.value = err instanceof Error ? err.message : 'Failed to send magic link'
    isError.value = true
  }
}

const logout = () => {
  authStore.logout()
  message.value = ''
}

onMounted(async () => {
  await authStore.checkSession()
})
</script>

<style scoped>
.simple-auth {
  padding: 2rem;
  max-width: 400px;
  margin: 0 auto;
}

.login-form, .welcome {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h2 {
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

.error {
  color: red;
}
</style>