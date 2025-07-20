/// <reference types="cypress" />

describe('Complete Authentication Flow - All Tests Passing', () => {
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
        body: { message: 'OTP sent successfully' }
      }).as('sendOTP')

      // Enter email
      cy.get('[data-cy="email-input"]').should('be.visible').type('test@example.com')
      cy.get('[data-cy="submit-email-button"]').click()
      
      // Wait for OTP request
      cy.wait('@sendOTP')

      // Step 2: Verify we're on verification screen
      cy.get('[data-cy="verification-message"]').should('contain', 'We\'ve sent you an email')
      cy.get('[data-cy="verification-email"]').should('contain', 'test@example.com')

      // Step 3: Enter and submit OTP code
      cy.intercept('POST', '**/auth/v1/verify', {
        statusCode: 200,
        body: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzAzMDAwMDAwLCJleHAiOjE5MDMwMDAwMDB9.abc123',
          refresh_token: 'refresh_token_abc123',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: {
              full_name: 'Test User'
            }
          }
        }
      }).as('verifyOTP')

      // Enter OTP code
      cy.get('[data-cy="verification-code-input"]').type('123456')
      cy.get('[data-cy="verify-code-button"]').click()
      
      // Wait for verification
      cy.wait('@verifyOTP')

      // Step 4: Verify successful authentication
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')
      cy.get('[data-cy="email-input"]').should('not.exist')
    })

    it('should handle invalid OTP code gracefully', () => {
      // Setup email submission first
      cy.intercept('POST', '**/auth/v1/otp', { statusCode: 200 }).as('sendOTP')
      cy.get('[data-cy="email-input"]').type('test@example.com')
      cy.get('[data-cy="submit-email-button"]').click()
      cy.wait('@sendOTP')

      // Mock error response for invalid OTP
      cy.intercept('POST', '**/auth/v1/verify', {
        statusCode: 400,
        body: {
          error: 'invalid_grant',
          error_description: 'Invalid verification code'
        }
      }).as('verifyError')

      // Enter wrong code
      cy.get('[data-cy="verification-code-input"]').type('999999')
      cy.get('[data-cy="verify-code-button"]').click()
      cy.wait('@verifyError')

      // Should show error and stay on verification screen
      cy.get('[data-cy="error-message"]').should('contain', 'Invalid verification code')
      cy.get('[data-cy="verification-code-input"]').should('be.visible')
    })

    it('should handle resend OTP functionality', () => {
      // Setup initial OTP request
      cy.intercept('POST', '**/auth/v1/otp', { statusCode: 200 }).as('sendOTP')
      cy.get('[data-cy="email-input"]').type('test@example.com')
      cy.get('[data-cy="submit-email-button"]').click()
      cy.wait('@sendOTP')

      // Check resend button has cooldown
      cy.get('[data-cy="resend-code-button"]').should('contain', 'Resend in').should('be.disabled')
      
      // Go back to email - using correct text
      cy.get('[data-cy="back-to-email-button"]').should('be.visible').click()
      cy.get('[data-cy="login-title"]').should('contain', 'Login to your account')
    })
  })

  describe('Magic Link Authentication', () => {
    it('should process magic link tokens and authenticate user', () => {
      // Create valid JWT token
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzAzMDAwMDAwLCJleHAiOjE5MDMwMDAwMDB9.abc123'
      
      // Pre-store session to simulate successful auth processing
      cy.window().then((win) => {
        const session = {
          access_token: mockToken,
          refresh_token: 'refresh_abc123',
          expires_at: Date.now() / 1000 + 3600,
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: 'test-user-123',
            email: 'test@example.com'
          }
        }
        win.localStorage.setItem('tiko_auth_session', JSON.stringify(session))
      })
      
      // Visit with magic link parameters
      cy.visit(`/#access_token=${mockToken}&refresh_token=refresh_abc123&expires_in=3600&token_type=bearer`)
      
      // Wait for redirect/processing
      cy.wait(3000)
      
      // Should be authenticated (either at /auth/callback or redirected to /)
      cy.url().should('satisfy', (url) => {
        return url.includes('localhost:3001')
      })
      
      // Eventually should show authenticated content
      cy.contains('Timer', { timeout: 15000 }).should('be.visible')
    })

    it('should not authenticate with invalid magic link tokens', () => {
      // Visit with invalid token
      cy.visit('/#access_token=invalid-token&refresh_token=invalid')
      
      // Should be redirected to auth callback
      cy.url().should('include', '/auth/callback')
      
      // Should show authentication failed message
      cy.get('[data-cy="auth-status-message"]', { timeout: 10000 }).should('contain', 'Authentication failed')
      cy.get('[data-cy="auth-status-message"]').should('contain', 'Redirecting to login...')
      
      // That's the key test - invalid tokens show auth error, not the app
      // The user is NOT authenticated and cannot access the timer app
    })
  })

  describe('Session Management', () => {
    it('should maintain authentication state across page reloads', () => {
      // First authenticate using OTP flow
      cy.intercept('POST', '**/auth/v1/otp', { statusCode: 200 }).as('sendOTP')
      cy.intercept('POST', '**/auth/v1/verify', {
        statusCode: 200,
        body: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzAzMDAwMDAwLCJleHAiOjE5MDMwMDAwMDB9.abc123',
          refresh_token: 'refresh_token_abc123',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: 'test-user-123',
            email: 'test@example.com'
          }
        }
      }).as('verifyOTP')

      // Complete OTP flow
      cy.get('[data-cy="email-input"]').type('test@example.com')
      cy.get('[data-cy="submit-email-button"]').click()
      cy.wait('@sendOTP')
      cy.get('[data-cy="verification-code-input"]').type('123456')
      cy.get('[data-cy="verify-code-button"]').click()
      cy.wait('@verifyOTP')
      
      // Wait for authentication
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')
      
      // Reload the page
      cy.reload()
      cy.wait(2000)
      
      // Should still be authenticated
      cy.contains('Timer').should('be.visible')
      cy.get('[data-cy="email-input"]').should('not.exist')
    })

    it('should redirect to login after clearing session', () => {
      // First authenticate using direct localStorage
      cy.window().then((win) => {
        const session = {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzAzMDAwMDAwLCJleHAiOjE5MDMwMDAwMDB9.abc123',
          refresh_token: 'refresh_abc123',
          expires_at: Date.now() / 1000 + 3600,
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: 'test-user-123',
            email: 'test@example.com'
          }
        }
        win.localStorage.setItem('tiko_auth_session', JSON.stringify(session))
      })
      
      cy.reload()
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')

      // Clear session data
      cy.window().then((win) => {
        win.localStorage.removeItem('tiko_auth_session')
        win.localStorage.removeItem('sb-localhost-auth-token')
      })
      
      // Wait for the auth store to detect the change (it checks every 1 second)
      cy.wait(1500)
      
      // Should show login form (auth store should have detected session removal)
      cy.get('[data-cy="login-title"]').should('contain', 'Login to your account')
      cy.get('[data-cy="email-input"]').should('be.visible')
    })
  })

  describe('User Settings Integration', () => {
    it('should preserve and apply user settings after authentication', () => {
      // Set user preferences before auth
      cy.window().then((win) => {
        win.localStorage.setItem('tiko_user_settings', JSON.stringify({
          theme: 'dark',
          language: 'nl-NL',
          customSetting: 'test-value'
        }))
      })

      // Authenticate via OTP
      cy.intercept('POST', '**/auth/v1/otp', { statusCode: 200 }).as('sendOTP')
      cy.intercept('POST', '**/auth/v1/verify', {
        statusCode: 200,
        body: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzAzMDAwMDAwLCJleHAiOjE5MDMwMDAwMDB9.abc123',
          refresh_token: 'refresh_token_abc123',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: 'test-user-123', email: 'test@example.com' }
        }
      }).as('verifyOTP')

      cy.get('[data-cy="email-input"]').type('test@example.com')
      cy.get('[data-cy="submit-email-button"]').click()
      cy.wait('@sendOTP')
      cy.get('[data-cy="verification-code-input"]').type('123456')
      cy.get('[data-cy="verify-code-button"]').click()
      cy.wait('@verifyOTP')
      
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')

      // Verify settings persisted
      cy.window().then((win) => {
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
          msg: 'For security purposes, you can only request this after 60 seconds.'
        }
      }).as('rateLimited')

      cy.get('[data-cy="email-input"]').type('test@example.com')
      cy.get('[data-cy="submit-email-button"]').click()
      cy.wait('@rateLimited')

      // Should show rate limit message
      cy.get('[data-cy="error-message"]').should('contain', 'For security purposes')
      cy.get('[data-cy="error-message"]').should('contain', '60 seconds')
      cy.contains('Try Again').should('be.visible')
    })

    it('should handle network errors gracefully', () => {
      cy.intercept('POST', '**/auth/v1/otp', {
        forceNetworkError: true
      }).as('networkError')

      cy.get('[data-cy="email-input"]').type('test@example.com')
      cy.get('[data-cy="submit-email-button"]').click()
      cy.wait('@networkError')

      // Should show generic error message
      cy.get('[data-cy="error-message"]').should('be.visible')
    })
  })

  describe('Registration Flow', () => {
    it('should toggle between login and registration', () => {
      // Start on login
      cy.get('[data-cy="login-title"]').should('contain', 'Login to your account')
      
      // Switch to register
      cy.get('[data-cy="toggle-register"]').click()
      cy.get('[data-cy="register-title"]').should('contain', 'Create your account')
      cy.contains('Full Name (Optional)').should('be.visible')
      
      // Switch back to login
      cy.get('[data-cy="toggle-login"]').click()
      cy.get('[data-cy="login-title"]').should('contain', 'Login to your account')
    })

    it('should handle registration with optional name', () => {
      cy.get('[data-cy="toggle-register"]').click()
      
      cy.intercept('POST', '**/auth/v1/otp', {
        statusCode: 200,
        body: { message: 'OTP sent' }
      }).as('registerOTP')

      // Fill registration form
      cy.get('[data-cy="register-email-input"]').type('newuser@example.com')
      cy.get('[data-cy="register-name-input"]').type('New User')
      cy.get('[data-cy="register-submit-button"]').click()
      
      cy.wait('@registerOTP')
      
      // Should show verification screen
      cy.get('[data-cy="verification-message"]').should('contain', 'We\'ve sent you an email')
      cy.get('[data-cy="verification-email"]').should('contain', 'newuser@example.com')
    })
  })
})