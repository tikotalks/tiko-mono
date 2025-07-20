describe('OTP Code Authentication', () => {
  let testEmail: string

  beforeEach(() => {
    // Create a unique test email for each test
    cy.createTestEmail().then(email => {
      testEmail = email
    })
  })

  it('should complete OTP code authentication flow', () => {
    // Step 1: Visit the app
    cy.visit('/')
    
    // Step 2: Enter email
    cy.get('input[type="email"]').type(testEmail)
    cy.get('button[type="submit"]').contains(/send|continue/i).click()
    
    // Step 3: Should show OTP input screen
    cy.get('[data-cy=otp-input]', { timeout: 10000 }).should('be.visible')
    cy.contains(/enter.*code|verification code/i).should('be.visible')
    
    // Step 4: Wait for email with OTP code
    cy.waitForEmail(testEmail).then((email) => {
      // Extract OTP code from email
      let otpCode = ''
      
      if (email.text && email.text.body) {
        // Look for 6-digit code in email
        const matches = email.text.body.match(/\b(\d{6})\b/)
        if (matches && matches[1]) {
          otpCode = matches[1]
        }
      } else if (email.html && email.html.body) {
        // Look in HTML if text not available
        const matches = email.html.body.match(/\b(\d{6})\b/)
        if (matches && matches[1]) {
          otpCode = matches[1]
        }
      }
      
      expect(otpCode).to.have.length(6)
      
      // Step 5: Enter OTP code
      cy.get('[data-cy=otp-input]').type(otpCode)
      
      // Step 6: Submit OTP
      cy.get('[data-cy=verify-button]').click()
      
      // Step 7: Should be authenticated
      cy.get('.auth-wrapper__app', { timeout: 10000 }).should('exist')
      cy.get('.login-form').should('not.exist')
      
      // Step 8: Verify session
      cy.window().then((win) => {
        const authSession = win.localStorage.getItem('tiko_auth_session')
        expect(authSession).to.not.be.null
        
        if (authSession) {
          const session = JSON.parse(authSession)
          expect(session.user.email).to.equal(testEmail)
        }
      })
    })
  })

  it('should handle invalid OTP code', () => {
    cy.visit('/')
    cy.get('input[type="email"]').type(testEmail)
    cy.get('button[type="submit"]').contains(/send|continue/i).click()
    
    // Wait for OTP screen
    cy.get('[data-cy=otp-input]', { timeout: 10000 }).should('be.visible')
    
    // Enter invalid code
    cy.get('[data-cy=otp-input]').type('000000')
    cy.get('[data-cy=verify-button]').click()
    
    // Should show error
    cy.contains(/invalid.*code|incorrect/i, { timeout: 5000 }).should('be.visible')
    
    // Should still be on OTP screen
    cy.get('[data-cy=otp-input]').should('be.visible')
  })

  it('should resend OTP code', () => {
    cy.visit('/')
    cy.get('input[type="email"]').type(testEmail)
    cy.get('button[type="submit"]').contains(/send|continue/i).click()
    
    // Wait for OTP screen
    cy.get('[data-cy=otp-input]', { timeout: 10000 }).should('be.visible')
    
    // Click resend
    cy.get('[data-cy=resend-button]').click()
    
    // Should show success message
    cy.contains(/code.*sent|resent/i, { timeout: 5000 }).should('be.visible')
    
    // Should receive new email
    cy.wait(2000) // Wait a bit for the new email
    cy.waitForEmail(testEmail).then((email) => {
      expect(email).to.exist
      expect(email.subject).to.include('code')
    })
  })

  it('should go back to email input', () => {
    cy.visit('/')
    cy.get('input[type="email"]').type(testEmail)
    cy.get('button[type="submit"]').contains(/send|continue/i).click()
    
    // Wait for OTP screen
    cy.get('[data-cy=otp-input]', { timeout: 10000 }).should('be.visible')
    
    // Click back button
    cy.get('[data-cy=back-button]').click()
    
    // Should be back on email screen
    cy.get('input[type="email"]').should('be.visible')
    cy.get('[data-cy=otp-input]').should('not.exist')
  })
})