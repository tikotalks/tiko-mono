/// <reference types="cypress" />

describe('Fixed Authentication Flow Tests', () => {
  beforeEach(() => {
    // Clear all storage and cookies
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.visit('/')
    cy.wait(2000) // Wait for app initialization
  })

  describe('OTP Authentication Flow', () => {
    it('should complete full OTP authentication journey', () => {
      // Step 1: Submit email for OTP
      cy.intercept('POST', '**/auth/v1/otp', {
        statusCode: 200,
        body: { message: 'OTP sent successfully' },
      }).as('sendOTP')

      // Enter email
      cy.get('input[type="email"]').should('be.visible').type('test@example.com')
      cy.contains('button', 'Send Code').click()

      // Wait for OTP request
      cy.wait('@sendOTP')

      // Step 2: Verify we're on verification screen
      cy.contains("We've sent you an email").should('be.visible')
      cy.contains('test@example.com').should('be.visible')

      // Step 3: Enter and submit OTP code
      cy.intercept('POST', '**/auth/v1/verify', {
        statusCode: 200,
        body: {
          access_token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzAzMDAwMDAwLCJleHAiOjE5MDMwMDAwMDB9.abc123',
          refresh_token: 'refresh_token_abc123',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: {
              full_name: 'Test User',
            },
          },
        },
      }).as('verifyOTP')

      // Enter OTP code
      cy.get('input[placeholder*="6-digit"]').type('123456')
      cy.contains('button', 'Verify Code').click()

      // Wait for verification
      cy.wait('@verifyOTP')

      // Step 4: Verify successful authentication
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')
      cy.get('input[type="email"]').should('not.exist')
    })

    it('should handle invalid OTP code gracefully', () => {
      // Setup email submission first
      cy.intercept('POST', '**/auth/v1/otp', { statusCode: 200 }).as('sendOTP')
      cy.get('input[type="email"]').type('test@example.com')
      cy.contains('button', 'Send Code').click()
      cy.wait('@sendOTP')

      // Mock error response for invalid OTP
      cy.intercept('POST', '**/auth/v1/verify', {
        statusCode: 400,
        body: {
          error: 'invalid_grant',
          error_description: 'Invalid verification code',
        },
      }).as('verifyError')

      // Enter wrong code
      cy.get('input[placeholder*="6-digit"]').type('999999')
      cy.contains('button', 'Verify Code').click()
      cy.wait('@verifyError')

      // Should show error and stay on verification screen
      cy.contains('Invalid verification code').should('be.visible')
      cy.get('input[placeholder*="6-digit"]').should('be.visible')
    })

    it('should handle resend OTP functionality', () => {
      // Setup initial OTP request
      cy.intercept('POST', '**/auth/v1/otp', { statusCode: 200 }).as('sendOTP')
      cy.get('input[type="email"]').type('test@example.com')
      cy.contains('button', 'Send Code').click()
      cy.wait('@sendOTP')

      // Check resend button has cooldown
      cy.contains('button', /Resend in \d+s/)
        .should('be.visible')
        .should('be.disabled')

      // Go back to email - using correct text
      cy.contains('button', 'Use different email').should('be.visible').click()
      cy.contains('Login to your account').should('be.visible')
    })
  })

  describe('Magic Link Authentication', () => {
    it('should authenticate user via magic link in URL hash', () => {
      // Create valid JWT token
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzAzMDAwMDAwLCJleHAiOjE5MDMwMDAwMDB9.abc123'

      // Visit with magic link parameters
      cy.visit(
        `/#access_token=${mockToken}&refresh_token=refresh_abc123&expires_in=3600&token_type=bearer`
      )

      // Wait for auth processing
      cy.wait(3000)

      // Should show authenticated content
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')

      // Verify hash is cleared (wait a bit for the replaceState to execute)
      cy.wait(2000)
      cy.location('hash').should('eq', '')
    })

    it('should handle malformed magic link tokens', () => {
      // Visit with invalid token
      cy.visit('/#access_token=invalid-token&refresh_token=invalid')
      cy.wait(3000)

      // Should remain on login screen
      cy.contains('Login to your account').should('be.visible')
      cy.get('input[type="email"]').should('be.visible')
    })
  })

  describe('Session Management', () => {
    it('should maintain authentication state across page reloads', () => {
      // First authenticate via magic link
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzAzMDAwMDAwLCJleHAiOjE5MDMwMDAwMDB9.abc123'
      cy.visit(
        `/#access_token=${mockToken}&refresh_token=refresh_abc123&expires_in=3600&token_type=bearer`
      )

      // Wait for authentication
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')

      // Reload the page
      cy.reload()
      cy.wait(2000)

      // Should still be authenticated
      cy.contains('Timer').should('be.visible')
      cy.get('input[type="email"]').should('not.exist')
    })

    it('should redirect to login after clearing session', () => {
      // First authenticate
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzAzMDAwMDAwLCJleHAiOjE5MDMwMDAwMDB9.abc123'
      cy.visit(
        `/#access_token=${mockToken}&refresh_token=refresh_abc123&expires_in=3600&token_type=bearer`
      )
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')

      // Clear session data
      cy.window().then(win => {
        win.localStorage.removeItem('tiko_auth_session')
        win.localStorage.removeItem('sb-localhost-auth-token')
      })

      // Wait for the auth store to detect the change (it checks every 1 second)
      cy.wait(1500)

      // Should show login form (auth store should have detected session removal)
      cy.contains('Login to your account').should('be.visible')
      cy.get('input[type="email"]').should('be.visible')
    })
  })

  describe('User Settings Integration', () => {
    it('should preserve and apply user settings after authentication', () => {
      // Set user preferences before auth
      cy.window().then(win => {
        win.localStorage.setItem(
          'tiko_user_settings',
          JSON.stringify({
            theme: 'dark',
            language: 'nl-NL',
            customSetting: 'test-value',
          })
        )
      })

      // Authenticate
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzAzMDAwMDAwLCJleHAiOjE5MDMwMDAwMDB9.abc123'
      cy.visit(
        `/#access_token=${mockToken}&refresh_token=refresh_abc123&expires_in=3600&token_type=bearer`
      )
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')

      // Verify settings persisted
      cy.window().then(win => {
        const settings = JSON.parse(win.localStorage.getItem('tiko_user_settings') || '{}')
        expect(settings.theme).to.equal('dark')
        expect(settings.language).to.equal('nl-NL')
        expect(settings.customSetting).to.equal('test-value')
      })
    })
  })

  describe('Error Handling', () => {
    it('should display rate limit errors with retry timer', () => {
      cy.intercept('POST', '**/auth/v1/otp', {
        statusCode: 429,
        body: {
          code: 429,
          error_code: 'over_email_send_rate_limit',
          msg: 'For security purposes, you can only request this after 60 seconds.',
        },
      }).as('rateLimited')

      cy.get('input[type="email"]').type('test@example.com')
      cy.contains('button', 'Send Code').click()
      cy.wait('@rateLimited')

      // Should show rate limit message
      cy.contains('For security purposes').should('be.visible')
      cy.contains('60 seconds').should('be.visible')
      cy.contains('Try Again').should('be.visible')
    })

    it('should handle network errors gracefully', () => {
      cy.intercept('POST', '**/auth/v1/otp', {
        forceNetworkError: true,
      }).as('networkError')

      cy.get('input[type="email"]').type('test@example.com')
      cy.contains('button', 'Send Code').click()
      cy.wait('@networkError')

      // Should show generic error message
      cy.contains(/error|failed|try again/i).should('be.visible')
    })
  })

  describe('Registration Flow', () => {
    it('should toggle between login and registration', () => {
      // Start on login
      cy.contains('Login to your account').should('be.visible')

      // Switch to register
      cy.contains('Register').click()
      cy.contains('Create your account').should('be.visible') // Fixed: correct text
      cy.contains('Full Name (Optional)').should('be.visible') // Note: capital O in Optional

      // Switch back to login
      cy.contains('Login').click()
      cy.contains('Login to your account').should('be.visible')
    })

    it('should handle registration with optional name', () => {
      cy.contains('Register').click()

      cy.intercept('POST', '**/auth/v1/otp', {
        statusCode: 200,
        body: { message: 'OTP sent' },
      }).as('registerOTP')

      // Fill registration form
      cy.get('input[type="email"]').type('newuser@example.com')
      cy.get('input[type="text"]').type('New User')
      cy.contains('button', 'Send Code').click()

      cy.wait('@registerOTP')

      // Should show verification screen
      cy.contains("We've sent you an email").should('be.visible')
      cy.contains('newuser@example.com').should('be.visible')
    })
  })
})
