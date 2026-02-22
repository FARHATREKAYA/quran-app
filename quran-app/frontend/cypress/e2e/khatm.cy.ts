describe('Khatm (Reading Schedule)', () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: 'testpassword123'
  }

  before(() => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/auth/register',
      body: testUser,
      failOnStatusCode: false
    })
  })

  beforeEach(() => {
    cy.login(testUser.username, testUser.password)
    cy.visit('/khatm')
  })

  afterEach(() => {
    cy.logout()
  })

  it('should display Khatm page', () => {
    cy.contains('My Reading Schedules')
    cy.getByTestId('khatm-list').should('be.visible')
  })

  it('should show empty state when no schedules', () => {
    cy.getByTestId('khatm-empty').should('be.visible')
    cy.contains('No reading schedules yet')
  })

  it('should create new Khatm schedule', () => {
    cy.getByTestId('create-khatm-button').click()
    cy.getByTestId('khatm-form-modal').should('be.visible')
    
    cy.getByTestId('khatm-title-input').type('Ramadan Khatm')
    cy.getByTestId('khatm-frequency-select').select('daily')
    cy.getByTestId('khatm-time-input').type('19:00')
    cy.getByTestId('khatm-timezone-select').select('UTC')
    cy.getByTestId('khatm-submit-button').click()
    
    cy.contains('Schedule created successfully')
    cy.getByTestId('khatm-item').should('be.visible')
  })

  it('should display Khatm details', () => {
    // Create a schedule first
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/khatm',
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem('token')}`
      },
      body: {
        title: 'Test Schedule',
        frequency: 'daily',
        time: '19:00',
        timezone: 'UTC'
      },
      failOnStatusCode: false
    })

    cy.reload()
    cy.getByTestId('khatm-item').first().click()
    cy.url().should('include', '/khatm/')
    cy.getByTestId('khatm-calendar').should('be.visible')
  })

  it('should show calendar view', () => {
    // Navigate to a specific Khatm
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/khatm',
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem('token')}`
      },
      body: {
        title: 'Test Schedule',
        frequency: 'daily',
        time: '19:00',
        timezone: 'UTC'
      },
      failOnStatusCode: false
    }).then((response) => {
      if (response.body.id) {
        cy.visit(`/khatm/${response.body.id}`)
      }
    })

    cy.getByTestId('calendar-grid').should('be.visible')
    cy.getByTestId('calendar-day').should('have.length', 30) // or appropriate number
  })

  it('should show reading session', () => {
    // Create Khatm and session
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/khatm',
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem('token')}`
      },
      body: {
        title: 'Test Schedule',
        frequency: 'daily',
        time: '19:00',
        timezone: 'UTC'
      },
      failOnStatusCode: false
    }).then((response) => {
      if (response.body.id) {
        // Create a session
        cy.request({
          method: 'POST',
          url: `http://localhost:8000/api/khatm/${response.body.id}/sessions`,
          headers: {
            Authorization: `Bearer ${window.localStorage.getItem('token')}`
          },
          body: {
            verses: [1, 2, 3, 4, 5, 6, 7]
          },
          failOnStatusCode: false
        }).then((sessionResponse) => {
          if (sessionResponse.body.id) {
            cy.visit(`/khatm/${response.body.id}/session/${sessionResponse.body.id}`)
          }
        })
      }
    })

    cy.getByTestId('reading-session').should('be.visible')
    cy.getByTestId('verse-display').should('be.visible')
  })

  it('should complete reading session', () => {
    // Setup Khatm and session
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/khatm',
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem('token')}`
      },
      body: {
        title: 'Test Schedule',
        frequency: 'daily',
        time: '19:00',
        timezone: 'UTC'
      },
      failOnStatusCode: false
    }).then((response) => {
      if (response.body.id) {
        cy.request({
          method: 'POST',
          url: `http://localhost:8000/api/khatm/${response.body.id}/sessions`,
          headers: {
            Authorization: `Bearer ${window.localStorage.getItem('token')}`
          },
          body: {
            verses: [1, 2, 3]
          },
          failOnStatusCode: false
        }).then((sessionResponse) => {
          if (sessionResponse.body.id) {
            cy.visit(`/khatm/${response.body.id}/session/${sessionResponse.body.id}`)
          }
        })
      }
    })

    cy.getByTestId('complete-session-button').click()
    cy.getByTestId('confirm-complete-modal').should('be.visible')
    cy.getByTestId('confirm-complete-button').click()
    cy.contains('Session completed')
  })

  it('should show progress percentage', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/khatm',
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem('token')}`
      },
      body: {
        title: 'Test Schedule',
        frequency: 'daily',
        time: '19:00',
        timezone: 'UTC'
      },
      failOnStatusCode: false
    }).then((response) => {
      if (response.body.id) {
        cy.visit(`/khatm/${response.body.id}`)
      }
    })

    cy.getByTestId('progress-bar').should('be.visible')
    cy.getByTestId('progress-percentage').should('contain', '%')
  })

  it('should delete Khatm schedule', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/khatm',
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem('token')}`
      },
      body: {
        title: 'Test Schedule',
        frequency: 'daily',
        time: '19:00',
        timezone: 'UTC'
      },
      failOnStatusCode: false
    })

    cy.reload()
    cy.getByTestId('khatm-item').first().find('[data-testid="delete-khatm-button"]').click()
    cy.getByTestId('confirm-delete-modal').should('be.visible')
    cy.getByTestId('confirm-delete-button').click()
    cy.contains('Schedule deleted')
  })

  it('should toggle between read and listen modes', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/khatm',
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem('token')}`
      },
      body: {
        title: 'Test Schedule',
        frequency: 'daily',
        time: '19:00',
        timezone: 'UTC'
      },
      failOnStatusCode: false
    }).then((response) => {
      if (response.body.id) {
        cy.request({
          method: 'POST',
          url: `http://localhost:8000/api/khatm/${response.body.id}/sessions`,
          headers: {
            Authorization: `Bearer ${window.localStorage.getItem('token')}`
          },
          body: {
            verses: [1, 2, 3]
          },
          failOnStatusCode: false
        }).then((sessionResponse) => {
          if (sessionResponse.body.id) {
            cy.visit(`/khatm/${response.body.id}/session/${sessionResponse.body.id}`)
          }
        })
      }
    })

    cy.getByTestId('mode-toggle-listen').click()
    cy.getByTestId('audio-player').should('be.visible')
    
    cy.getByTestId('mode-toggle-read').click()
    cy.getByTestId('audio-player').should('not.exist')
  })

  it('should require authentication', () => {
    cy.logout()
    cy.visit('/khatm')
    cy.url().should('include', '/auth')
  })

  it('should show error for invalid time format', () => {
    cy.getByTestId('create-khatm-button').click()
    cy.getByTestId('khatm-title-input').type('Test')
    cy.getByTestId('khatm-time-input').type('25:00')
    cy.getByTestId('khatm-submit-button').click()
    cy.contains('Invalid time format')
  })

  it('should validate required fields', () => {
    cy.getByTestId('create-khatm-button').click()
    cy.getByTestId('khatm-submit-button').click()
    cy.contains('Title is required')
  })

  it('should auto-advance to next verse after audio', () => {
    // Setup session with audio
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/khatm',
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem('token')}`
      },
      body: {
        title: 'Test Schedule',
        frequency: 'daily',
        time: '19:00',
        timezone: 'UTC'
      },
      failOnStatusCode: false
    }).then((response) => {
      if (response.body.id) {
        cy.request({
          method: 'POST',
          url: `http://localhost:8000/api/khatm/${response.body.id}/sessions`,
          headers: {
            Authorization: `Bearer ${window.localStorage.getItem('token')}`
          },
          body: {
            verses: [1, 2, 3]
          },
          failOnStatusCode: false
        }).then((sessionResponse) => {
          if (sessionResponse.body.id) {
            cy.visit(`/khatm/${response.body.id}/session/${sessionResponse.body.id}`)
          }
        })
      }
    })

    cy.getByTestId('mode-toggle-listen').click()
    cy.getByTestId('auto-advance-toggle').click() // Enable auto-advance
    cy.getByTestId('play-button').click()
    
    // After audio finishes, should auto-advance
    cy.getByTestId('verse-display').eq(1).should('have.class', 'current')
  })
})
