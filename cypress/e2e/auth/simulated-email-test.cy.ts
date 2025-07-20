/// <reference types="cypress" />

describe('Simulated Email Authentication Test', () => {
  let testEmail: string

  beforeEach(() => {
    // Clear all storage and cookies
    cy.clearLocalStorage()
    cy.clearCookies()
    
    // Generate unique test email
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    testEmail = `test-${timestamp}-${randomId}@example.com`
    
    cy.visit('/')
    cy.wait(2000) // Wait for app initialization
  })

  it('demonstrates the complete email flow with simulated Supabase email', () => {
    // Step 1: Mock the OTP endpoint to simulate Supabase behavior
    cy.intercept('POST', '**/auth/v1/otp', {
      statusCode: 200,
      body: { 
        message: 'Check your email for the login link!',
        // In reality, Supabase would send an email with:
        // - Magic link: https://yourapp.com/#access_token=xxx&refresh_token=xxx
        // - OTP code: 123456
      }
    }).as('sendOTP')
    
    // Enter email
    cy.get('[data-cy="email-input"]').should('be.visible').type(testEmail)
    cy.get('[data-cy="submit-email-button"]').click()
    
    // Wait for OTP request
    cy.wait('@sendOTP')
    
    // Should show verification screen
    cy.get('[data-cy="verification-message"]').should('contain', "We've sent you an email")
    cy.get('[data-cy="verification-email"]').should('contain', testEmail)
    
    // Step 2: Simulate what happens when user clicks magic link from email
    cy.log('Simulating user clicking magic link from email...')
    
    // Generate mock tokens like Supabase would
    const mockAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzAzMDAwMDAwLCJleHAiOjE5MDMwMDAwMDB9.abc123'
    const mockRefreshToken = 'refresh_token_abc123'
    
    // Visit the magic link URL (as if user clicked it from email)
    cy.visit(`/#access_token=${mockAccessToken}&refresh_token=${mockRefreshToken}&expires_in=3600&token_type=bearer`)
    
    // Wait for authentication processing
    cy.wait(5000)
    
    // Verify successful authentication
    cy.contains('Timer', { timeout: 15000 }).should('be.visible')
    cy.get('[data-cy="email-input"]').should('not.exist')
    
    // Verify session was created
    cy.window().then((win) => {
      const session = win.localStorage.getItem('tiko_auth_session')
      expect(session).to.not.be.null
    })
  })

  it('demonstrates OTP code flow with mocked verification', () => {
    // Step 1: Send OTP
    cy.intercept('POST', '**/auth/v1/otp', {
      statusCode: 200,
      body: { message: 'OTP sent' }
    }).as('sendOTP')
    
    cy.get('[data-cy="email-input"]').type(testEmail)
    cy.get('[data-cy="submit-email-button"]').click()
    cy.wait('@sendOTP')
    
    // Should show verification screen
    cy.get('[data-cy="verification-message"]').should('contain', "We've sent you an email")
    
    // Step 2: Simulate entering OTP from email
    const simulatedOTPFromEmail = '123456'
    
    // Mock the verification endpoint
    cy.intercept('POST', '**/auth/v1/verify', (req) => {
      // In a real scenario, Supabase would verify the OTP
      if (req.body.token === simulatedOTPFromEmail) {
        req.reply({
          statusCode: 200,
          body: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: 'test-user-id',
              email: testEmail,
              app_metadata: {},
              user_metadata: {}
            }
          }
        })
      } else {
        req.reply({
          statusCode: 400,
          body: {
            error: 'invalid_grant',
            error_description: 'Invalid verification code'
          }
        })
      }
    }).as('verifyOTP')
    
    // Enter OTP code
    cy.get('[data-cy="verification-code-input"]').type(simulatedOTPFromEmail)
    cy.get('[data-cy="verify-code-button"]').click()
    
    cy.wait('@verifyOTP')
    
    // Verify successful authentication
    cy.contains('Timer', { timeout: 10000 }).should('be.visible')
    cy.get('[data-cy="email-input"]').should('not.exist')
  })

  it('shows what real Mailosaur integration would look like', () => {
    // This test demonstrates the structure of real email testing
    cy.log('In a real test with Mailosaur:')
    cy.log('1. User submits email')
    cy.log('2. Supabase sends real email to Mailosaur inbox')
    cy.log('3. Test fetches email from Mailosaur API')
    cy.log('4. Test extracts magic link or OTP from email')
    cy.log('5. Test uses extracted data to complete authentication')
    
    // Show the expected email structure
    const expectedEmailStructure = {
      subject: 'Sign in to Tiko',
      from: [{ email: 'noreply@supabase.io' }],
      to: [{ email: testEmail }],
      html: {
        body: `
          <h2>Sign in to Tiko</h2>
          <p>Click the link below to sign in:</p>
          <a href="https://your-app.com/#access_token=xxx&refresh_token=xxx">Sign in to Tiko</a>
          <p>Or use this code: 123456</p>
        `
      }
    }
    
    cy.task('log', `Expected email structure: ${JSON.stringify(expectedEmailStructure, null, 2)}`)
  })
})