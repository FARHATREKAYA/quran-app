#!/usr/bin/env python3
"""
Build Quran Database - Fetches all Quran data from Quran.com API
"""
import asyncio
import aiohttp
import aiosqlite
import json
from pathlib import Path
from typing import List, Dict, Any
import time

QURAN_API_BASE = "https://api.quran.com/api/v4"
TRANSLATION_ID = 20  # Saheeh International
REQUEST_DELAY = 0.5  # Seconds between API calls
DB_PATH = Path(__file__).parent / "data" / "quran.db"


async def fetch_chapters(session: aiohttp.ClientSession) -> List[Dict[str, Any]]:
    url = f"{QURAN_API_BASE}/chapters"
    async with session.get(url) as response:
        data = await response.json()
        return data.get("chapters", [])


async def fetch_arabic_verses(session: aiohttp.ClientSession, chapter_number: int):
    url = f"{QURAN_API_BASE}/quran/verses/uthmani?chapter_number={chapter_number}"
    async with session.get(url) as response:
        data = await response.json()
        return data.get("verses", [])


async def fetch_translation_verses(session: aiohttp.ClientSession, chapter_number: int):
    url = f"{QURAN_API_BASE}/quran/translations/{TRANSLATION_ID}?chapter_number={chapter_number}"
    async with session.get(url) as response:
        data = await response.json()
        return data.get("translations", [])


def get_revelation_type(revelation_place: str) -> str:
    return "Meccan" if revelation_place.lower() == "makkah" else "Medinan"


def extract_verse_number(verse_key: str) -> int:
    return int(verse_key.split(":")[1])


async def create_database_schema(db: aiosqlite.Connection):
    await db.execute("""
        CREATE TABLE IF NOT EXISTS surahs (
            id INTEGER PRIMARY KEY,
            number INTEGER UNIQUE NOT NULL,
            name_arabic TEXT NOT NULL,
            name_english TEXT NOT NULL,
            name_transliteration TEXT NOT NULL,
            revelation_type TEXT NOT NULL,
            verse_count INTEGER NOT NULL,
            pages TEXT NOT NULL
        )
    """)
    
    await db.execute("""
        CREATE TABLE IF NOT EXISTS verses (
            id INTEGER PRIMARY KEY,
            surah_id INTEGER NOT NULL,
            verse_number INTEGER NOT NULL,
            verse_number_in_surah INTEGER NOT NULL,
            text_arabic TEXT NOT NULL,
            text_english TEXT NOT NULL,
            juz_number INTEGER NOT NULL,
            page_number INTEGER NOT NULL,
            FOREIGN KEY (surah_id) REFERENCES surahs(id)
        )
    """)
    
    await db.execute("CREATE INDEX IF NOT EXISTS idx_verses_surah ON verses(surah_id)")
    await db.commit()


async def insert_surah(db: aiosqlite.Connection, chapter: Dict[str, Any]) -> int:
    await db.execute(
        """
        INSERT OR REPLACE INTO surahs 
        (id, number, name_arabic, name_english, name_transliteration, revelation_type, verse_count, pages)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            chapter["id"],
            chapter["id"],
            chapter["name_arabic"],
            chapter["name_simple"],
            chapter["name_complex"],
            get_revelation_type(chapter["revelation_place"]),
            chapter["verses_count"],
            json.dumps(chapter.get("pages", []))
        )
    )
    await db.commit()
    return chapter["id"]


async def insert_verses(db: aiosqlite.Connection, surah_id: int, arabic_verses: List[Dict], translation_verses: List[Dict], verse_counter: List[int]):
    translation_map = {i+1: trans.get("text", "") for i, trans in enumerate(translation_verses)}
    
    for arabic_verse in arabic_verses:
        verse_num_in_surah = extract_verse_number(arabic_verse["verse_key"])
        text_arabic = arabic_verse.get("text_uthmani", "")
        text_english = translation_map.get(verse_num_in_surah, "")
        juz_num = arabic_verse.get("juz_number", 1)
        page_num = arabic_verse.get("page_number", 1)
        
        verse_counter[0] += 1
        
        await db.execute(
            """
            INSERT INTO verses (surah_id, verse_number, verse_number_in_surah, text_arabic, text_english, juz_number, page_number)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (surah_id, verse_counter[0], verse_num_in_surah, text_arabic, text_english, juz_num, page_num)
        )
    await db.commit()


async def build_database():
    print("Building Quran Database...")
    
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    if DB_PATH.exists():
        print(f"Removing existing database: {DB_PATH}")
        DB_PATH.unlink()
    
    async with aiohttp.ClientSession() as session:
        print("Fetching surah metadata...")
        chapters = await fetch_chapters(session)
        print(f"Found {len(chapters)} surahs")
        
        async with aiosqlite.connect(str(DB_PATH)) as db:
            print("Creating database schema...")
            await create_database_schema(db)
            
            print("Fetching verses (this will take ~10 minutes)...")
            total_verses = 0
            verse_counter = [0]  # Use list to make it mutable
            
            for i, chapter in enumerate(chapters, 1):
                chapter_num = chapter["id"]
                chapter_name = chapter["name_simple"]
                print(f"Surah {chapter_num}/114: {chapter_name}...", end=" ", flush=True)
                
                surah_id = await insert_surah(db, chapter)
                
                arabic_verses = await fetch_arabic_verses(session, chapter_num)
                await asyncio.sleep(REQUEST_DELAY)
                
                translation_verses = await fetch_translation_verses(session, chapter_num)
                await asyncio.sleep(REQUEST_DELAY)
                
                await insert_verses(db, surah_id, arabic_verses, translation_verses, verse_counter)
                total_verses += len(arabic_verses)
                
                print(f"Done ({len(arabic_verses)} verses)")
            
            print("Finalizing database...")
            
            cursor = await db.execute("SELECT COUNT(*) FROM surahs")
            surah_count = (await cursor.fetchone())[0]
            
            cursor = await db.execute("SELECT COUNT(*) FROM verses")
            verse_count = (await cursor.fetchone())[0]
            
            print(f"Database complete: {surah_count} surahs, {verse_count} verses")
            print(f"Location: {DB_PATH.absolute()}")


if __name__ == "__main__":
    asyncio.run(build_database())
