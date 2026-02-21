/// <reference types="cypress" />

// Custom commands for Quran App

// Make this a module so 'declare global' works
export {}

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-testid attribute
       */
      getByTestId(testId: string): Chainable<Element>
      
      /**
       * Custom command to play a specific verse
       */
      playVerse(verseNumber: number): Chainable<void>
      
      /**
       * Custom command to wait for API response
       */
      waitForApi(endpoint: string): Chainable<any>
    }
  }
}

Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`)
})

Cypress.Commands.add('playVerse', (verseNumber: number) => {
  cy.getByTestId(`verse-${verseNumber}`).find('[data-testid="play-button"]').click()
})

Cypress.Commands.add('waitForApi', (endpoint: string) => {
  return cy.intercept(`**/api/quran/${endpoint}`).as('apiCall')
})
