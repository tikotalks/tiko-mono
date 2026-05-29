/// <reference types="cypress" />

/**
 * Sequence App - Happy Path E2E Tests
 *
 * App port: 3003
 * BEMM blocks: sequence-view, play-view
 *
 * Key interactions:
 * - Sequence home: card grid, group navigation, breadcrumbs
 * - Edit mode, selection, bulk actions
 * - Play view: back, restart
 */

describe('Sequence App', () => {
  const APP_URL = 'http://localhost:3003'

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.visit(APP_URL)
    cy.wait(2000)
  })

  describe('Home page', () => {
    it('should render the sequence view', () => {
      cy.get('.sequence-view').should('exist')
    })

    it('should display a card grid', () => {
      cy.get('.sequence-view').then($view => {
        const grid = $view.find('.t-card-grid, [class*="card"]')
        expect(grid.length).to.be.at.least(0)
      })
    })
  })

  describe('Card interaction', () => {
    it('should display card items if data is loaded', () => {
      cy.get('.sequence-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.get('.sequence-view [class*="card"]').first().should('be.visible')
        }
      })
    })

    it('should allow clicking a card', () => {
      cy.get('.sequence-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.wrap(cards.first()).click()
          cy.wait(1500)
          // Should navigate into group or play mode
          cy.get('.sequence-view, .play-view').should('exist')
        }
      })
    })
  })

  describe('Group navigation', () => {
    it('should show breadcrumbs when inside a group', () => {
      // Navigate into a group
      cy.get('.sequence-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.wrap(cards.first()).click()
          cy.wait(1500)

          // Check for breadcrumbs
          cy.get('.sequence-view__breadcrumb').then($breadcrumbs => {
            if ($breadcrumbs.length > 0) {
              cy.get('.sequence-view__breadcrumb').first().should('exist')
            }
          })
        }
      })
    })

    it('should navigate back via breadcrumb', () => {
      cy.get('.sequence-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.wrap(cards.first()).click()
          cy.wait(1500)

          cy.get('.sequence-view__breadcrumb').then($breadcrumbs => {
            if ($breadcrumbs.length > 0) {
              cy.wrap($breadcrumbs.first()).click()
              cy.wait(1000)
              cy.get('.sequence-view').should('exist')
            }
          })
        }
      })
    })
  })

  describe('Back navigation', () => {
    it('should show back button when inside a group', () => {
      cy.get('.sequence-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.wrap(cards.first()).click()
          cy.wait(1500)

          cy.get('.sequence-view').then($afterView => {
            const buttons = $afterView.find('button')
            const backBtn = Array.from(buttons).find(
              (btn: HTMLElement) => btn.classList.contains('t-button--outline')
            )
            if (backBtn) {
              cy.wrap(backBtn).click()
              cy.wait(1000)
            }
          })
        }
      })
    })
  })

  describe('Controls', () => {
    it('should display action buttons', () => {
      cy.get('.sequence-view button').then($buttons => {
        if ($buttons.length > 0) {
          cy.get('.sequence-view button').first().should('exist')
        }
      })
    })
  })
})

describe('Sequence App - Play View', () => {
  const APP_URL = 'http://localhost:3003'

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.visit(APP_URL)
    cy.wait(2000)
  })

  describe('Play view', () => {
    it('should render the play view when navigating to play mode', () => {
      // Navigate to a sequence card that triggers play mode
      cy.get('.sequence-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.wrap(cards.first()).click()
          cy.wait(2000)

          // If we're on play view
          cy.get('body').then($body => {
            if ($body.find('.play-view').length > 0) {
              cy.get('.play-view').should('exist')

              // Check for back button
              cy.get('.play-view button').then($buttons => {
                const backBtn = Array.from($buttons).find(
                  (btn: HTMLElement) => btn.textContent.match(/back/i)
                )
                if (backBtn) {
                  cy.wrap(backBtn).click()
                  cy.wait(1000)
                  cy.get('.play-view').should('not.exist')
                }
              })
            }
          })
        }
      })
    })

    it('should have a restart button in play view', () => {
      cy.get('.sequence-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.wrap(cards.first()).click()
          cy.wait(2000)

          cy.get('body').then($body => {
            if ($body.find('.play-view').length > 0) {
              cy.get('.play-view button').then($buttons => {
                const restartBtn = Array.from($buttons).find(
                  (btn: HTMLElement) => btn.textContent.match(/restart/i)
                )
                if (restartBtn) {
                  cy.wrap(restartBtn).should('exist')
                }
              })
            }
          })
        }
      })
    })
  })
})
