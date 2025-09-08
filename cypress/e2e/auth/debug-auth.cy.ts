describe('Debug Auth', () => {
  it('should find auth elements', () => {
    cy.visit('/')

    // Wait for the page to load
    cy.wait(2000)

    // Debug: Take a screenshot
    cy.screenshot('initial-load')

    // Debug: Log the body content
    cy.get('body').then($body => {
      cy.log('Body HTML:', $body.html())
    })

    // Look for any auth-related elements
    cy.get('body').then($body => {
      // Check if auth-wrapper exists
      if ($body.find('[data-cy="auth-wrapper"]').length > 0) {
        cy.log('Found auth-wrapper')
      } else {
        cy.log('Auth-wrapper not found')
      }

      // Check if login form exists
      if ($body.find('[data-cy="login-form"]').length > 0) {
        cy.log('Found login-form')
      } else {
        cy.log('Login-form not found')
      }

      // Check for class-based selectors
      if ($body.find('.auth-wrapper').length > 0) {
        cy.log('Found .auth-wrapper class')
      } else {
        cy.log('.auth-wrapper class not found')
      }

      if ($body.find('.login-form').length > 0) {
        cy.log('Found .login-form class')
      } else {
        cy.log('.login-form class not found')
      }
    })

    // Try to find any input fields
    cy.get('input').then($inputs => {
      cy.log(`Found ${$inputs.length} input fields`)
      $inputs.each((index, input) => {
        cy.log(`Input ${index}: type=${input.type}, name=${input.name}`)
      })
    })
  })
})
