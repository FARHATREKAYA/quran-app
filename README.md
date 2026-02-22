# Quran Application

A beautiful Quran reading application built with Next.js frontend and FastAPI backend, featuring Arabic text, English translation, audio recitation, and user bookmarks.

## Architecture

```
Client (Web - Next.js)
↓ (HTTPS / WebSocket)
API Gateway / Backend Server (FastAPI)
↓ (ORM / SQL queries)
Database Layer
├── Static Quran Data (immutable) → SQLite (bundled + cached)
├── User Data (dynamic) → Supabase PostgreSQL (or self-hosted Postgres)
└── Media (Audio) → CDN / Static files (S3 + Cloudflare)
```

## Features

- ✨ **Beautiful Interface** - Clean, modern design with dark/light/sepia themes
- 📖 **Full Quran** - All 114 surahs with Arabic text (Uthmani script) and English translation (Saheeh International)
- 🔖 **Bookmarks** - Save verses with notes for later reference
- 📅 **Khatm (Reading Schedule)** - Create custom Quran reading schedules with calendar view
- 💬 **Comments** - Add public/private comments to verses
- 🚨 **Issue Reporting** - Report translation, audio, or tafsir errors
- 🎵 **Audio Recitation** - Play verse-by-verse or full surah audio with synchronized verse highlighting
- 🔍 **Search** - Search verses in Arabic or translation
- 📱 **Responsive** - Works on desktop, tablet, and mobile
- 🌙 **Themes** - Light, dark, and sepia (easy on eyes) modes
- 📐 **Font Control** - Adjustable text size for comfortable reading
- 🔄 **Navigation** - Previous/next surah navigation
- 🔐 **Authentication** - JWT-based user authentication with secure password hashing
- 🌍 **Multi-language** - Support for English, French, and Arabic

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **TanStack Query** - Data fetching and caching
- **Zustand** - State management
- **Lucide React** - Icons
- **date-fns** - Date manipulation

### Backend
- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Static Quran data storage
- **Supabase** - PostgreSQL for user data (auth, bookmarks, comments, reports)
- **Uvicorn** - ASGI server
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

### DevOps & Monitoring
- **Docker** - Containerization
- **Docker Compose** - Multi-service orchestration
- **Prometheus** - Metrics collection
- **Grafana** - Visualization dashboards
- **Loki** - Log aggregation
- **GitHub Actions** - CI/CD automation

## Project Structure

```
quran-app/
├── frontend/                 # Next.js frontend
│   ├── app/                 # App router pages
│   │   ├── surah/[number]/  # Surah detail page
│   │   ├── bookmarks/       # Bookmarks page
│   │   ├── khatm/           # Khatm schedules
│   │   └── auth/            # Authentication page
│   ├── components/          # React components
│   │   ├── ui/              # UI components (Navbar, Footer, etc.)
│   │   └── quran/           # Quran-specific components
│   ├── hooks/               # React Query hooks
│   ├── lib/                 # Utilities, API clients, AuthContext
│   │   └── i18n/            # Translations (EN/FR/AR)
│   ├── types/               # TypeScript definitions
│   └── cypress/             # E2E tests
├── backend/                 # FastAPI backend
│   ├── routers/             # API route handlers
│   │   ├── quran.py         # Quran endpoints
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── bookmarks.py     # Bookmark endpoints
│   │   ├── khatm.py         # Khatm schedule endpoints
│   │   └── verse_interactions.py  # Comments & Reports
│   ├── data/                # SQLite database
│   ├── tests/               # Unit tests
│   ├── main.py              # Application entry point
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   └── auth.py              # JWT utilities
└── monitoring/              # Monitoring stack
    ├── prometheus/          # Metrics collection
    ├── grafana/             # Dashboards
    ├── loki/                # Log aggregation
    └── alertmanager/        # Alert notifications
```

## Database Schema

### SQLite (Static Data)
- `surahs` - Surah metadata (114 records)
- `verses` - Verse content with Arabic and English text (6,236 records)
- `reciters` - Audio reciter information
- `audio_recitations` - Audio URLs and metadata

### Supabase PostgreSQL (User Data)
- `users` - User accounts with authentication
- `user_preferences` - User settings (theme, font size, language)
- `bookmarks` - Saved verses with notes
- `khatms` - Reading schedules
- `khatm_sessions` - Individual reading sessions
- `verse_comments` - Public/private verse comments
- `verse_reports` - Issue reports

