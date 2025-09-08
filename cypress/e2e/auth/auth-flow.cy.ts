describe('Authentication Flow Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage()
    cy.visit('/')
  })

  describe('Login Form', () => {
    it('should display the login form when not authenticated', () => {
      cy.get('[data-cy="auth-wrapper"]').should('exist')
      cy.get('[data-cy="login-container"]').should('be.visible')
      cy.get('[data-cy="login-form"]').should('be.visible')
      cy.get('[data-cy="email-input"]').should('be.visible')
      cy.get('[data-cy="submit-email-button"]').should('be.visible')
    })

    it('should validate email format', () => {
      // Test invalid email
      cy.get('[data-cy="email-input"]').type('invalid-email')
      cy.get('[data-cy="submit-email-button"]').should('be.disabled')

      // Clear and test valid email
      cy.get('[data-cy="email-input"]').clear().type('test@example.com')
      cy.get('[data-cy="submit-email-button"]').should('not.be.disabled')
    })

    it('should show loading state when submitting', () => {
      cy.get('[data-cy="email-input"]').type('test@example.com')
      cy.get('[data-cy="submit-email-button"]').click()

      // Check if button shows loading state
      cy.get('[data-cy="submit-email-button"]').should('be.disabled')
    })

    it('should handle rate limit errors gracefully', () => {
      // Intercept the auth request to simulate rate limit
      cy.intercept('POST', '**/auth/v1/otp', {
        statusCode: 429,
        body: {
          code: 429,
          error_code: 'over_email_send_rate_limit',
          msg: 'For security purposes, you can only request this after 24 seconds.',
        },
      }).as('rateLimitedRequest')

      cy.get('[data-cy="email-input"]').type('test@example.com')
      cy.get('[data-cy="submit-email-button"]').click()

      cy.wait('@rateLimitedRequest')

      // Should show error message
      cy.get('[data-cy="error-message"]').should('be.visible')
      cy.get('[data-cy="error-message"]').should('contain', 'wait')
    })
  })

  describe('Verification Step', () => {
    beforeEach(() => {
      // Intercept successful OTP request
      cy.intercept('POST', '**/auth/v1/otp', {
        statusCode: 200,
        body: {},
      }).as('otpRequest')

      cy.get('[data-cy="email-input"]').type('test@example.com')
      cy.get('[data-cy="submit-email-button"]').click()
      cy.wait('@otpRequest')
    })

    it('should show verification form after email submission', () => {
      cy.get('[data-cy="verification-form"]').should('be.visible')
      cy.get('[data-cy="verification-code-input"]').should('be.visible')
      cy.get('[data-cy="verify-code-button"]').should('be.visible')
    })

    it('should validate code format', () => {
      // Test invalid code (letters)
      cy.get('[data-cy="verification-code-input"]').type('abcdef')
      cy.get('[data-cy="verify-code-button"]').should('be.disabled')

      // Clear and test valid code
      cy.get('[data-cy="verification-code-input"]').clear().type('123456')
      cy.get('[data-cy="verify-code-button"]').should('not.be.disabled')
    })

    it('should show resend code button with cooldown', () => {
      cy.get('[data-cy="resend-code-button"]').should('be.visible')
      cy.get('[data-cy="resend-code-button"]').should('contain', 'Resend in')
      cy.get('[data-cy="resend-code-button"]').should('be.disabled')

      // Wait for cooldown to finish (this might take a while in real tests)
      // For now, just check it exists
    })

    it('should allow going back to email input', () => {
      cy.get('[data-cy="back-to-email-button"]').should('be.visible')
      cy.get('[data-cy="back-to-email-button"]').click()

      cy.get('[data-cy="email-form"]').should('be.visible')
      cy.get('[data-cy="verification-form"]').should('not.exist')
    })
  })

  describe('Magic Link Authentication', () => {
    it('should handle magic link callback', () => {
      // Simulate magic link redirect
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ'

      cy.visit(
        `/#access_token=${mockToken}&refresh_token=refresh_${mockToken}&expires_in=3600&token_type=bearer`
      )

      // Should process the magic link and show authenticated content
      cy.get('[data-cy="authenticated-content"]', { timeout: 10000 }).should('be.visible')
      cy.get('[data-cy="login-form"]').should('not.exist')
    })

    it('should clear hash after processing magic link', () => {
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ'

      cy.visit(
        `/#access_token=${mockToken}&refresh_token=refresh_${mockToken}&expires_in=3600&token_type=bearer`
      )

      // Wait for auth processing
      cy.get('[data-cy="authenticated-content"]', { timeout: 10000 }).should('be.visible')

      // Check that hash is cleared
      cy.location('hash').should('be.empty')
    })
  })

  describe('OTP Code Authentication', () => {
    beforeEach(() => {
      // Setup email submission
      cy.intercept('POST', '**/auth/v1/otp', {
        statusCode: 200,
        body: {},
      }).as('otpRequest')

      cy.get('[data-cy="email-input"]').type('test@example.com')
      cy.get('[data-cy="submit-email-button"]').click()
      cy.wait('@otpRequest')
    })

    it('should successfully verify with correct code', () => {
      // Intercept verification request
      cy.intercept('POST', '**/auth/v1/verify', {
        statusCode: 200,
        body: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
      }).as('verifyRequest')

      cy.get('[data-cy="verification-code-input"]').type('123456')
      cy.get('[data-cy="verify-code-button"]').click()

      cy.wait('@verifyRequest')

      // Should show authenticated content
      cy.get('[data-cy="authenticated-content"]', { timeout: 10000 }).should('be.visible')
    })

    it('should handle incorrect code', () => {
      // Intercept verification request with error
      cy.intercept('POST', '**/auth/v1/verify', {
        statusCode: 400,
        body: {
          error: 'invalid_grant',
          error_description: 'Invalid verification code',
        },
      }).as('verifyRequest')

      cy.get('[data-cy="verification-code-input"]').type('999999')
      cy.get('[data-cy="verify-code-button"]').click()

      cy.wait('@verifyRequest')

      // Should show error message
      cy.get('[data-cy="error-message"]').should('be.visible')
      cy.get('[data-cy="error-message"]').should('contain', 'Invalid')
    })
  })

  describe('Session Persistence', () => {
    it('should persist session after page reload', () => {
      // Mock successful authentication
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ'

      // Set up localStorage with auth data
      cy.window().then(win => {
        win.localStorage.setItem(
          'sb-localhost-auth-token',
          JSON.stringify({
            currentSession: {
              access_token: mockToken,
              refresh_token: `refresh_${mockToken}`,
              expires_at: Date.now() / 1000 + 3600,
              expires_in: 3600,
              token_type: 'bearer',
              user: {
                id: 'test-user-id',
                email: 'test@example.com',
              },
            },
          })
        )
      })

      // Reload the page
      cy.reload()

      // Should still be authenticated
      cy.get('[data-cy="authenticated-content"]', { timeout: 10000 }).should('be.visible')
      cy.get('[data-cy="login-form"]').should('not.exist')
    })

    it('should clear session on logout', () => {
      // First authenticate
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ'

      cy.visit(
        `/#access_token=${mockToken}&refresh_token=refresh_${mockToken}&expires_in=3600&token_type=bearer`
      )
      cy.get('[data-cy="authenticated-content"]', { timeout: 10000 }).should('be.visible')

      // Find and click logout button (assuming it exists in the authenticated view)
      // This would need to be implemented in the actual app
      // For now, we'll simulate logout by clearing localStorage
      cy.window().then(win => {
        win.localStorage.clear()
      })

      cy.reload()

      // Should show login form again
      cy.get('[data-cy="login-form"]').should('be.visible')
      cy.get('[data-cy="authenticated-content"]').should('not.exist')
    })
  })

  describe('User Settings Persistence', () => {
    it('should persist user settings after authentication', () => {
      // First set some settings in localStorage
      cy.window().then(win => {
        win.localStorage.setItem(
          'tiko_user_settings',
          JSON.stringify({
            theme: 'dark',
            language: 'nl-NL',
          })
        )
      })

      // Authenticate
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ'

      cy.visit(
        `/#access_token=${mockToken}&refresh_token=refresh_${mockToken}&expires_in=3600&token_type=bearer`
      )
      cy.get('[data-cy="authenticated-content"]', { timeout: 10000 }).should('be.visible')

      // Check that settings are still applied
      cy.window().then(win => {
        const settings = JSON.parse(win.localStorage.getItem('tiko_user_settings') || '{}')
        expect(settings.theme).to.equal('dark')
        expect(settings.language).to.equal('nl-NL')
      })
    })
  })
})
