describe('Surah Detail Page', () => {
  beforeEach(() => {
    cy.visit('/surah/1')
    cy.waitForApi('surahs/1/verses')
  })

  it('should display surah information', () => {
    cy.contains('Al-Fatihah')
    cy.contains('بِسْمِ اللَّهِ')
    cy.get('[data-testid="verse-display"]').should('have.length', 7)
  })

  it('should play audio', () => {
    cy.get('[data-testid="play-button"]').first().click()
    cy.get('audio').should('have.prop', 'paused', false)
  })

  it('should pause audio', () => {
    cy.get('[data-testid="play-button"]').first().click()
    cy.get('[data-testid="pause-button"]').first().click()
    cy.get('audio').should('have.prop', 'paused', true)
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

  it('should navigate to previous surah', () => {
    cy.visit('/surah/2')
    cy.get('[data-testid="prev-surah"]').click()
    cy.url().should('include', '/surah/1')
    cy.contains('Al-Fatihah')
  })

  it('should go back to home', () => {
    cy.contains('Back to List').click()
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('should show tafsir modal', () => {
    cy.get('[data-testid="tafsir-button"]').first().click()
    cy.get('[data-testid="tafsir-modal"]').should('be.visible')
    cy.get('[data-testid="tafsir-content"]').should('not.be.empty')
  })

  it('should show comments modal', () => {
    cy.get('[data-testid="comments-button"]').first().click()
    cy.get('[data-testid="comments-modal"]').should('be.visible')
  })

  it('should show report modal', () => {
    cy.get('[data-testid="report-button"]').first().click()
    cy.get('[data-testid="report-modal"]').should('be.visible')
  })

  it('should toggle verse bookmark', () => {
    cy.get('[data-testid="bookmark-button"]').first().click()
    cy.get('[data-testid="bookmark-button"]').first().should('have.class', 'active')
  })

  it('should play verse by verse', () => {
    cy.get('[data-testid="verse-play-button"]').first().click()
    cy.get('audio').should('have.prop', 'paused', false)
  })

  it('should play full surah', () => {
    cy.get('[data-testid="full-surah-play"]').click()
    cy.get('[data-testid="audio-player"]').should('be.visible')
  })

  it('should highlight current verse during playback', () => {
    cy.get('[data-testid="full-surah-play"]').click()
    cy.get('[data-testid="verse-display"]').first().should('have.class', 'highlighted')
  })

  it('should work with different reciters', () => {
    cy.get('[data-testid="reciter-select"]').select('2')
    cy.get('[data-testid="play-button"]').first().click()
    cy.get('audio').should('have.prop', 'paused', false)
  })

  it('should be responsive on mobile', () => {
    cy.viewport('iphone-x')
    cy.get('[data-testid="verse-display"]').should('be.visible')
    cy.get('[data-testid="audio-controls"]').should('be.visible')
  })

  it('should show surah description', () => {
    cy.get('[data-testid="surah-description"]').should('be.visible')
    cy.contains('Meccan') // or 'Medinan'
  })

  it('should handle API errors gracefully', () => {
    cy.intercept('GET', '**/api/quran/surahs/999/verses', { statusCode: 404 }).as('getVersesError')
    cy.visit('/surah/999')
    cy.get('[data-testid="error-message"]').should('be.visible')
  })

  it('should show verse number in surah', () => {
    cy.get('[data-testid="verse-number"]').first().should('contain', '1')
  })

  it('should show juz information', () => {
    cy.get('[data-testid="juz-info"]').should('be.visible')
  })

  it('should show page number', () => {
    cy.get('[data-testid="page-number"]').should('be.visible')
  })
})
