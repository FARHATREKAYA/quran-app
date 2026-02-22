describe('Bookmarks Feature', () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: 'testpassword123'
  }

  before(() => {
    // Register test user
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/auth/register',
      body: testUser,
      failOnStatusCode: false
    })
  })

  beforeEach(() => {
    cy.login(testUser.username, testUser.password)
    cy.visit('/bookmarks')
  })

  afterEach(() => {
    cy.logout()
  })

  it('should display bookmarks page', () => {
    cy.contains('My Bookmarks')
    cy.get('[data-testid="bookmarks-list"]').should('be.visible')
  })

  it('should show empty state when no bookmarks', () => {
    cy.get('[data-testid="bookmarks-empty"]').should('be.visible')
    cy.contains('No bookmarks yet')
  })

  it('should create bookmark from surah page', () => {
    cy.visit('/surah/1')
    cy.getByTestId('verse-1').find('[data-testid="bookmark-button"]').click()
    cy.getByTestId('bookmark-modal').should('be.visible')
    cy.getByTestId('bookmark-notes-input').type('My favorite verse')
    cy.getByTestId('bookmark-save-button').click()
    cy.contains('Bookmark saved')
  })

  it('should display saved bookmarks', () => {
    // Create a bookmark first
    cy.visit('/surah/1')
    cy.createBookmark(1, 'Test bookmark')
    
    cy.visit('/bookmarks')
    cy.getByTestId('bookmark-item').should('have.length.at.least', 1)
    cy.contains('Test bookmark')
  })

  it('should delete bookmark', () => {
    // Create and then delete
    cy.visit('/surah/1')
    cy.createBookmark(1)
    
    cy.visit('/bookmarks')
    cy.getByTestId('bookmark-item').first().find('[data-testid="delete-bookmark-button"]').click()
    cy.getByTestId('confirm-delete-modal').should('be.visible')
    cy.getByTestId('confirm-delete-button').click()
    cy.contains('Bookmark deleted')
  })

  it('should navigate to bookmarked verse', () => {
    cy.visit('/surah/1')
    cy.createBookmark(1)
    
    cy.visit('/bookmarks')
    cy.getByTestId('bookmark-item').first().click()
    cy.url().should('include', '/surah/1')
  })

  it('should update bookmark notes', () => {
    cy.visit('/surah/1')
    cy.createBookmark(1, 'Original notes')
    
    cy.visit('/bookmarks')
    cy.getByTestId('bookmark-item').first().find('[data-testid="edit-bookmark-button"]').click()
    cy.getByTestId('bookmark-notes-input').clear().type('Updated notes')
    cy.getByTestId('bookmark-save-button').click()
    cy.contains('Updated notes')
  })

  it('should require authentication', () => {
    cy.logout()
    cy.visit('/bookmarks')
    cy.url().should('include', '/auth')
  })

  it('should show bookmark indicator on verse', () => {
    cy.visit('/surah/1')
    cy.createBookmark(1)
    cy.reload()
    cy.getByTestId('verse-1').find('[data-testid="bookmark-button"]').should('have.class', 'active')
  })

  it('should filter bookmarks by surah', () => {
    cy.visit('/surah/1')
    cy.createBookmark(1)
    cy.visit('/surah/2')
    cy.createBookmark(1)
    
    cy.visit('/bookmarks')
    cy.getByTestId('filter-by-surah').select('1')
    cy.getByTestId('bookmark-item').should('have.length', 1)
  })

  it('should sort bookmarks by date', () => {
    cy.visit('/surah/1')
    cy.createBookmark(1)
    cy.wait(1000)
    cy.createBookmark(2)
    
    cy.visit('/bookmarks')
    cy.getByTestId('sort-by-date').select('newest')
    // Verify order
    cy.getByTestId('bookmark-item').first().should('contain', '2:')
  })

  it('should search bookmarks', () => {
    cy.visit('/surah/1')
    cy.createBookmark(1, 'Special keyword')
    
    cy.visit('/bookmarks')
    cy.getByTestId('search-bookmarks').type('Special')
    cy.getByTestId('bookmark-item').should('have.length', 1)
    cy.contains('Special keyword')
  })
})
