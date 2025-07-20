// Magic Link Authentication Commands

// Create a unique test email
Cypress.Commands.add('createTestEmail', () => {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(7)
  const email = `test-${timestamp}-${randomId}@mailosaur.net`
  return cy.wrap(email)
})

// Login with magic link
Cypress.Commands.add('loginWithMagicLink', (email: string) => {
  // Visit the app
  cy.visit('/')
  
  // Wait for the login form to appear
  cy.get('[data-cy="login-form"]', { timeout: 10000 }).should('be.visible')
  
  // Enter email
  cy.get('[data-cy="email-input"]').type(email)
  
  // Submit the form
  cy.get('[data-cy="submit-email-button"]').click()
  
  // Wait for success message or verification screen
  cy.contains('Check your email', { timeout: 10000 }).should('be.visible')
})

// Wait for email using Mailosaur
Cypress.Commands.add('waitForEmail', (email: string, timeout = 30000) => {
  const serverId = Cypress.env('MAILOSAUR_SERVER_ID')
  const apiKey = Cypress.env('MAILOSAUR_API_KEY')
  
  if (!serverId || !apiKey) {
    // Fallback for local testing - use a mock email
    cy.log('No Mailosaur credentials, using mock email')
    return cy.wrap({
      subject: 'Sign in to Tiko',
      html: {
        body: '<a href="http://localhost:3000/#access_token=mock-token&refresh_token=mock-refresh&expires_in=3600">Sign in to Tiko</a>'
      }
    })
  }
  
  // Use Mailosaur API to fetch the email
  cy.request({
    method: 'GET',
    url: `https://mailosaur.com/api/messages/await?server=${serverId}&sentTo=${email}`,
    headers: {
      'Authorization': `Basic ${btoa(apiKey + ':')}`
    },
    timeout: timeout
  }).then((response) => {
    expect(response.status).to.eq(200)
    return response.body
  })
})

// Get the last email
Cypress.Commands.add('getLastEmail', (email: string) => {
  return cy.waitForEmail(email)
})

// Extract magic link from email content
Cypress.Commands.add('extractMagicLink', (emailContent: any) => {
  let magicLink = ''
  
  if (emailContent.html && emailContent.html.body) {
    // Extract link from HTML
    const matches = emailContent.html.body.match(/href="([^"]+#access_token[^"]+)"/)
    if (matches && matches[1]) {
      magicLink = matches[1]
    }
  } else if (emailContent.text && emailContent.text.body) {
    // Extract link from plain text
    const matches = emailContent.text.body.match(/(https?:\/\/[^\s]+#access_token[^\s]+)/)
    if (matches && matches[1]) {
      magicLink = matches[1]
    }
  }
  
  expect(magicLink).to.include('#access_token')
  return cy.wrap(magicLink)
})