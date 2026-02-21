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
})
