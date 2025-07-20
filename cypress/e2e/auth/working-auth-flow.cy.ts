describe('Working Authentication Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/')
    // Wait for app to load
    cy.wait(1000)
  })

  describe('Login Form', () => {
    it('should display the login form when not authenticated', () => {
      // Check that we're on the login screen
      cy.contains('Login to your account').should('be.visible')
      cy.contains('Email Address').should('be.visible')
      
      // Check for email input
      cy.get('input[type="email"]').should('be.visible')
      cy.get('input[type="email"]').should('have.attr', 'placeholder', 'Enter your email')
      
      // Check for send code button
      cy.contains('button', 'Send Code').should('be.visible')
      
      // Check for other elements
      cy.contains('or').should('be.visible')
      cy.contains('Sign in with Tiko').should('be.visible')
      cy.contains('Login with Apple').should('be.visible')
    })

    it('should validate email format', () => {
      // Get email input
      const emailInput = cy.get('input[type="email"]')
      
      // Type invalid email
      emailInput.type('invalid-email')
      
      // Button should be disabled
      cy.contains('button', 'Send Code').should('have.class', 'button--disabled')
      
      // Clear and type valid email
      emailInput.clear().type('test@example.com')
      
      // Button should be enabled
      cy.contains('button', 'Send Code').should('not.have.class', 'button--disabled')
    })

    it('should handle email submission', () => {
      // Intercept OTP request
      cy.intercept('POST', '**/auth/v1/otp', {
        statusCode: 200,
        body: { }
      }).as('otpRequest')

      // Enter email and submit
      cy.get('input[type="email"]').type('test@example.com')
      cy.contains('button', 'Send Code').click()
      
      // Wait for request
      cy.wait('@otpRequest')
      
      // Should show verification screen
      cy.contains('We\'ve sent you an email').should('be.visible')
      cy.contains('test@example.com').should('be.visible')
    })

    it('should handle rate limit errors', () => {
      // Intercept with rate limit error
      cy.intercept('POST', '**/auth/v1/otp', {
        statusCode: 429,
        body: {
          code: 429,
          error_code: 'over_email_send_rate_limit',
          msg: 'For security purposes, you can only request this after 24 seconds.'
        }
      }).as('rateLimitedRequest')

      // Enter email and submit
      cy.get('input[type="email"]').type('test@example.com')
      cy.contains('button', 'Send Code').click()
      
      cy.wait('@rateLimitedRequest')
      
      // Should show error message with user-friendly text
      cy.contains('Please wait').should('be.visible')
    })

    it('should toggle between login and register', () => {
      // Click register link
      cy.contains('Register').click()
      
      // Should show register form
      cy.contains('Create Account').should('be.visible')
      cy.contains('Full Name (optional)').should('be.visible')
      
      // Click login link
      cy.contains('Login').click()
      
      // Should be back on login form
      cy.contains('Login to your account').should('be.visible')
    })
  })

  describe('Verification Step', () => {
    beforeEach(() => {
      // Setup successful OTP request
      cy.intercept('POST', '**/auth/v1/otp', {
        statusCode: 200,
        body: { }
      }).as('otpRequest')

      // Submit email
      cy.get('input[type="email"]').type('test@example.com')
      cy.contains('button', 'Send Code').click()
      cy.wait('@otpRequest')
    })

    it('should show verification form', () => {
      cy.contains('We\'ve sent you an email').should('be.visible')
      cy.contains('Option 1: Click the magic link').should('be.visible')
      cy.contains('Option 2: Enter the 6-digit code').should('be.visible')
      
      // Check for code input
      cy.get('input[placeholder*="6-digit"]').should('be.visible')
      cy.contains('button', 'Verify Code').should('be.visible')
    })

    it('should validate code format', () => {
      const codeInput = cy.get('input[placeholder*="6-digit"]')
      
      // Type invalid code (letters)
      codeInput.type('abcdef')
      cy.contains('button', 'Verify Code').should('have.class', 'button--disabled')
      
      // Clear and type valid code
      codeInput.clear().type('123456')
      cy.contains('button', 'Verify Code').should('not.have.class', 'button--disabled')
    })

    it('should show resend code option', () => {
      // Should show resend with cooldown
      cy.contains(/Resend in \d+s/).should('be.visible')
      
      // Back to email button should work
      cy.contains('Use a different email').click()
      cy.contains('Login to your account').should('be.visible')
    })

    it('should handle correct code', () => {
      // Intercept verify request
      cy.intercept('POST', '**/auth/v1/verify', {
        statusCode: 200,
        body: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token', 
          expires_in: 3600,
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        }
      }).as('verifyRequest')

      // Enter code and submit
      cy.get('input[placeholder*="6-digit"]').type('123456')
      cy.contains('button', 'Verify Code').click()
      
      cy.wait('@verifyRequest')
      
      // Should be authenticated (timer app should show)
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')
    })

    it('should handle incorrect code', () => {
      // Intercept with error
      cy.intercept('POST', '**/auth/v1/verify', {
        statusCode: 400,
        body: {
          error: 'invalid_grant',
          error_description: 'Invalid verification code'
        }
      }).as('verifyRequest')

      // Enter wrong code
      cy.get('input[placeholder*="6-digit"]').type('999999')
      cy.contains('button', 'Verify Code').click()
      
      cy.wait('@verifyRequest')
      
      // Should show error
      cy.contains('Invalid').should('be.visible')
    })
  })

  describe('Magic Link Authentication', () => {
    it('should handle magic link callback', () => {
      // Create a valid JWT token
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ'
      
      // Visit with magic link hash
      cy.visit(`/#access_token=${mockToken}&refresh_token=refresh_${mockToken}&expires_in=3600&token_type=bearer`)
      
      // Should authenticate and show timer app
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')
      
      // URL hash should be cleared
      cy.location('hash').should('be.empty')
    })

    it('should persist session after reload', () => {
      // Setup auth state
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ'
      
      cy.visit(`/#access_token=${mockToken}&refresh_token=refresh_${mockToken}&expires_in=3600&token_type=bearer`)
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')
      
      // Reload page
      cy.reload()
      
      // Should still be authenticated
      cy.contains('Timer').should('be.visible')
      cy.get('input[type="email"]').should('not.exist')
    })
  })

  describe('User Settings', () => {
    it('should persist theme and language settings', () => {
      // Set some settings in localStorage before auth
      cy.window().then((win) => {
        win.localStorage.setItem('tiko_user_settings', JSON.stringify({
          theme: 'dark',
          language: 'nl-NL'
        }))
      })

      // Authenticate with magic link
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ'
      
      cy.visit(`/#access_token=${mockToken}&refresh_token=refresh_${mockToken}&expires_in=3600&token_type=bearer`)
      cy.contains('Timer', { timeout: 10000 }).should('be.visible')

      // Check settings persisted
      cy.window().then((win) => {
        const settings = JSON.parse(win.localStorage.getItem('tiko_user_settings') || '{}')
        expect(settings.theme).to.equal('dark')
        expect(settings.language).to.equal('nl-NL')
      })

      // Check dark theme is applied
      cy.get('html').should('have.attr', 'data-theme', 'dark')
    })
  })
})