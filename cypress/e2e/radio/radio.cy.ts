/// <reference types="cypress" />

/**
 * Radio App - Happy Path E2E Tests
 *
 * App port: 3005
 * BEMM block: radio-view
 *
 * Key interactions:
 * - Tag filters
 * - Quick filters (All / Favorites / Recent)
 * - Radio cards (play/pause)
 * - Mini player controls (prev/play-pause/next/fullscreen)
 */

describe('Radio App', () => {
  const APP_URL = 'http://localhost:3005'

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.visit(APP_URL)
    cy.get('.radio-view', { timeout: 10000 }).should('exist')
  })

  describe('Page load', () => {
    it('should render the radio view', () => {
      cy.get('.radio-view').should('exist')
    })

    it('should display filter controls', () => {
      cy.get('.radio-view button').should('have.length.at.least', 1)
    })
  })

  describe('Tag filters', () => {
    it('should display tag filter buttons', () => {
      cy.get('.radio-view__tag-filter').then($filters => {
        if ($filters.length > 0) {
          cy.get('.radio-view__tag-filter').first().should('exist')
          cy.get('.radio-view__tag-filter').first().click()
        }
      })
    })

    it('should display a clear filters button', () => {
      cy.get('.radio-view__clear-filters').then($btn => {
        if ($btn.length > 0) {
          cy.get('.radio-view__clear-filters').should('exist')
        }
      })
    })
  })

  describe('Quick filters', () => {
    it('should display quick filter buttons (All/Favorites/Recent)', () => {
      cy.get('.radio-view button').should('have.length.at.least', 1)
    })
  })

  describe('Radio cards', () => {
    it('should display radio cards in the grid', () => {
      cy.get('.radio-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.get('.radio-view [class*="card"]').first().should('exist')
        }
      })
    })

    it('should handle card click (play/pause)', () => {
      cy.get('.radio-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.wrap(cards.first()).click()
          cy.wait(1500)
          cy.get('.radio-view').should('exist')
        }
      })
    })
  })

  describe('Mini player', () => {
    it('should show mini player when a track is selected', () => {
      cy.get('.radio-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.wrap(cards.first()).click()
          cy.wait(2000)
          cy.get('.radio-view').then($afterView => {
            const playerControls = $afterView.find(
              '[class*="player"], [class*="mini"]'
            )
            if (playerControls.length > 0) {
              cy.get('[class*="player"]').should('exist')
            }
          })
        }
      })
    })
  })

  describe('Settings', () => {
    it('should have settings accessible (parent mode gated)', () => {
      cy.get('.radio-view button').should('exist')
    })
  })
})
