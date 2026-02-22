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

      /**
       * Custom command to set mobile viewport
       */
      mobileView(): Chainable<void>

      /**
       * Custom command to set desktop viewport
       */
      desktopView(): Chainable<void>

      /**
       * Custom command to login user
       */
      login(username: string, password: string): Chainable<void>

      /**
       * Custom command to logout user
       */
      logout(): Chainable<void>

      /**
       * Custom command to wait for verse audio to load
       */
      waitForAudio(): Chainable<void>

      /**
       * Custom command to toggle theme
       */
      toggleTheme(theme: 'light' | 'dark' | 'sepia'): Chainable<void>

      /**
       * Custom command to change language
       */
      changeLanguage(language: 'en' | 'fr' | 'ar'): Chainable<void>

      /**
       * Custom command to create bookmark
       */
      createBookmark(verseId: number, notes?: string): Chainable<void>

      /**
       * Custom command to delete bookmark
       */
      deleteBookmark(bookmarkId: number): Chainable<void>

      /**
       * Custom command to create comment
       */
      createComment(verseId: number, content: string, isPublic?: boolean): Chainable<void>

      /**
       * Custom command to navigate to surah
       */
      navigateToSurah(surahNumber: number): Chainable<void>

      /**
       * Custom command to play full surah audio
       */
      playFullSurah(): Chainable<void>

      /**
       * Custom command to verify audio is playing
       */
      audioShouldBePlaying(): Chainable<void>

      /**
       * Custom command to verify audio is paused
       */
      audioShouldBePaused(): Chainable<void>
    }
  }
}

// Select element by data-testid
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`)
})

// Play a specific verse
Cypress.Commands.add('playVerse', (verseNumber: number) => {
  cy.getByTestId(`verse-${verseNumber}`).find('[data-testid="play-button"]').click()
})

// Wait for API call
Cypress.Commands.add('waitForApi', (endpoint: string) => {
  return cy.intercept(`**/api/quran/${endpoint}`).as('apiCall')
})

// Set mobile viewport
Cypress.Commands.add('mobileView', () => {
  cy.viewport('iphone-x')
})

// Set desktop viewport
Cypress.Commands.add('desktopView', () => {
  cy.viewport(1280, 720)
})

// Login user
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl') || 'http://localhost:8000'}/api/auth/login`,
    body: { username, password },
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      window.localStorage.setItem('token', response.body.access_token)
      window.localStorage.setItem('user', JSON.stringify(response.body.user))
    }
  })
})

// Logout user
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('token')
  window.localStorage.removeItem('user')
  cy.reload()
})

// Wait for audio to load
Cypress.Commands.add('waitForAudio', () => {
  cy.get('audio').should('have.prop', 'readyState', 4)
})

// Toggle theme
Cypress.Commands.add('toggleTheme', (theme: 'light' | 'dark' | 'sepia') => {
  cy.getByTestId('theme-toggle').click()
  cy.getByTestId(`theme-${theme}`).click()
  cy.get('html').should('have.class', theme)
})

// Change language
Cypress.Commands.add('changeLanguage', (language: 'en' | 'fr' | 'ar') => {
  cy.getByTestId('language-selector').click()
  cy.getByTestId(`lang-${language}`).click()
  cy.get('html').should('have.attr', 'lang', language)
})

// Create bookmark
Cypress.Commands.add('createBookmark', (verseId: number, notes?: string) => {
  cy.getByTestId(`verse-${verseId}`).find('[data-testid="bookmark-button"]').click()
  if (notes) {
    cy.getByTestId('bookmark-notes-input').type(notes)
    cy.getByTestId('bookmark-save-button').click()
  }
})

// Delete bookmark
Cypress.Commands.add('deleteBookmark', (bookmarkId: number) => {
  cy.visit('/bookmarks')
  cy.getByTestId(`bookmark-${bookmarkId}`).find('[data-testid="delete-bookmark-button"]').click()
  cy.getByTestId('confirm-delete-button').click()
})

// Create comment
Cypress.Commands.add('createComment', (verseId: number, content: string, isPublic: boolean = true) => {
  cy.getByTestId(`verse-${verseId}`).find('[data-testid="comments-button"]').click()
  cy.getByTestId('comment-input').type(content)
  if (!isPublic) {
    cy.getByTestId('comment-private-toggle').click()
  }
  cy.getByTestId('comment-submit-button').click()
})

// Navigate to surah
Cypress.Commands.add('navigateToSurah', (surahNumber: number) => {
  cy.visit(`/surah/${surahNumber}`)
  cy.waitForApi(`surahs/${surahNumber}/verses`)
})

// Play full surah
Cypress.Commands.add('playFullSurah', () => {
  cy.getByTestId('full-surah-play').click()
  cy.getByTestId('audio-player').should('be.visible')
})

// Verify audio is playing
Cypress.Commands.add('audioShouldBePlaying', () => {
  cy.get('audio').should('have.prop', 'paused', false)
  cy.get('audio').should('have.prop', 'currentTime').should('be.gt', 0)
})

// Verify audio is paused
Cypress.Commands.add('audioShouldBePaused', () => {
  cy.get('audio').should('have.prop', 'paused', true)
})