## API Endpoints

### Quran
- `GET /api/quran/surahs` - List all surahs
- `GET /api/quran/surahs/{number}` - Get surah details
- `GET /api/quran/surahs/{number}/verses` - Get surah verses
- `GET /api/quran/audio/{surah_number}` - Get audio URLs
- `GET /api/quran/audio/verse/{surah}/{verse}` - Get verse audio
- `GET /api/quran/timestamps/{surah_number}` - Get verse timestamps
- `GET /api/quran/search` - Search verses

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Bookmarks
- `GET /api/bookmarks` - List user bookmarks
- `POST /api/bookmarks` - Create bookmark
- `DELETE /api/bookmarks/{id}` - Delete bookmark

### Khatm
- `GET /api/khatm` - List user Khatm schedules
- `POST /api/khatm` - Create Khatm schedule
- `GET /api/khatm/{id}` - Get Khatm details
- `POST /api/khatm/{id}/sessions` - Create reading session
- `PUT /api/khatm/sessions/{id}/complete` - Complete session

### Verse Interactions
- `GET /api/verses/{verse_id}/comments` - Get verse comments
- `POST /api/verses/{verse_id}/comments` - Add comment
- `POST /api/verses/{verse_id}/reports` - Report issue
- `GET /api/verses/my-comments` - Get user's comments
- `GET /api/verses/my-reports` - Get user's reports

### System
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Python** 3.9+
- **Docker** and Docker Compose (optional)
- **Supabase** account (for user data)

### Quick Start with Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd quran-app

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Manual Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd quran-app
```

2. **Set up the backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. **Seed the Quran database**
```bash
python build_quran_db.py
```

5. **Set up Supabase tables**
Run the SQL in `supabase/migrations/` in your Supabase SQL editor

6. **Start the backend**
```bash
uvicorn main:app --reload --port 8000
```

7. **Set up the frontend**
```bash
cd ../frontend
npm install
```

8. **Configure frontend environment**
```bash
cp .env.local.example .env.local
# Edit .env.local with your API and Supabase URLs
```

9. **Start the frontend**
```bash
npm run dev
```

10. **Open the app**
Visit http://localhost:3000

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend E2E tests
cd frontend
npm run cypress:open    # Interactive mode
npm run cypress:run     # Headless mode
```

### Building for Production

```bash
# Backend
cd backend
docker build -t quran-api .

# Frontend
cd frontend
npm run build
```

## Deployment

### Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Cloud Providers

- **AWS ECS/Fargate** - See CI-CD.md for ECR push commands
- **Railway/Render** - Connect GitHub repo for automatic deployments
- **Static Hosting** - Export static build for Netlify or similar

### Required GitHub Secrets

For CI/CD pipeline, set these in GitHub Settings → Secrets:
- `SERVER_HOST` - Production server IP/hostname
- `SERVER_USER` - SSH username
- `SSH_PRIVATE_KEY` - Private key for deployment
- `PROD_API_URL` - Production backend URL

## Monitoring

The application includes a complete monitoring stack:

### Access Points
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Alertmanager**: http://localhost:9093
- **Loki**: http://localhost:3100

### Available Metrics
- HTTP request rate and latency
- Error rates
- Database query performance
- External API call metrics
- Container resource usage

### Key PromQL Queries
```promql
# Request rate
sum(rate(http_requests_total[5m]))

# Error rate (5xx errors)
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# P95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

See `monitoring/README.md` and `QUICKSTART-MONITORING.md` for detailed setup.

## CI/CD Pipeline

The project includes GitHub Actions workflows:

1. **test.yml** - Automated testing (backend + frontend + integration)
2. **code-quality.yml** - Linting and security scanning
3. **build.yml** - Docker image builds
4. **deploy.yml** - Staging/Production deployment

See `.github/workflows/` for configuration and `CI-CD.md` for documentation.

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Quran text and translations from Quran.com API
- Audio recitations from everyayah.com API
- Icons from [Lucide](https://lucide.dev)
- Fonts: Inter (Latin), Amiri (Arabic)

## Support

For support, please open an issue on GitHub or contact the maintainers.

---

**Project Status**: Production-ready with comprehensive features including authentication, bookmarks, Khatm schedules, comments, and issue reporting.

Last Updated: 2026-02-22
