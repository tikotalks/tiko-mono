import { computed, readonly, ref } from 'vue'

declare global {
  type NoInfer<T> = T
}

import { createBrowserIdentityClient, type BrowserIdentityClient, type BrowserIdentityClientOptions, type StartEmailVerificationInput, type UpdateProfileInput } from './client'
import type { SessionBundle } from './types'

export interface UseIdentityClientOptions extends BrowserIdentityClientOptions {
  client?: BrowserIdentityClient
}

export function useIdentityClient(options: UseIdentityClientOptions = {}) {
  const client = options.client || createBrowserIdentityClient(options)
  const session = ref<SessionBundle | null>(client.getStoredSession())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const user = computed(() => session.value?.user || null)
  const isAuthenticated = computed(() => Boolean(session.value?.sessionToken))

  async function getOrCreateSession() {
    return run(async () => {
      session.value = await client.getOrCreateSession()
      return session.value
    })
  }

  async function refreshSession() {
    return run(async () => {
      session.value = await client.refreshSession(session.value?.sessionToken)
      return session.value
    })
  }

  async function updateProfile(input: UpdateProfileInput) {
    return run(async () => {
      const result = await client.updateProfile(input, session.value?.sessionToken)
      if (result.session) session.value = result.session
      return result
    })
  }

  async function startEmailVerification(input: StartEmailVerificationInput) {
    return run(() => client.startEmailVerification(input, session.value?.sessionToken))
  }

  async function verifyMagicLink(token: string) {
    return run(async () => {
      session.value = await client.verifyMagicLink(token)
      return session.value
    })
  }

  async function revokeCurrentDevice() {
    return run(async () => {
      const result = await client.revokeCurrentDevice(session.value?.sessionToken)
      session.value = null
      return result
    })
  }

  async function run<T>(operation: () => Promise<T>): Promise<T> {
    isLoading.value = true
    error.value = null

    try {
      return await operation()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Identity request failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    client,
    session: readonly(session),
    user,
    isAuthenticated,
    isLoading: readonly(isLoading),
    error: readonly(error),
    getOrCreateSession,
    refreshSession,
    updateProfile,
    startEmailVerification,
    verifyMagicLink,
    revokeCurrentDevice
  }
}
