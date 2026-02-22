describe('Homepage', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display the homepage', () => {
    cy.contains('Quran App')
    cy.contains('Read, Listen & Reflect')
  })

  it('should display all 114 surahs', () => {
    cy.get('[data-testid="surah-card"]').should('have.length', 114)
  })

  it('should navigate to surah detail page', () => {
    cy.get('[data-testid="surah-card"]').first().click()
    cy.url().should('include', '/surah/1')
    cy.contains('Al-Fatihah')
  })

  it('should have working search', () => {
    cy.get('input[type="search"]').type('Merciful')
    cy.contains('Ar-Rahman')
  })

  it('should toggle dark mode', () => {
    cy.get('[data-testid="theme-toggle"]').click()
    cy.get('html').should('have.class', 'dark')
  })

  it('should toggle sepia mode', () => {
    cy.get('[data-testid="theme-toggle"]').click()
    cy.get('html').should('have.class', 'sepia')
  })

  it('should change language', () => {
    cy.get('[data-testid="language-selector"]').click()
    cy.contains('Français').click()
    cy.contains('Lire, Écouter & Réfléchir')
  })

  it('should have working font size controls', () => {
    cy.get('[data-testid="font-size-decrease"]').click()
    cy.get('[data-testid="font-size-display"]').should('not.contain', '16px')
  })

  it('should be responsive on mobile', () => {
    cy.viewport('iphone-x')
    cy.get('[data-testid="surah-card"]').should('be.visible')
    cy.get('[data-testid="navbar-toggle"]').should('be.visible')
  })

  it('should show loading state initially', () => {
    cy.intercept('GET', '**/api/quran/surahs').as('getSurahs')
    cy.reload()
    cy.get('[data-testid="loading-spinner"]').should('be.visible')
    cy.wait('@getSurahs')
    cy.get('[data-testid="loading-spinner"]').should('not.exist')
  })

  it('should handle API errors gracefully', () => {
    cy.intercept('GET', '**/api/quran/surahs', { forceNetworkError: true }).as('getSurahsError')
    cy.reload()
    cy.get('[data-testid="error-message"]').should('be.visible')
  })

  it('should have footer with copyright', () => {
    cy.get('[data-testid="footer"]').should('be.visible')
    cy.contains('2026')
  })

  it('should navigate via navbar', () => {
    cy.get('[data-testid="nav-surahs"]').click()
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })
})
