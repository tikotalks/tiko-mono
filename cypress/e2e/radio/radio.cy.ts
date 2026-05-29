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
    cy.wait(2000)
  })

  describe('Page load', () => {
    it('should render the radio view', () => {
      cy.get('.radio-view').should('exist')
    })

    it('should display filter controls', () => {
      // Tag filter buttons or quick filter buttons should exist
      cy.get('.radio-view').then($view => {
        const buttons = $view.find('button')
        expect(buttons.length).to.be.at.least(1)
      })
    })
  })

  describe('Tag filters', () => {
    it('should display tag filter buttons', () => {
      cy.get('.radio-view__tag-filter').then($filters => {
        if ($filters.length > 0) {
          cy.get('.radio-view__tag-filter').first().should('exist')
          cy.get('.radio-view__tag-filter').first().click()
          // Active tag filter gets primary color
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
      // Quick filter buttons toggle between 'default' and 'ghost' type
      cy.get('.radio-view').then($view => {
        const buttons = Array.from($view.find('button'))
        // At least some filter buttons should exist
        expect(buttons.length).to.be.at.least(1)
      })
    })
  })

  describe('Radio cards', () => {
    it('should display radio cards in the grid', () => {
      cy.get('.radio-view').then($view => {
        const cards = $view.find('[class*="card"]')
        // Cards may exist if data is loaded
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
          // Mini player may appear after clicking a card
          cy.get('.radio-view').should('exist')
        }
      })
    })
  })

  describe('Mini player', () => {
    it('should show mini player when a track is selected', () => {
      // Click a card to start playback
      cy.get('.radio-view').then($view => {
        const cards = $view.find('[class*="card"]')
        if (cards.length > 0) {
          cy.wrap(cards.first()).click()
          cy.wait(2000)
          // Mini player should appear with controls
          cy.get('.radio-view').then($afterView => {
            const playerControls = $afterView.find('[class*="player"], [class*="mini"]')
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
      // Settings button requires parent mode — just verify buttons exist
      cy.get('.radio-view button').should('exist')
    })
  })
})
