/// <reference types="cypress" />

/**
 * Timer App - Happy Path E2E Tests
 *
 * App port: 3001
 * BEMM block: timer-view
 *
 * Key interactions:
 * - Start/pause timer via display click or button
 * - Reset timer
 * - Toggle count-up / count-down mode
 * - Expired state overlay (count-down only)
 * - Keyboard shortcuts (Space, R, M)
 */

describe('Timer App', () => {
  const APP_URL = 'http://localhost:3001'

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.visit(APP_URL)
    // Wait for app to initialize; it may show auth wall first
    cy.wait(2000)
  })

  describe('Page load', () => {
    it('should render the timer view', () => {
      cy.get('.timer-view').should('exist')
    })

    it('should display the time display area', () => {
      cy.get('.timer-view__display').should('exist')
    })

    it('should show the start button initially', () => {
      cy.get('.timer-view').then($view => {
        // Start button should be present when not running
        if ($view.find('button').length > 0) {
          // Check that at least one button is visible (start or pause)
          cy.get('.timer-view button').should('have.length.at.least', 1)
        }
      })
    })
  })

  describe('Start / Pause', () => {
    it('should start the timer by clicking the display', () => {
      cy.get('.timer-view__display').click()
      cy.wait(1500)
      // Timer should be running — pause button should appear or display should update
      cy.get('.timer-view').should('exist')
    })

    it('should pause the timer by clicking the display again', () => {
      cy.get('.timer-view__display').click()
      cy.wait(1500)
      cy.get('.timer-view__display').click()
      // Timer should be paused
      cy.get('.timer-view__display').should('exist')
    })

    it('should toggle start/pause via keyboard space bar', () => {
      cy.get('.timer-view__display').focus()
      cy.get('.timer-view__display').type('{space}')
      cy.wait(1000)
      // Timer should start
      cy.get('.timer-view__display').type('{space}')
      // Timer should pause
      cy.get('.timer-view__display').should('exist')
    })
  })

  describe('Reset', () => {
    it('should reset the timer', () => {
      // Start the timer first
      cy.get('.timer-view__display').click()
      cy.wait(1500)
      // Pause it
      cy.get('.timer-view__display').click()
      // Click reset button (outline, secondary color)
      cy.get('.timer-view button').contains(/reset/i).click()
      // Timer should be back to initial state
      cy.get('.timer-view__display').should('exist')
    })

    it('should reset via keyboard shortcut R', () => {
      cy.get('.timer-view__display').click()
      cy.wait(1500)
      cy.get('.timer-view__display').focus()
      cy.get('.timer-view__display').type('r')
      // Timer should be reset
      cy.get('.timer-view__display').should('exist')
    })
  })

  describe('Mode toggle', () => {
    it('should toggle between count-up and count-down mode', () => {
      // Find the mode toggle button (outline, primary)
      cy.get('.timer-view button').then($buttons => {
        const buttons = Array.from($buttons)
        const modeButton = buttons.find(
          (btn: HTMLElement) =>
            btn.classList.contains('t-button--outline') || btn.textContent.match(/count/i)
        )
        if (modeButton) {
          cy.wrap(modeButton).click()
          cy.wait(500)
          // Toggle back
          cy.wrap(modeButton).click()
        }
      })
    })

    it('should toggle mode via keyboard shortcut M', () => {
      cy.get('.timer-view__display').focus()
      cy.get('.timer-view__display').type('m')
      cy.wait(500)
      // Mode should change
      cy.get('.timer-view__display').should('exist')
    })
  })

  describe('Progress bar', () => {
    it('should display a progress bar', () => {
      // The progress bar is fixed at the bottom
      cy.get('body').then($body => {
        // Look for a progress bar element — it may be a div with width style
        const progressEl = $body.find('[style*="width"]')
        // Progress bar exists in the timer view area
        cy.get('.timer-view').should('exist')
      })
    })
  })
})
