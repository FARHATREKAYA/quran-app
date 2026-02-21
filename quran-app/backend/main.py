from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import quran, auth, bookmarks, khatm, verse_interactions, admin
from monitoring import setup_metrics

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(
    title="Quran API",
    description="API for Quran reading application with Arabic text, English translation, and audio",
    version="1.0.0",
    docs_url="/docs", # Swagger UI
    redoc_url="/redoc", # ReDoc alternative
    openapi_url="/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up Prometheus metrics
setup_metrics(app)

app.include_router(quran.router, prefix="/api/quran", tags=["quran"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(bookmarks.router, prefix="/api/bookmarks", tags=["bookmarks"])
app.include_router(khatm.router, prefix="/api/khatm", tags=["khatm"])
app.include_router(verse_interactions.router, prefix="/api/verses", tags=["verse_interactions"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
