describe('Magic Link Authentication', () => {
  let testEmail: string

  beforeEach(() => {
    // Create a unique test email for each test
    cy.createTestEmail().then(email => {
      testEmail = email
    })
  })

  it('should complete full magic link authentication flow', () => {
    // Step 1: Visit the app
    cy.visit('/')

    // Step 2: Should see login form (not authenticated)
    cy.get('.auth-wrapper').should('exist')
    cy.get('.login-form').should('be.visible')

    // Step 3: Enter email and request magic link
    cy.get('input[type="email"]').type(testEmail)
    cy.get('button[type="submit"]')
      .contains(/send|continue/i)
      .click()

    // Step 4: Should show verification message
    cy.contains(/check your email|verification sent/i, { timeout: 10000 }).should('be.visible')

    // Step 5: Wait for and retrieve the email
    cy.waitForEmail(testEmail).then(email => {
      // Step 6: Extract magic link from email
      cy.extractMagicLink(email).then(magicLink => {
        // Step 7: Visit the magic link
        cy.visit(magicLink)

        // Step 8: Should process the magic link and authenticate
        cy.url({ timeout: 10000 }).should('not.include', '#access_token')

        // Step 9: Should be authenticated and see the main app
        cy.get('.auth-wrapper__app', { timeout: 10000 }).should('exist')
        cy.get('.login-form').should('not.exist')

        // Step 10: Verify user is logged in
        cy.window().then(win => {
          const authSession = win.localStorage.getItem('tiko_auth_session')
          expect(authSession).to.not.be.null

          if (authSession) {
            const session = JSON.parse(authSession)
            expect(session.access_token).to.exist
            expect(session.user.email).to.equal(testEmail)
          }
        })
      })
    })
  })

  it('should handle expired magic link', () => {
    // Visit an expired magic link
    const expiredLink = '/#access_token=expired&refresh_token=expired&expires_in=0'
    cy.visit(expiredLink)

    // Should redirect to login
    cy.get('.login-form', { timeout: 10000 }).should('be.visible')

    // Should not be authenticated
    cy.window().then(win => {
      const authSession = win.localStorage.getItem('tiko_auth_session')
      expect(authSession).to.be.null
    })
  })

  it('should persist authentication across page reloads', () => {
    // First, complete the login flow
    cy.visit('/')
    cy.get('input[type="email"]').type(testEmail)
    cy.get('button[type="submit"]')
      .contains(/send|continue/i)
      .click()

    cy.waitForEmail(testEmail).then(email => {
      cy.extractMagicLink(email).then(magicLink => {
        cy.visit(magicLink)

        // Wait for authentication
        cy.get('.auth-wrapper__app', { timeout: 10000 }).should('exist')

        // Reload the page
        cy.reload()

        // Should still be authenticated
        cy.get('.auth-wrapper__app').should('exist')
        cy.get('.login-form').should('not.exist')
      })
    })
  })

  it('should handle rate limiting gracefully', () => {
    cy.visit('/')

    // Try to send multiple magic links quickly
    for (let i = 0; i < 3; i++) {
      cy.get('input[type="email"]').clear().type(testEmail)
      cy.get('button[type="submit"]')
        .contains(/send|continue/i)
        .click()
      cy.wait(500)
    }

    // Should show rate limit error
    cy.contains(/too many attempts|rate limit|please wait/i, { timeout: 5000 }).should('be.visible')
  })

  it('should logout successfully', () => {
    // First login
    cy.visit('/')
    cy.get('input[type="email"]').type(testEmail)
    cy.get('button[type="submit"]')
      .contains(/send|continue/i)
      .click()

    cy.waitForEmail(testEmail).then(email => {
      cy.extractMagicLink(email).then(magicLink => {
        cy.visit(magicLink)

        // Wait for authentication
        cy.get('.auth-wrapper__app', { timeout: 10000 }).should('exist')

        // Find and click logout button
        cy.get('[data-cy=user-menu]').click()
        cy.get('[data-cy=logout-button]').click()

        // Should be logged out
        cy.get('.login-form', { timeout: 5000 }).should('be.visible')

        // Session should be cleared
        cy.window().then(win => {
          const authSession = win.localStorage.getItem('tiko_auth_session')
          expect(authSession).to.be.null
        })
      })
    })
  })
})
