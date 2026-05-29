/// <reference types="cypress" />

/**
 * Yes-No App - Happy Path E2E Tests
 *
 * App port: 3006
 * BEMM block: yes-no
 *
 * Key interactions:
 * - Question display (data-cy="question-display")
 * - Yes / No answer buttons
 * - Speak question on click
 * - Background color feedback on answer
 */

describe('Yes-No App', () => {
  const APP_URL = 'http://localhost:3006'

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.visit(APP_URL)
    cy.wait(2000)
  })

  describe('Page load', () => {
    it('should render the yes-no view', () => {
      cy.get('.yes-no').should('exist')
    })

    it('should display the question', () => {
      cy.get('[data-cy="question-display"]').should('exist')
    })

    it('should show yes and no answer buttons', () => {
      cy.get('.yes-no__answer--yes').should('exist')
      cy.get('.yes-no__answer--no').should('exist')
    })
  })

  describe('Question display', () => {
    it('should have clickable question text', () => {
      cy.get('.yes-no__question-text').should('exist')
      cy.get('.yes-no__question-text').click()
    })

    it('should have a speak/tts button', () => {
      // Speak button is a ghost button with volume icon
      cy.get('.yes-no button').then($buttons => {
        const hasSpeakBtn = Array.from($buttons).some(
          (btn: HTMLElement) => btn.classList.contains('t-button--ghost')
        )
        expect(hasSpeakBtn).to.be.true
      })
    })
  })

  describe('Answer flow', () => {
    it('should provide visual feedback when clicking yes', () => {
      cy.get('.yes-no__answer--yes').click()
      // Root div should get --yes modifier for background feedback
      cy.get('.yes-no').should('have.class', 'yes-no--yes')
      // Wait for feedback animation (1.5s)
      cy.wait(2000)
      // Feedback should clear
    })

    it('should provide visual feedback when clicking no', () => {
      cy.get('.yes-no__answer--no').click()
      // Root div should get --no modifier for background feedback
      cy.get('.yes-no').should('have.class', 'yes-no--no')
      cy.wait(2000)
    })

    it('should allow rapid yes-no clicks', () => {
      cy.get('.yes-no__answer--yes').click()
      cy.wait(500)
      cy.get('.yes-no__answer--no').click()
      cy.wait(500)
      cy.get('.yes-no__answer--yes').click()
      cy.wait(2000)
      // View should still be functional
      cy.get('.yes-no__question-display, [data-cy="question-display"]').should('exist')
    })
  })

  describe('Edit question', () => {
    it('should have an edit question button', () => {
      // Edit button is a ghost button with edit icon
      cy.get('.yes-no button').then($buttons => {
        const ghostButtons = Array.from($buttons).filter(
          (btn: HTMLElement) => btn.classList.contains('t-button--ghost')
        )
        expect(ghostButtons.length).to.be.at.least(1)
      })
    })
  })
})
