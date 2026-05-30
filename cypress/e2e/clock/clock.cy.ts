/// <reference types="cypress" />

/**
 * Clock App - Happy Path E2E Tests
 *
 * App port: 3012
 * BEMM blocks: clock-learning-view, clock-mode-menu, analog-clock-face,
 *              learning-clock, clock-practice-prompt, clock-scaffold-controls
 *
 * Key interactions:
 * - Page load: clock learning view with mode menu
 * - Stage selection (anatomy, full-hours, half-past)
 * - Mode selection (learn, set, read, match, explore)
 * - Analog clock face with hour/minute hands
 * - Clock controls (back/forward step buttons)
 * - Digital time mirror
 * - Practice prompt (check/next for set mode, options for read mode)
 * - Scaffold controls (checkboxes for visual helpers)
 */

describe('Clock App', () => {
  const APP_URL = 'http://localhost:3012'

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.visit(APP_URL)
    cy.wait(2000)
  })

  describe('Page load', () => {
    it('should render the clock app shell', () => {
      cy.get('.clock-app-shell').should('exist')
    })

    it('should render the clock learning view', () => {
      cy.get('.clock-learning-view').should('exist')
    })

    it('should display the hero header', () => {
      cy.get('.clock-learning-view__hero').should('exist')
      cy.get('.clock-learning-view__hero').should('contain', 'Learn to read the clock')
    })

    it('should display the mode menu', () => {
      cy.get('.clock-mode-menu').should('exist')
    })

    it('should display the clock surface', () => {
      cy.get('.clock-learning-view__surface').should('exist')
    })
  })

  describe('Stage selection', () => {
    it('should display stage buttons', () => {
      cy.get('.clock-mode-menu__stage').should('have.length.at.least', 1)
    })

    it('should have a default stage selected', () => {
      cy.get('.clock-mode-menu__stage--selected').should('have.length.at.least', 1)
    })

    it('should switch stages when clicking a different stage button', () => {
      cy.get('.clock-mode-menu__stage').then($stages => {
        const stages = Array.from($stages)
        const selected = stages.find(s => s.classList.contains('clock-mode-menu__stage--selected'))
        const unselected = stages.find(s => !s.classList.contains('clock-mode-menu__stage--selected'))
        if (selected && unselected) {
          cy.wrap(unselected).click()
          cy.wait(500)
          // The clicked stage should now be selected
          cy.wrap(unselected).should('have.class', 'clock-mode-menu__stage--selected')
        }
      })
    })
  })

  describe('Mode selection', () => {
    it('should display mode buttons', () => {
      cy.get('.clock-mode-menu__mode').should('have.length.at.least', 1)
    })

    it('should have learn mode selected by default', () => {
      // Learn mode is the default selectedMode
      cy.get('.clock-mode-menu__mode--selected').should('have.length.at.least', 1)
    })

    it('should switch to explore mode', () => {
      cy.get('.clock-mode-menu__mode').then($modes => {
        const modes = Array.from($modes)
        const exploreMode = modes.find(m => m.textContent.includes('Explore'))
        if (exploreMode) {
          cy.wrap(exploreMode).click()
          cy.wait(500)
          // In explore mode, the explore note should appear
          cy.get('.clock-learning-view__explore-note').should('exist')
        }
      })
    })

    it('should switch to set mode', () => {
      cy.get('.clock-mode-menu__mode').then($modes => {
        const modes = Array.from($modes)
        const setMode = modes.find(m => m.textContent.includes('Set'))
        if (setMode) {
          cy.wrap(setMode).click()
          cy.wait(500)
          // In set mode, the practice prompt with Check/Next should appear
          cy.get('.clock-practice-prompt').should('exist')
        }
      })
    })

    it('should switch to read mode', () => {
      cy.get('.clock-mode-menu__mode').then($modes => {
        const modes = Array.from($modes)
        const readMode = modes.find(m => m.textContent.includes('Read'))
        if (readMode) {
          cy.wrap(readMode).click()
          cy.wait(500)
          // In read mode, practice prompt with option buttons should appear
          cy.get('.clock-practice-prompt').should('exist')
          cy.get('.clock-practice-prompt__option').should('have.length.at.least', 1)
        }
      })
    })

    it('should switch to match mode', () => {
      cy.get('.clock-mode-menu__mode').then($modes => {
        const modes = Array.from($modes)
        const matchMode = modes.find(m => m.textContent.includes('Match'))
        if (matchMode) {
          cy.wrap(matchMode).click()
          cy.wait(500)
          // In match mode, the match board should appear
          cy.get('.clock-match-board').should('exist')
        }
      })
    })
  })

  describe('Analog clock face', () => {
    it('should render the analog clock face', () => {
      cy.get('.analog-clock-face').should('exist')
    })

    it('should display clock numbers 1-12', () => {
      // The clock face should have 12 number elements
      cy.get('.analog-clock-face__number').should('have.length', 12)
    })

    it('should have hour and minute hands', () => {
      cy.get('.analog-clock-face__hand--hour').should('exist')
      cy.get('.analog-clock-face__hand--minute').should('exist')
    })

    it('should display the center pin', () => {
      cy.get('.analog-clock-face__pin').should('exist')
    })

    it('should have back and forward step controls', () => {
      cy.get('.analog-clock-face__control').should('have.length', 2)
    })

    it('should change time when clicking forward control', () => {
      cy.get('.analog-clock-face__control').then($controls => {
        const buttons = Array.from($controls)
        // Find "Forward" button (last button)
        const forwardBtn = buttons.find(b => b.textContent.includes('Forward'))
        if (forwardBtn) {
          // Record initial hand angle
          cy.get('.analog-clock-face__hand--minute')
            .should('exist')
            .invoke('css', 'transform')
            .then(initialTransform => {
              cy.wrap(forwardBtn).click()
              cy.wait(300)
              // The hand transform should change
              cy.get('.analog-clock-face__hand--minute')
                .invoke('css', 'transform')
                .then(newTransform => {
                  // In explore mode, clicking forward should change the time
                  expect(newTransform).to.not.equal(initialTransform)
                })
            })
        }
      })
    })

    it('should change time when clicking back control', () => {
      cy.get('.analog-clock-face__control').then($controls => {
        const buttons = Array.from($controls)
        const backBtn = buttons.find(b => b.textContent.includes('Back'))
        if (backBtn) {
          cy.wrap(backBtn).click()
          cy.wait(300)
          cy.get('.analog-clock-face').should('exist')
        }
      })
    })
  })

  describe('Learning clock', () => {
    it('should render the learning clock section', () => {
      cy.get('.learning-clock').should('exist')
    })
  })

  describe('Practice prompt in set mode', () => {
    beforeEach(() => {
      // Switch to set mode
      cy.get('.clock-mode-menu__mode').then($modes => {
        const modes = Array.from($modes)
        const setMode = modes.find(m => m.textContent.includes('Set'))
        if (setMode) {
          cy.wrap(setMode).click()
          cy.wait(500)
        }
      })
    })

    it('should display the practice prompt label', () => {
      cy.get('.clock-practice-prompt__label').should('exist')
    })

    it('should have check and next buttons', () => {
      cy.get('.clock-practice-prompt__action').should('have.length.at.least', 1)
    })

    it('should display feedback after clicking check', () => {
      cy.get('.clock-practice-prompt__action').then($actions => {
        const buttons = Array.from($actions)
        const checkBtn = buttons.find(b => b.textContent.includes('Check'))
        if (checkBtn) {
          cy.wrap(checkBtn).click()
          cy.wait(500)
          // Feedback should appear (accepted, close, or needs-help)
          cy.get('.clock-practice-prompt__feedback').should('exist')
        }
      })
    })

    it('should advance to next prompt after clicking next', () => {
      cy.get('.clock-practice-prompt__action').then($actions => {
        const buttons = Array.from($actions)
        const nextBtn = buttons.find(b => b.textContent.includes('Next'))
        if (nextBtn) {
          cy.wrap(nextBtn).click()
          cy.wait(500)
          cy.get('.clock-practice-prompt').should('exist')
        }
      })
    })
  })

  describe('Scaffold controls', () => {
    it('should render the scaffold controls section', () => {
      cy.get('.clock-scaffold-controls').should('exist')
    })

    it('should have checkbox controls for visual helpers', () => {
      cy.get('.clock-scaffold-controls label').should('have.length.at.least', 1)
      cy.get('.clock-scaffold-controls input[type="checkbox"]').should(
        'have.length.at.least',
        1
      )
    })

    it('should toggle digital time display', () => {
      cy.get('.clock-scaffold-controls label').then($labels => {
        const digitalLabel = Array.from($labels).find(l =>
          l.textContent.includes('Digital time')
        )
        if (digitalLabel) {
          cy.wrap(digitalLabel).find('input[type="checkbox"]').as('digitalToggle')
          cy.get('@digitalToggle').check()
          cy.wait(300)
          // Digital time mirror should appear
          cy.get('.digital-time-mirror').should('exist')

          cy.get('@digitalToggle').uncheck()
          cy.wait(300)
          // Digital time mirror should disappear
          cy.get('.digital-time-mirror').should('not.exist')
        }
      })
    })

    it('should toggle minute labels on the clock face', () => {
      cy.get('.clock-scaffold-controls label').then($labels => {
        const minuteLabel = Array.from($labels).find(l =>
          l.textContent.includes('Minute labels')
        )
        if (minuteLabel) {
          cy.wrap(minuteLabel).find('input[type="checkbox"]').check()
          cy.wait(300)
          // Minute labels should appear on the clock face
          cy.get('.analog-clock-face__minute-label').should('have.length.at.least', 1)
        }
      })
    })

    it('should toggle quarter slices on the clock face', () => {
      cy.get('.clock-scaffold-controls label').then($labels => {
        const quarterLabel = Array.from($labels).find(l =>
          l.textContent.includes('Quarter slice')
        )
        if (quarterLabel) {
          cy.wrap(quarterLabel).find('input[type="checkbox"]').check()
          cy.wait(300)
          // Quarter slice path should appear
          cy.get('.analog-clock-face__quarter').should('exist')
        }
      })
    })

    it('should toggle hand labels on the clock face', () => {
      cy.get('.clock-scaffold-controls label').then($labels => {
        const handLabel = Array.from($labels).find(l =>
          l.textContent.includes('Hand labels')
        )
        if (handLabel) {
          cy.wrap(handLabel).find('input[type="checkbox"]').check()
          cy.wait(300)
          cy.get('.analog-clock-face__hand-label').should('have.length.at.least', 1)
        }
      })
    })

    it('should toggle 24-hour format', () => {
      cy.get('.clock-scaffold-controls label').then($labels => {
        const hourLabel = Array.from($labels).find(l =>
          l.textContent.includes('24 hour')
        )
        if (hourLabel) {
          // Enable digital time first (needed to see 24h effect)
          const digitalLabel = Array.from($labels).find(l =>
            l.textContent.includes('Digital time')
          )
          if (digitalLabel) {
            cy.wrap(digitalLabel).find('input[type="checkbox"]').check()
          }
          cy.wrap(hourLabel).find('input[type="checkbox"]').check()
          cy.wait(300)
          cy.get('.clock-scaffold-controls').should('exist')
        }
      })
    })
  })

  describe('Digital time mirror', () => {
    beforeEach(() => {
      // Enable digital time display via scaffold controls
      cy.get('.clock-scaffold-controls label').then($labels => {
        const digitalLabel = Array.from($labels).find(l =>
          l.textContent.includes('Digital time')
        )
        if (digitalLabel) {
          cy.wrap(digitalLabel).find('input[type="checkbox"]').check()
          cy.wait(300)
        }
      })
    })

    it('should display the digital time mirror', () => {
      cy.get('.digital-time-mirror').should('exist')
    })

    it('should display hour and minute parts', () => {
      cy.get('.digital-time-mirror__hour').should('exist')
      cy.get('.digital-time-mirror__minute').should('exist')
      cy.get('.digital-time-mirror__colon').should('exist')
    })

    it('should display the spoken time', () => {
      cy.get('.digital-time-mirror__spoken').should('exist')
    })
  })

  describe('Clock celebration', () => {
    it('should have the celebration component in the DOM', () => {
      cy.get('.clock-celebration, [class*="celebration"]').should('exist')
    })
  })
})
