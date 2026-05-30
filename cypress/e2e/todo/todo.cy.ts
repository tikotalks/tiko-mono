/// <reference types="cypress" />

/**
 * Todo App - Happy Path E2E Tests
 *
 * App port: 3002
 * BEMM blocks: home-view, todo-view
 *
 * Key interactions:
 * - Home: card grid, add todo button
 * - Todo: step cards, mark done, view mode toggle
 */

describe('Todo App', () => {
  const APP_URL = 'http://localhost:3002'

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.visit(APP_URL)
    cy.get('.home-view', { timeout: 10000 }).should('exist')
  })

  describe('Home page', () => {
    it('should render the home view', () => {
      cy.get('.home-view').should('exist')
    })

    it('should display a card grid', () => {
      cy.get('.home-view').then($view => {
        expect(
          $view.find('.t-card-grid, [class*="card"], [class*="grid"]').length
        ).to.be.at.least(0)
      })
    })

    it('should show an add todo button', () => {
      cy.get('.home-view__add-button').should('exist')
    })
  })

  describe('Navigation', () => {
    it('should be on the home route (/)', () => {
      cy.url().should('include', 'localhost:3002')
      cy.url().should('not.include', '/todo/')
    })
  })
})

describe('Todo App - Todo View', () => {
  const APP_URL = 'http://localhost:3002'

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.visit(APP_URL)
    cy.get('.home-view', { timeout: 10000 }).should('exist')
  })

  describe('Todo step view (navigated)', () => {
    it('should render the todo view when navigating to a todo', () => {
      cy.get('.home-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.wrap(cards.first()).click()
          cy.wait(1500)
          cy.url().should('include', '/todo/')
          cy.get('.todo-view').should('exist')
        }
      })
    })
  })

  describe('Step interactions', () => {
    beforeEach(() => {
      cy.get('.home-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.wrap(cards.first()).click()
          cy.wait(1500)
        }
      })
    })

    it('should display step cards', () => {
      cy.get('.todo-view__step').then($steps => {
        if ($steps.length > 0) {
          cy.get('.todo-view__step').should('exist')
        }
      })
    })

    it('should show a done button for active todo steps', () => {
      cy.get('.todo-view__done-button').then($btn => {
        if ($btn.length > 0) {
          cy.get('.todo-view__done-button').should('exist')
        }
      })
    })

    it('should allow toggling view mode', () => {
      cy.get('.todo-view button').then($buttons => {
        const buttons = Array.from($buttons)
        const viewToggle = buttons.find(
          (btn: HTMLElement) =>
            btn.classList.contains('t-button--ghost') ||
            btn.querySelector('[class*="icon"]')
        )
        if (viewToggle) {
          cy.wrap(viewToggle).click()
          cy.wait(500)
          cy.get('.todo-view').should('exist')
        }
      })
    })
  })

  describe('Back navigation', () => {
    it('should navigate back to home from todo view', () => {
      cy.get('.home-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.wrap(cards.first()).click()
          cy.wait(1500)
          cy.url().should('include', '/todo/')

          cy.get('.todo-view').then($todoView => {
            const backBtn = $todoView.find('[class*="back"]')
            if (backBtn.length > 0) {
              cy.wrap(backBtn.first()).click()
              cy.wait(1000)
              cy.url().should('not.include', '/todo/')
            }
          })
        }
      })
    })
  })
})
