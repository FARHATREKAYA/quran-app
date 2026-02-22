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
- 📖 **Full Quran** - All 114 surahs with Arabic text and English translation
- 🔖 **Bookmarks** - Save verses with notes for later reference
- 🎵 **Audio Recitation** - Play verse-by-verse audio (CDN integration ready)
- 🔍 **Search** - Search verses in Arabic or translation
- 📱 **Responsive** - Works on desktop, tablet, and mobile
- 🌙 **Themes** - Light, dark, and sepia (easy on eyes) modes
- 📐 **Font Control** - Adjustable text size for comfortable reading
- 🔄 **Navigation** - Previous/next surah navigation

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **TanStack Query** - Data fetching and caching
- **Zustand** - State management
- **Lucide React** - Icons

### Backend
- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Static Quran data storage
- **Supabase** - PostgreSQL for user data (auth, bookmarks)
- **Uvicorn** - ASGI server

## Project Structure

```
quran-app/
├── frontend/                 # Next.js frontend
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   │   ├── ui/              # UI components
│   │   └── quran/           # Quran-specific components
│   ├── hooks/               # React Query hooks
│   ├── lib/                 # Utilities and API clients
│   ├── types/               # TypeScript definitions
│   └── public/              # Static assets
└── backend/                  # FastAPI backend
    ├── routers/             # API route handlers
    ├── data/                # SQLite database
    ├── main.py              # Application entry point
    ├── database.py          # Database configuration
    ├── models.py            # SQLAlchemy models
    ├── schemas.py           # Pydantic schemas
    └── seed_quran_data.py   # Database seeding script
```

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Python** 3.9+
- **Supabase** account (for user data)

### Setup

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
   python seed_quran_data.py
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
   cp .env.example .env.local
   # Edit .env.local with your API and Supabase URLs
   ```

9. **Start the frontend**
   ```bash
   npm run dev
   ```

10. **Open the app**
    Visit [http://localhost:3000](http://localhost:3000)

## Database Schema

### SQLite (Static Data)
- `surahs` - Surah metadata
- `verses` - Verse content with Arabic and English text
- `reciters` - Audio reciter information

### Supabase PostgreSQL (User Data)
- `user_preferences` - User settings (theme, font size, etc.)
- `bookmarks` - Saved verses with notes

## API Endpoints

### Quran
- `GET /api/quran/surahs` - List all surahs
- `GET /api/quran/surahs/{number}` - Get surah details
- `GET /api/quran/surahs/{number}/verses` - Get surah verses
- `GET /api/quran/juz/{juz_number}` - Get Juz content
- `GET /api/quran/page/{page_number}` - Get page content
- `GET /api/quran/search` - Search verses

### User
- `GET /api/users/me` - Get user profile
- `PUT /api/users/preferences` - Update preferences

### Bookmarks
- `GET /api/bookmarks` - List bookmarks
- `POST /api/bookmarks` - Create bookmark
- `DELETE /api/bookmarks/{id}` - Delete bookmark

## Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
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

### Backend (Docker)
```bash
cd backend
docker build -t quran-api .
docker run -p 8000:8000 quran-api
```

### Frontend (Vercel)
```bash
cd frontend
vercel
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Quran text and translations from various open sources
- Audio recitations from renowned reciters
- Icons from [Lucide](https://lucide.dev)

## Support

For support, please open an issue on GitHub or contact the maintainers.