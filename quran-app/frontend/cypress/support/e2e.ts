import './commands'

// Global configuration
cy.on('uncaught:exception', (err, runnable) => {
  // Prevent failing tests on uncaught exceptions
  console.log('Uncaught exception:', err.message)
  return false
})

// Set viewport for mobile testing
Cypress.Commands.add('mobileView', () => {
  cy.viewport('iphone-x')
})

Cypress.Commands.add('desktopView', () => {
  cy.viewport('macbook-13')
})

// Wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.intercept('GET', '**/_next/static/**').as('staticAssets')
  cy.wait('@staticAssets')
})
