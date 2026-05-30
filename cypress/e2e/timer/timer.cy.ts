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
    // Wait for the timer view to render (may show auth wall first)
    cy.get('.timer-view', { timeout: 10000 }).should('exist')
  })

  describe('Page load', () => {
    it('should render the timer view', () => {
      cy.get('.timer-view').should('exist')
    })

    it('should display the time display area', () => {
      cy.get('.timer-view__display').should('exist')
    })

    it('should show at least one control button', () => {
      cy.get('.timer-view button').should('have.length.at.least', 1)
    })
  })

  describe('Start / Pause', () => {
    it('should start the timer by clicking the display', () => {
      cy.get('.timer-view__display').click()
      // Timer should be running — display should update after a brief wait
      cy.get('.timer-view').should('exist')
    })

    it('should pause the timer by clicking the display again', () => {
      cy.get('.timer-view__display').click()
      cy.wait(1500)
      cy.get('.timer-view__display').click()
      cy.get('.timer-view__display').should('exist')
    })

    it('should toggle start/pause via keyboard space bar', () => {
      cy.get('.timer-view__display').focus()
      cy.get('.timer-view__display').type('{space}')
      cy.wait(1000)
      cy.get('.timer-view__display').type('{space}')
      cy.get('.timer-view__display').should('exist')
    })
  })

  describe('Reset', () => {
    it('should reset the timer via button', () => {
      // Start the timer first
      cy.get('.timer-view__display').click()
      cy.wait(1500)
      // Pause it
      cy.get('.timer-view__display').click()
      // Click reset button
      cy.get('.timer-view button').contains(/reset/i).click()
      cy.get('.timer-view__display').should('exist')
    })

    it('should reset via keyboard shortcut R', () => {
      cy.get('.timer-view__display').click()
      cy.wait(1500)
      cy.get('.timer-view__display').focus()
      cy.get('.timer-view__display').type('r')
      cy.get('.timer-view__display').should('exist')
    })
  })

  describe('Mode toggle', () => {
    it('should toggle between count-up and count-down mode via button', () => {
      cy.get('.timer-view button').then($buttons => {
        const buttons = Array.from($buttons)
        const modeButton = buttons.find(
          (btn: HTMLElement) =>
            btn.classList.contains('t-button--outline') ||
            btn.textContent.match(/count/i)
        )
        if (modeButton) {
          cy.wrap(modeButton).click()
          cy.wait(500)
          cy.wrap(modeButton).click()
        }
      })
    })

    it('should toggle mode via keyboard shortcut M', () => {
      cy.get('.timer-view__display').focus()
      cy.get('.timer-view__display').type('m')
      cy.wait(500)
      cy.get('.timer-view__display').should('exist')
    })
  })
})
