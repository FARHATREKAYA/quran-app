# Testing Documentation

## Overview
This document covers all testing for the Quran App, including unit tests, integration tests, and end-to-end tests.

## Backend Tests (Python)

### Setup
```bash
cd quran-app/backend
source venv/bin/activate
pip install -r requirements.txt
```

### Running Tests

#### Run all tests
```bash
pytest
```

#### Run with coverage
```bash
pytest --cov=. --cov-report=html --cov-report=term
```

#### Run specific test file
```bash
pytest tests/test_quran.py
```

#### Run specific test class
```bash
pytest tests/test_quran.py::TestSurahEndpoints
```

#### Run specific test
```bash
pytest tests/test_quran.py::TestSurahEndpoints::test_get_all_surahs
```

### Test Categories

#### 1. Health Endpoint Tests (`TestHealthEndpoint`)
- `test_health_check`: Verifies health endpoint returns healthy status
- `test_health_check_response_time`: Ensures health check responds quickly (< 1 second)

#### 2. Surah Endpoint Tests (`TestSurahEndpoints`)
- `test_get_all_surahs`: Verifies all 114 surahs are returned
- `test_get_single_surah`: Tests getting specific surah by number
- `test_get_surah_not_found`: Verifies 404 for non-existent surah
- `test_get_surah_verses`: Tests getting verses for a surah
- `test_get_surah_verses_invalid`: Verifies error handling for invalid surah

#### 3. Audio Endpoint Tests (`TestAudioEndpoints`)
- `test_get_audio`: Tests audio URL retrieval
- `test_get_timestamps`: Tests verse timestamp retrieval

#### 4. Search Endpoint Tests (`TestSearchEndpoint`)
- `test_search_verses`: Tests verse search functionality
- `test_search_min_length`: Verifies minimum query length validation

#### 5. Swagger Documentation Tests (`TestSwaggerDocs`)
- `test_swagger_ui_accessible`: Verifies Swagger UI loads
- `test_openapi_json_accessible`: Verifies OpenAPI spec is accessible

#### 6. CORS Tests (`TestCORS`)
- `test_cors_headers`: Verifies CORS headers are present

#### 7. Performance Tests (`TestPerformance`)
- `test_get_all_surahs_performance`: Response time < 2 seconds
- `test_get_surah_verses_performance`: Response time < 3 seconds for large surah

## API Documentation (Swagger)

### Access Swagger UI
- **URL**: `http://localhost:8000/docs`
- Interactive API documentation with try-it-out functionality

### Access ReDoc
- **URL**: `http://localhost:8000/redoc`
- Alternative documentation format

### Access OpenAPI JSON
- **URL**: `http://localhost:8000/openapi.json`
- Raw OpenAPI specification

## Frontend Tests (Cypress)

### Setup
```bash
cd quran-app/frontend
npm install
```

### Running Tests

#### Open Cypress Test Runner (interactive)
```bash
npm run cypress:open
```

#### Run tests headlessly
```bash
npm run cypress:run
```

#### Run tests with dev server
```bash
npm run test:e2e
```

#### Run tests with dev server (interactive mode)
```bash
npm run test:e2e:open
```

### Test Categories

#### 1. Homepage Tests (`homepage.cy.ts`)
- Displays homepage with correct title
- Shows all 114 surah cards
- Navigation to surah detail page
- Search functionality
- Theme toggle (dark mode)

#### 2. Surah Detail Tests (`surah-detail.cy.ts`)
- Displays surah information (name, Arabic text, verses)
- Audio playback functionality
- Copy verse text
- Navigation to next/previous surah
- Back to home button

### Custom Commands

#### `getByTestId(testId)`
Selects element by data-testid attribute
```javascript
cy.getByTestId('surah-card').first().click()
```

#### `playVerse(verseNumber)`
Plays specific verse
```javascript
cy.playVerse(1)
```

#### `waitForApi(endpoint)`
Waits for API call
```javascript
cy.waitForApi('surahs').then((interception) => {
  expect(interception.response.statusCode).to.eq(200)
})
```

#### `mobileView()`
Sets mobile viewport
```javascript
cy.mobileView()
```

#### `desktopView()`
Sets desktop viewport
```javascript
cy.desktopView()
```

## Test Data Attributes

Add these attributes to components for reliable test selection:

```tsx
// Surah Card
<div data-testid="surah-card">...</div>

// Verse Display
<div data-testid="verse-display">...</div>

// Play Button
<button data-testid="play-button">...</button>

// Copy Button
<button data-testid="copy-button">...</button>

// Theme Toggle
<button data-testid="theme-toggle">...</button>

// Search Input
<input data-testid="search-input" />

// Navigation Links
<a data-testid="next-surah">...</a>
<a data-testid="prev-surah">...</a>
```

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          pytest --cov=. --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      - name: Run Cypress tests
        run: |
          cd frontend
          npm run test:e2e
```

## Test Coverage Goals

- **Backend**: Minimum 80% coverage
- **Frontend**: Minimum 70% coverage
- **Critical paths**: 100% coverage (surah loading, verse display, audio playback)

## Debugging Tests

### Backend
```bash
# Run with verbose output
pytest -v

# Run with pdb on failure
pytest --pdb

# Run specific test with debug
pytest tests/test_quran.py::TestSurahEndpoints::test_get_all_surahs -v -s
```

### Frontend
```bash
# Open Cypress in debug mode
DEBUG=cypress:* npm run cypress:open

# Run specific test file
npx cypress run --spec "cypress/e2e/homepage.cy.ts"
```

## Common Issues

### Backend Tests
1. **Database locked**: Ensure no other process is using the database
2. **Import errors**: Activate virtual environment before running tests
3. **Async warnings**: Use `pytest-asyncio` decorators for async tests

### Frontend Tests
1. **Server not started**: Run `npm run dev` before cypress tests
2. **Port conflicts**: Ensure ports 3000 and 8000 are free
3. **Timeout errors**: Increase timeout in `cypress.config.ts`

## Writing New Tests

### Backend Test Template
```python
def test_new_feature(self):
    """Test description"""
    response = client.get("/api/quran/endpoint")
    assert response.status_code == 200
    data = response.json()
    assert "expected_field" in data
```

### Frontend Test Template
```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    cy.visit('/path')
  })

  it('should do something', () => {
    cy.getByTestId('element').click()
    cy.contains('Expected text')
  })
})
```
