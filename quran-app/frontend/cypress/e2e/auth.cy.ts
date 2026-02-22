describe('Authentication', () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: 'TestPassword123!'
  }

  beforeEach(() => {
    cy.visit('/')
    cy.getByTestId('login-button').click()
  })

  it('should display login modal', () => {
    cy.getByTestId('auth-modal').should('be.visible')
    cy.contains('Login')
  })

  it('should register new user', () => {
    cy.getByTestId('switch-to-register').click()
    cy.getByTestId('username-input').type(testUser.username)
    cy.getByTestId('password-input').type(testUser.password)
    cy.getByTestId('confirm-password-input').type(testUser.password)
    cy.getByTestId('submit-auth-button').click()
    cy.contains('Registration successful')
    cy.getByTestId('auth-modal').should('not.exist')
  })

  it('should login with valid credentials', () => {
    // Register first
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/auth/register',
      body: testUser,
      failOnStatusCode: false
    })

    cy.getByTestId('username-input').type(testUser.username)
    cy.getByTestId('password-input').type(testUser.password)
    cy.getByTestId('submit-auth-button').click()
    cy.contains('Login successful')
    cy.getByTestId('auth-modal').should('not.exist')
    cy.getByTestId('user-avatar').should('be.visible')
  })

  it('should show error for invalid credentials', () => {
    cy.getByTestId('username-input').type('wronguser')
    cy.getByTestId('password-input').type('wrongpassword')
    cy.getByTestId('submit-auth-button').click()
    cy.contains('Invalid credentials')
  })

  it('should show error for duplicate username', () => {
    // Register first
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/auth/register',
      body: testUser,
      failOnStatusCode: false
    })

    cy.getByTestId('switch-to-register').click()
    cy.getByTestId('username-input').type(testUser.username)
    cy.getByTestId('password-input').type(testUser.password)
    cy.getByTestId('confirm-password-input').type(testUser.password)
    cy.getByTestId('submit-auth-button').click()
    cy.contains('Username already exists')
  })

  it('should validate password requirements', () => {
    cy.getByTestId('switch-to-register').click()
    cy.getByTestId('username-input').type(testUser.username)
    cy.getByTestId('password-input').type('short')
    cy.getByTestId('confirm-password-input').type('short')
    cy.getByTestId('submit-auth-button').click()
    cy.contains('Password must be at least')
  })

  it('should validate password match', () => {
    cy.getByTestId('switch-to-register').click()
    cy.getByTestId('username-input').type(testUser.username)
    cy.getByTestId('password-input').type(testUser.password)
    cy.getByTestId('confirm-password-input').type('differentpassword')
    cy.getByTestId('submit-auth-button').click()
    cy.contains('Passwords do not match')
  })

  it('should logout user', () => {
    // Login first
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/auth/register',
      body: testUser,
      failOnStatusCode: false
    })
    cy.login(testUser.username, testUser.password)
    cy.reload()

    cy.getByTestId('user-menu').click()
    cy.getByTestId('logout-button').click()
    cy.getByTestId('login-button').should('be.visible')
    cy.getByTestId('user-avatar').should('not.exist')
  })

  it('should persist login after refresh', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/auth/register',
      body: testUser,
      failOnStatusCode: false
    })
    cy.login(testUser.username, testUser.password)
    cy.reload()
    cy.getByTestId('user-avatar').should('be.visible')
  })

  it('should show protected routes', () => {
    cy.logout()
    cy.visit('/bookmarks')
    cy.url().should('include', '/auth')
    cy.contains('Please login to access this page')
  })

  it('should close modal on outside click', () => {
    cy.get('body').click(0, 0)
    cy.getByTestId('auth-modal').should('not.exist')
  })

  it('should close modal on escape key', () => {
    cy.get('body').type('{esc}')
    cy.getByTestId('auth-modal').should('not.exist')
  })

  it('should switch between login and register', () => {
    cy.contains('Login')
    cy.getByTestId('switch-to-register').click()
    cy.contains('Register')
    cy.getByTestId('switch-to-login').click()
    cy.contains('Login')
  })

  it('should show loading state during authentication', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/auth/register',
      body: testUser,
      failOnStatusCode: false
    })
    cy.getByTestId('username-input').type(testUser.username)
    cy.getByTestId('password-input').type(testUser.password)
    cy.getByTestId('submit-auth-button').click()
    cy.getByTestId('auth-loading').should('be.visible')
  })
})
