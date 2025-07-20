describe('Critical Authentication Flows', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.visit('/')
    cy.wait(1000)
  })

  describe('Email/OTP Authentication', () => {
    it('should complete full OTP authentication flow', () => {
      // Step 1: Submit email
      cy.intercept('POST', '**/auth/v1/otp', {
        statusCode: 200,
        body: { message: 'OTP sent' }
      }).as('sendOTP')

      cy.get('input[type="email"]').type('test@example.com')
      cy.contains('button', 'Send Code').click()
      cy.wait('@sendOTP')

      // Step 2: Verify we're on verification screen
      cy.contains('We\'ve sent you an email').should('be.visible')
      cy.contains('test@example.com').should('be.visible')

      // Step 3: Submit verification code
      cy.intercept('POST', '**/auth/v1/verify', {
        statusCode: 200,
        body: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ',
          refresh_token: 'refresh_token_123',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: 'user123',
            email: 'test@example.com',
            user_metadata: {}
          }
        }
      }).as('verifyOTP')

      cy.get('input[placeholder*="6-digit"]').type('123456')
      cy.contains('button', 'Verify Code').click()
      cy.wait('@verifyOTP')

      // Step 4: Verify authentication succeeded
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')
      cy.get('input[type="email"]').should('not.exist')
    })

    it('should handle OTP verification errors', () => {
      // Setup email submission
      cy.intercept('POST', '**/auth/v1/otp', { statusCode: 200 }).as('sendOTP')
      cy.get('input[type="email"]').type('test@example.com')
      cy.contains('button', 'Send Code').click()
      cy.wait('@sendOTP')

      // Mock verification error
      cy.intercept('POST', '**/auth/v1/verify', {
        statusCode: 400,
        body: {
          error: 'invalid_grant',
          error_description: 'Invalid OTP code'
        }
      }).as('verifyError')

      cy.get('input[placeholder*="6-digit"]').type('999999')
      cy.contains('button', 'Verify Code').click()
      cy.wait('@verifyError')

      // Should show error message
      cy.contains('Invalid').should('be.visible')
      // Should still be on verification screen
      cy.get('input[placeholder*="6-digit"]').should('be.visible')
    })
  })

  describe('Magic Link Authentication', () => {
    it('should authenticate via magic link', () => {
      const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ'
      const refreshToken = 'refresh_token_123'

      cy.visit(`/#access_token=${accessToken}&refresh_token=${refreshToken}&expires_in=3600&token_type=bearer`)

      // Should process magic link and show authenticated content
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')
      
      // Hash should be cleared
      cy.location('hash').should('be.empty')
      
      // Should not show login form
      cy.get('input[type="email"]').should('not.exist')
    })

    it('should handle invalid magic link tokens', () => {
      // Visit with invalid token structure
      cy.visit('/#access_token=invalid&refresh_token=invalid')
      
      // Should still show login form (auth failed)
      cy.contains('Login to your account', { timeout: 5000 }).should('be.visible')
      cy.get('input[type="email"]').should('be.visible')
    })
  })

  describe('Session Persistence', () => {
    it('should maintain session across page reloads', () => {
      // Authenticate first
      const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ'
      cy.visit(`/#access_token=${accessToken}&refresh_token=refresh_123&expires_in=3600&token_type=bearer`)
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')

      // Reload page
      cy.reload()
      
      // Should still be authenticated
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')
      cy.get('input[type="email"]').should('not.exist')
    })

    it('should clear session after logout', () => {
      // First authenticate
      const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ'
      cy.visit(`/#access_token=${accessToken}&refresh_token=refresh_123&expires_in=3600&token_type=bearer`)
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')

      // Clear auth data (simulate logout)
      cy.window().then((win) => {
        win.localStorage.clear()
      })
      
      cy.reload()
      
      // Should show login form
      cy.contains('Login to your account', { timeout: 5000 }).should('be.visible')
      cy.get('input[type="email"]').should('be.visible')
    })
  })

  describe('User Settings Persistence', () => {
    it('should preserve user settings through authentication', () => {
      // Set settings before auth
      cy.window().then((win) => {
        win.localStorage.setItem('tiko_user_settings', JSON.stringify({
          theme: 'dark',
          language: 'nl-NL',
          someAppSetting: 'value'
        }))
      })

      // Authenticate
      const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ'
      cy.visit(`/#access_token=${accessToken}&refresh_token=refresh_123&expires_in=3600&token_type=bearer`)
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')

      // Verify settings are preserved
      cy.window().then((win) => {
        const settings = JSON.parse(win.localStorage.getItem('tiko_user_settings') || '{}')
        expect(settings).to.deep.include({
          theme: 'dark',
          language: 'nl-NL',
          someAppSetting: 'value'
        })
      })
    })
  })

  describe('Rate Limiting', () => {
    it('should show user-friendly rate limit message', () => {
      cy.intercept('POST', '**/auth/v1/otp', {
        statusCode: 429,
        body: {
          code: 429,
          error_code: 'over_email_send_rate_limit',
          msg: 'For security purposes, you can only request this after 60 seconds.'
        }
      }).as('rateLimited')

      cy.get('input[type="email"]').type('test@example.com')
      cy.contains('button', 'Send Code').click()
      cy.wait('@rateLimited')

      // Should show user-friendly message
      cy.contains('Please wait').should('be.visible')
      cy.contains('try again').should('be.visible')
    })
  })
})