// ***********************************************************
// This file is processed and loaded automatically before test files.
// ***********************************************************

import './commands'

// Disable uncaught exception handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent the error from failing the test
  return false
})

// Add custom types
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login with magic link
       */
      loginWithMagicLink(email: string): Chainable<void>

      /**
       * Get the last email sent to an address
       */
      getLastEmail(email: string): Chainable<any>

      /**
       * Extract magic link from email
       */
      extractMagicLink(emailContent: string): Chainable<string>

      /**
       * Wait for email to arrive
       */
      waitForEmail(email: string, timeout?: number): Chainable<any>

      /**
       * Create a test email address
       */
      createTestEmail(): Chainable<string>
    }
  }
}
