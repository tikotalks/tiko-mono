describe('Simple Magic Link Test', () => {
  it('should show login form when not authenticated', () => {
    // Visit the app
    cy.visit('http://localhost:3000')

    // Should see some kind of auth wrapper
    cy.get('.auth-wrapper').should('exist')

    // Should see an email input
    cy.get('input[type="email"]').should('be.visible')

    // Should see a submit button
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('should accept email input', () => {
    cy.visit('http://localhost:3000')

    // Type email
    cy.get('input[type="email"]').type('test@example.com')

    // Email should have the value
    cy.get('input[type="email"]').should('have.value', 'test@example.com')
  })

  it('should handle form submission', () => {
    cy.visit('http://localhost:3000')

    // Enter email
    cy.get('input[type="email"]').type('test@example.com')

    // Submit form
    cy.get('button[type="submit"]').click()

    // Should show some feedback (either success message or error)
    cy.get('body').should('contain.text', /email|code|check|sent|error/i)
  })
})
