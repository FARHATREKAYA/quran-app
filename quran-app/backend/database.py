from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import select
from typing import AsyncGenerator
import aiosqlite

Base = declarative_base()

# SQLite for Quran data (static, bundled)
QURAN_DATABASE_URL = "sqlite+aiosqlite:///./data/quran.db"

quran_engine = create_async_engine(
    QURAN_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

AsyncQuranSessionLocal = async_sessionmaker(
    quran_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def init_quran_db():
    async with quran_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_quran_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncQuranSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    pass  # Database already built

# Sync database session for non-async operations (Khatm, Bookmarks, etc.)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

SYNC_DATABASE_URL = "sqlite:///./data/quran.db"

sync_engine = create_engine(
    SYNC_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

def get_db():
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()