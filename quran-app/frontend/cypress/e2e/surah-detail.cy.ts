describe('Surah Detail Page', () => {
  beforeEach(() => {
    cy.visit('/surah/1')
  })

  it('should display surah information', () => {
    cy.contains('Al-Fatihah')
    cy.contains('بِسْمِ اللَّهِ')
    cy.get('[data-testid="verse-display"]').should('have.length', 7)
  })

  it('should play audio', () => {
    cy.get('[data-testid="play-button"]').click()
    cy.get('audio').should('have.prop', 'paused', false)
  })

  it('should copy verse text', () => {
    cy.get('[data-testid="copy-button"]').first().click()
    cy.contains('Copied!')
  })

  it('should navigate to next surah', () => {
    cy.get('[data-testid="next-surah"]').click()
    cy.url().should('include', '/surah/2')
    cy.contains('Al-Baqarah')
  })

  it('should go back to home', () => {
    cy.contains('Back to List').click()
    cy.url().should('eq', 'http://localhost:3000/')
  })
})
