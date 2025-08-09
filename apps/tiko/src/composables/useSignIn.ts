import { authService } from '@tiko/core'
import type { TikoApp } from '../types/signin.types'

export function useSignIn() {

  const getAppInfo = async (appId: string): Promise<TikoApp | null> => {
    // In a real implementation, this would fetch from a database
    // For now, we'll use a hardcoded map
    const apps: Record<string, TikoApp> = {
      tiko: {
        id: 'tiko',
        name: 'Tiko',
        icon: '/icon.png',
        webUrl: 'https://app.tiko.mt',
        mobileScheme: 'tiko://'
      },
      timer: {
        id: 'timer',
        name: 'Timer',
        icon: '/apps/timer/icon.png',
        webUrl: 'https://timer.tiko.mt',
        mobileScheme: 'tiko-timer://'
      },
      radio: {
        id: 'radio',
        name: 'Radio',
        icon: '/apps/radio/icon.png',
        webUrl: 'https://radio.tiko.mt',
        mobileScheme: 'tiko-radio://'
      },
      todo: {
        id: 'todo',
        name: 'Todo',
        icon: '/apps/todo/icon.png',
        webUrl: 'https://todo.tiko.mt',
        mobileScheme: 'tiko-todo://'
      },
      cards: {
        id: 'cards',
        name: 'Cards',
        icon: '/apps/cards/icon.png',
        webUrl: 'https://cards.tiko.mt',
        mobileScheme: 'tiko-cards://'
      },
      yesno: {
        id: 'yesno',
        name: 'Yes/No',
        icon: '/apps/yesno/icon.png',
        webUrl: 'https://yesno.tiko.mt',
        mobileScheme: 'tiko-yesno://'
      },
      type: {
        id: 'type',
        name: 'Type',
        icon: '/apps/type/icon.png',
        webUrl: 'https://type.tiko.mt',
        mobileScheme: 'tiko-type://'
      }
    }

    return apps[appId] || null
  }

  const initiateSignIn = async (provider: 'apple' | 'email', returnTo: string) => {
    // Store return URL in localStorage as backup
    localStorage.setItem('signin_return_to', returnTo)


    if (provider === 'apple') {
      // TODO: Implement OAuth in authService
      throw new Error('Apple Sign-In not yet implemented in auth service')
    } else if (provider === 'email') {
      // For email sign in, we'd typically show a form
      // For now, let's redirect to a magic link flow
      const email = prompt('Enter your email address:')

      if (!email) {
        throw new Error('Email is required')
      }

      const result = await authService.signInWithMagicLink(email)

      if (!result.success) {
        throw new Error(result.error || 'Failed to send magic link')
      }

      // Show success message
    }
  }

  return {
    getAppInfo,
    initiateSignIn
  }
}
