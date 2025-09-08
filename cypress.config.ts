import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'g6xpuz',
  e2e: {
    baseUrl: 'http://localhost:3001',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      // We'll use Mailosaur for testing emails
      MAILOSAUR_API_KEY: process.env.VITE_MAILOSAUR_API_KEY || '',
      MAILOSAUR_SERVER_ID: process.env.VITE_MAILOSAUR_SERVER_ID || '',
      VITE_MAILOSAUR_API_KEY: process.env.VITE_MAILOSAUR_API_KEY || '',
      VITE_MAILOSAUR_SERVER_ID: process.env.VITE_MAILOSAUR_SERVER_ID || '',
      // Or we can use a test email service
      TEST_EMAIL_DOMAIN: '@mailosaur.net',
    },
    setupNodeEvents(on, config) {
      // Add email testing tasks
      on('task', {
        async getLastEmail(emailAddress: string) {
          // This will be implemented with Mailosaur or similar service
          return null
        },
        log(message: string) {
          console.log(message)
          return null
        },
      })
      return config
    },
  },
})
