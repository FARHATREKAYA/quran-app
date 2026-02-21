#!/usr/bin/env python3
"""
Add French Translations to Quran Database
Fetches French translations from Quran.com API and adds them to existing database
"""
import asyncio
import aiohttp
import aiosqlite
from pathlib import Path
from typing import List, Dict, Any
import time

QURAN_API_BASE = "https://api.quran.com/api/v4"
FRENCH_TRANSLATION_ID = 31  # Le Coran - Traduction française
REQUEST_DELAY = 0.5  # Seconds between API calls
DB_PATH = Path(__file__).parent / "data" / "quran.db"


async def fetch_french_verses(session: aiohttp.ClientSession, chapter_number: int):
    """Fetch French translation for a specific chapter"""
    url = f"{QURAN_API_BASE}/quran/translations/{FRENCH_TRANSLATION_ID}?chapter_number={chapter_number}"
    async with session.get(url) as response:
        if response.status == 200:
            data = await response.json()
            return data.get("translations", [])
        else:
            print(f"Error fetching chapter {chapter_number}: {response.status}")
            return []


def extract_verse_number(verse_key: str) -> int:
    """Extract verse number from verse key (e.g., '1:1' -> 1)"""
    return int(verse_key.split(":")[1])


async def add_french_column(db: aiosqlite.Connection):
    """Add text_french column if it doesn't exist"""
    try:
        await db.execute("ALTER TABLE verses ADD COLUMN text_french TEXT")
        await db.commit()
        print("Added text_french column to verses table")
    except Exception as e:
        if "duplicate column name" in str(e).lower():
            print("text_french column already exists")
        else:
            print(f"Error adding column: {e}")


async def update_verse_french(db: aiosqlite.Connection, surah_id: int, verse_num: int, french_text: str):
    """Update French translation for a specific verse"""
    await db.execute(
        """
        UPDATE verses 
        SET text_french = ? 
        WHERE surah_id = ? AND verse_number_in_surah = ?
        """,
        (french_text, surah_id, verse_num)
    )


async def get_surah_ids(db: aiosqlite.Connection) -> List[tuple]:
    """Get all surah IDs and numbers from database"""
    cursor = await db.execute("SELECT id, number FROM surahs ORDER BY number")
    return await cursor.fetchall()


async def add_french_translations():
    """Main function to add French translations"""
    print("Adding French translations to Quran Database...")
    
    if not DB_PATH.exists():
        print(f"Error: Database not found at {DB_PATH}")
        return
    
    async with aiohttp.ClientSession() as session:
        async with aiosqlite.connect(str(DB_PATH)) as db:
            # Add French column if needed
            await add_french_column(db)
            
            # Get all surahs
            surahs = await get_surah_ids(db)
            print(f"Found {len(surahs)} surahs")
            
            total_updated = 0
            
            for surah_id, surah_number in surahs:
                print(f"Processing Surah {surah_number}/114...", end=" ", flush=True)
                
                # Fetch French translation
                french_verses = await fetch_french_verses(session, surah_number)
                await asyncio.sleep(REQUEST_DELAY)
                
                if not french_verses:
                    print("Skipped (no data)")
                    continue
                
                # Update each verse (translations come in order from API)
                for i, french_verse in enumerate(french_verses):
                    verse_num = i + 1  # Verse numbers are 1-indexed
                    french_text = french_verse.get("text", "")
                    
                    await update_verse_french(db, surah_id, verse_num, french_text)
                
                await db.commit()
                total_updated += len(french_verses)
                print(f"Done ({len(french_verses)} verses)")
            
            print(f"\nFrench translations added successfully!")
            print(f"Total verses updated: {total_updated}")
            print(f"Database location: {DB_PATH.absolute()}")


if __name__ == "__main__":
    asyncio.run(add_french_translations())
