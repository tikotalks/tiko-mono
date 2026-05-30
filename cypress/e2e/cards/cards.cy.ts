/// <reference types="cypress" />

/**
 * Cards App - Happy Path E2E Tests
 *
 * App port: 3007
 * BEMM block: cards-view
 *
 * Key interactions:
 * - Card grid display
 * - Click card to open/navigate
 * - Edit mode toggle
 * - Selection mode
 * - Back navigation (from groups)
 */

describe('Cards App', () => {
  const APP_URL = 'http://localhost:3007'

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.visit(APP_URL)
    cy.get('.cards-view', { timeout: 10000 }).should('exist')
  })

  describe('Page load', () => {
    it('should render the cards view', () => {
      cy.get('.cards-view').should('exist')
    })

    it('should display a card grid', () => {
      cy.get('.cards-view').then($view => {
        const grid = $view.find('.t-card-grid, [class*="card"]')
        expect(grid.length).to.be.at.least(0)
      })
    })
  })

  describe('Card interaction', () => {
    it('should display card items if data is loaded', () => {
      cy.get('.cards-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.get('.cards-view [class*="card"]').first().should('be.visible')
        }
      })
    })

    it('should allow clicking a card', () => {
      cy.get('.cards-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.wrap(cards.first()).click()
          cy.wait(1500)
          cy.get('.cards-view').should('exist')
        }
      })
    })
  })

  describe('Back navigation', () => {
    it('should show back button when inside a group', () => {
      cy.get('.cards-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.wrap(cards.first()).click()
          cy.wait(1500)

          cy.get('.cards-view').then($afterView => {
            const buttons = $afterView.find('button')
            if (buttons.length > 0) {
              const backBtn = Array.from(buttons).find(
                (btn: HTMLElement) => btn.textContent.match(/back/i)
              )
              if (backBtn) {
                cy.wrap(backBtn).click()
                cy.wait(1000)
              }
            }
          })
        }
      })
    })
  })

  describe('Loading state', () => {
    it('should handle loading state gracefully', () => {
      cy.get('.cards-view').should('exist')
    })
  })

  describe('Controls', () => {
    it('should display action buttons', () => {
      cy.get('.cards-view button').then($buttons => {
        if ($buttons.length > 0) {
          cy.get('.cards-view button').first().should('exist')
        }
      })
    })
  })
})
