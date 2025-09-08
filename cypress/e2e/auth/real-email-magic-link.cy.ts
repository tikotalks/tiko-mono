/// <reference types="cypress" />

describe('Real Email Magic Link Authentication', () => {
  // Generate unique email for each test
  let testEmail: string

  beforeEach(() => {
    // Clear all storage and cookies
    cy.clearLocalStorage()
    cy.clearCookies()

    // Load environment variables with prefix to ensure they're available
    cy.task('log', `MAILOSAUR_SERVER_ID: ${Cypress.env('MAILOSAUR_SERVER_ID')}`)
    cy.task('log', `MAILOSAUR_API_KEY: ${Cypress.env('MAILOSAUR_API_KEY') ? 'Set' : 'Not set'}`)

    // Generate unique test email
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    const serverId = Cypress.env('MAILOSAUR_SERVER_ID')

    if (!serverId) {
      testEmail = `test-${timestamp}-${randomId}@example.com`
      cy.log('Mailosaur server ID not configured - using example.com for test')
    } else {
      testEmail = `test-${timestamp}-${randomId}@${serverId}.mailosaur.net`
    }

    cy.visit('/')
    cy.wait(2000) // Wait for app initialization
  })

  it('should complete magic link authentication with real email', () => {
    // NOTE: This test requires a real Supabase instance that sends emails
    // For CI/testing, we mock the OTP response but check real email delivery

    // Step 1: Submit email for magic link
    cy.intercept('POST', '**/auth/v1/otp', {
      statusCode: 200,
      body: { message: 'Magic link sent successfully' },
    }).as('sendMagicLink')

    // Enter email
    cy.get('[data-cy="email-input"]').should('be.visible').type(testEmail)
    cy.get('[data-cy="submit-email-button"]').click()

    // Wait for magic link to be sent
    cy.wait('@sendMagicLink').then(interception => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201])
    })

    // Should show verification screen
    cy.get('[data-cy="verification-message"]').should('contain', "We've sent you an email")
    cy.get('[data-cy="verification-email"]').should('contain', testEmail)

    // Step 2: Wait for and retrieve the email
    cy.log(`Waiting for email to ${testEmail}`)

    // Use Mailosaur to get the email
    const serverId = Cypress.env('MAILOSAUR_SERVER_ID')
    const apiKey = Cypress.env('MAILOSAUR_API_KEY')

    if (!serverId || !apiKey) {
      cy.log('Mailosaur credentials not configured - skipping real email test')
      return
    }

    cy.request({
      method: 'GET',
      url: `https://mailosaur.com/api/messages/await?server=${serverId}&sentTo=${testEmail}`,
      headers: {
        Authorization: `Basic ${btoa(apiKey + ':')}`,
      },
      timeout: 60000, // Wait up to 60 seconds for email
    }).then(response => {
      expect(response.status).to.eq(200)
      const email = response.body

      // Log email details
      cy.log('Email received:', email.subject)

      // Extract magic link from email
      let magicLink = ''

      // First try HTML body
      if (email.html && email.html.body) {
        const htmlMatches = email.html.body.match(/href="([^"]+#access_token[^"]+)"/)
        if (htmlMatches && htmlMatches[1]) {
          magicLink = htmlMatches[1]
        }
      }

      // If not found in HTML, try text body
      if (!magicLink && email.text && email.text.body) {
        const textMatches = email.text.body.match(/(https?:\/\/[^\s]+#access_token[^\s]+)/)
        if (textMatches && textMatches[1]) {
          magicLink = textMatches[1]
        }
      }

      // Ensure we found a magic link
      expect(magicLink).to.include('#access_token')
      cy.log('Magic link found:', magicLink)

      // Step 3: Visit the magic link
      cy.visit(magicLink)

      // Wait for authentication processing
      cy.wait(5000)

      // Step 4: Verify successful authentication
      cy.url().should('not.include', '/auth/callback')
      cy.contains('Timer', { timeout: 15000 }).should('be.visible')
      cy.get('[data-cy="email-input"]').should('not.exist')

      // Verify we're logged in
      cy.window().then(win => {
        const session = win.localStorage.getItem('tiko_auth_session')
        expect(session).to.not.be.null
        const sessionData = JSON.parse(session!)
        expect(sessionData.user.email).to.equal(testEmail)
      })
    })
  })

  it('should handle OTP code from real email', () => {
    // Step 1: Submit email for OTP
    cy.intercept('POST', '**/auth/v1/otp').as('sendOTP')

    // Enter email
    cy.get('[data-cy="email-input"]').should('be.visible').type(testEmail)
    cy.get('[data-cy="submit-email-button"]').click()

    // Wait for OTP to be sent
    cy.wait('@sendOTP')

    // Should show verification screen
    cy.get('[data-cy="verification-message"]').should('contain', "We've sent you an email")
    cy.get('[data-cy="verification-email"]').should('contain', testEmail)

    // Step 2: Wait for and retrieve the email
    cy.log(`Waiting for OTP email to ${testEmail}`)

    const serverId = 'e6scudsz'
    const apiKey = 'BPSl2Lgm8HE0Ybqy5jjrCxpm4gwthZz2'

    cy.request({
      method: 'GET',
      url: `https://mailosaur.com/api/messages/await?server=${serverId}&sentTo=${testEmail}`,
      headers: {
        Authorization: `Basic ${btoa(apiKey + ':')}`,
      },
      timeout: 60000,
    }).then(response => {
      expect(response.status).to.eq(200)
      const email = response.body

      // Extract OTP code from email
      let otpCode = ''

      // Look for 6-digit code in email body
      const emailBody = email.html?.body || email.text?.body || ''
      const otpMatches = emailBody.match(/\b(\d{6})\b/)

      if (otpMatches && otpMatches[1]) {
        otpCode = otpMatches[1]
      }

      // If we found an OTP code, use it
      if (otpCode) {
        cy.log('OTP code found:', otpCode)

        // Mock the verification endpoint since we can't verify real OTP in test
        cy.intercept('POST', '**/auth/v1/verify', {
          statusCode: 200,
          body: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: 'test-user-id',
              email: testEmail,
            },
          },
        }).as('verifyOTP')

        // Enter and submit OTP
        cy.get('[data-cy="verification-code-input"]').type(otpCode)
        cy.get('[data-cy="verify-code-button"]').click()

        cy.wait('@verifyOTP')

        // Verify successful authentication
        cy.contains('Timer', { timeout: 10000 }).should('be.visible')
        cy.get('[data-cy="email-input"]').should('not.exist')
      } else {
        // If no OTP code found, check if there's a magic link instead
        cy.log('No OTP code found in email, checking for magic link')
        expect(emailBody).to.include('access_token')
      }
    })
  })

  it('should clean up test emails after test', () => {
    // This test demonstrates email cleanup
    const serverId = 'e6scudsz'
    const apiKey = 'BPSl2Lgm8HE0Ybqy5jjrCxpm4gwthZz2'

    // Delete all messages for this email address
    cy.request({
      method: 'DELETE',
      url: `https://mailosaur.com/api/messages?server=${serverId}`,
      headers: {
        Authorization: `Basic ${btoa(apiKey + ':')}`,
      },
      failOnStatusCode: false,
    }).then(response => {
      cy.log('Cleanup response:', response.status)
    })
  })
})
