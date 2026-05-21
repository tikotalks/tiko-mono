# Cypress E2E Tests for Authentication

This directory contains end-to-end tests for the Tiko authentication flows using Cypress.

## Setup

### 1. Email Testing Service

For testing email flows (magic links and OTP codes), you have two options:

#### Option A: Mailosaur (Recommended for CI/CD)

1. Sign up for a free account at [Mailosaur](https://mailosaur.com)
2. Create a server and note your Server ID
3. Get your API key from the dashboard
4. Set environment variables:

```bash
export MAILOSAUR_API_KEY="your-api-key"
export MAILOSAUR_SERVER_ID="your-server-id"
```

#### Option B: Local Mock (Development)

If you don't set up Mailosaur, the tests will use mock emails for local development.

### 2. Running Tests

```bash
# Run all tests in headless mode
pnpm test:e2e

# Open Cypress interactive mode
pnpm test:e2e:open

# Run only authentication tests
pnpm test:e2e:auth
```

## Test Coverage

### Magic Link Authentication (`magic-link.cy.ts`)

- ✅ Complete magic link flow
- ✅ Expired link handling
- ✅ Session persistence
- ✅ Rate limiting
- ✅ Logout functionality

### OTP Code Authentication (`otp-code.cy.ts`)

- ✅ Complete OTP flow
- ✅ Invalid code handling
- ✅ Code resend functionality
- ✅ Navigation between screens

## Writing New Tests

### Data Attributes

Add `data-cy` attributes to your components for reliable test selectors:

```vue
<TLoginForm data-cy="login-form">
  <TInput data-cy="email-input" />
  <TButton data-cy="submit-button">Send Magic Link</TButton>
</TLoginForm>
```

### Custom Commands

Available custom Cypress commands:

```typescript
// Create a unique test email
cy.createTestEmail()

// Login with magic link
cy.loginWithMagicLink('test@example.com')

// Wait for and get email
cy.waitForEmail('test@example.com')

// Extract magic link from email
cy.extractMagicLink(emailContent)
```

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run E2E Tests
  env:
    MAILOSAUR_API_KEY: ${{ secrets.MAILOSAUR_API_KEY }}
    MAILOSAUR_SERVER_ID: ${{ secrets.MAILOSAUR_SERVER_ID }}
  run: |
    pnpm serve &
    sleep 5
    pnpm test:e2e:auth
```

## Troubleshooting

### Tests timing out waiting for email

- Check Mailosaur credentials are correct
- Ensure the test email domain matches your Mailosaur server
- Check Supabase is configured to send emails

### Authentication not persisting

- Check localStorage is not being cleared
- Verify session tokens are valid
- Check for console errors in the browser

### Rate limiting errors

- Add delays between tests
- Use different email addresses for each test
- Clear Supabase rate limit cache if needed
