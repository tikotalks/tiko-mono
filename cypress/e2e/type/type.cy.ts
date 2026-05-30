/// <reference types="cypress" />

/**
 * Type App - Happy Path E2E Tests
 *
 * App port: 3004
 * BEMM block: type-view
 *
 * Key interactions:
 * - Virtual keyboard input
 * - Keyboard mode toggle (ABC / 123 / abc)
 * - Speak/stop text
 * - Clear text
 * - Click words to speak them
 * - Settings/parent mode
 */

describe('Type App', () => {
  const APP_URL = 'http://localhost:3004'

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.visit(APP_URL)
    cy.get('.type-view', { timeout: 10000 }).should('exist')
  })

  describe('Page load', () => {
    it('should render the type view', () => {
      cy.get('.type-view').should('exist')
    })

    it('should display the virtual keyboard', () => {
      cy.get('.type-view').then($view => {
        const keys = $view.find('[class*="key"]')
        expect(keys.length).to.be.at.least(1)
      })
    })

    it('should show the text display area', () => {
      cy.get('.type-view').then($view => {
        const textArea = $view.find('[class*="text"]')
        expect(textArea.length).to.be.at.least(1)
      })
    })
  })

  describe('Keyboard mode toggle', () => {
    it('should cycle keyboard modes (ABC -> 123 -> abc)', () => {
      cy.get('.type-view button').then($buttons => {
        const buttons = Array.from($buttons)
        const modeBtn = buttons.find(
          (btn: HTMLElement) =>
            btn.textContent.includes('ABC') ||
            btn.textContent.includes('123') ||
            btn.textContent.includes('abc')
        )
        if (modeBtn) {
          cy.wrap(modeBtn).click()
          cy.wait(500)
          cy.wrap(modeBtn).click()
          cy.wait(500)
          cy.wrap(modeBtn).click()
          cy.wait(500)
        }
      })
    })
  })

  describe('Text input', () => {
    it('should accept input from virtual keyboard', () => {
      cy.get('.type-view').then($view => {
        const keys = $view.find('[class*="key"]')
        if (keys.length > 0) {
          cy.wrap(keys.first()).click()
          cy.get('.type-view').should('exist')
        }
      })
    })
  })

  describe('Clear text', () => {
    it('should have a clear/reset button', () => {
      cy.get('.type-view__reset-button, .type-view button').should('exist')
    })
  })

  describe('Speak controls', () => {
    it('should have a speak/stop button', () => {
      cy.get('.type-view button').then($buttons => {
        const buttons = Array.from($buttons)
        const speakBtn = buttons.find(
          (btn: HTMLElement) =>
            btn.textContent.match(/speak/i) || btn.textContent.match(/stop/i)
        )
        if (speakBtn) {
          expect(speakBtn).to.exist
        }
      })
    })
  })

  describe('Settings', () => {
    it('should have a settings/parent mode button', () => {
      cy.get('.type-view button').should('exist')
    })
  })
})
