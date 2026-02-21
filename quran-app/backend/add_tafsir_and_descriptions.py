#!/usr/bin/env python3
"""
Add Surah Descriptions and Tafsir to Quran Database
Fetches from Quran.com API and adds them to existing database
"""
import asyncio
import aiohttp
import aiosqlite
from pathlib import Path
from typing import List, Dict, Any, Optional
import time

QURAN_API_BASE = "https://api.quran.com/api/v4"
TAFSIR_ID_ENGLISH = 169  # Ibn Kathir English
TAFSIR_ID_FRENCH = 74    # French tafsir
REQUEST_DELAY = 0.3  # Seconds between API calls
DB_PATH = Path(__file__).parent / "data" / "quran.db"


async def fetch_surah_info(session: aiohttp.ClientSession, chapter_number: int) -> Optional[Dict]:
    """Fetch surah information including description"""
    url = f"{QURAN_API_BASE}/chapters/{chapter_number}"
    async with session.get(url) as response:
        if response.status == 200:
            data = await response.json()
            return data.get("chapter", {})
        else:
            print(f"Error fetching surah info {chapter_number}: {response.status}")
            return None


async def fetch_tafsir(session: aiohttp.ClientSession, verse_key: str, tafsir_id: int) -> Optional[str]:
    """Fetch tafsir for a specific verse"""
    url = f"{QURAN_API_BASE}/tafsirs/{tafsir_id}/by_ayah/{verse_key}"
    async with session.get(url) as response:
        if response.status == 200:
            data = await response.json()
            tafsir_data = data.get("tafsir", {})
            return tafsir_data.get("text", "")
        else:
            print(f"Error fetching tafsir for {verse_key}: {response.status}")
            return None


async def add_description_column(db: aiosqlite.Connection):
    """Add description column to surahs if it doesn't exist"""
    try:
        await db.execute("ALTER TABLE surahs ADD COLUMN description TEXT")
        await db.commit()
        print("Added description column to surahs table")
    except Exception as e:
        if "duplicate column name" in str(e).lower():
            print("description column already exists")
        else:
            print(f"Error adding description column: {e}")


async def add_tafsir_columns(db: aiosqlite.Connection):
    """Add tafsir columns to verses if they don't exist"""
    try:
        await db.execute("ALTER TABLE verses ADD COLUMN tafsir_english TEXT")
        await db.commit()
        print("Added tafsir_english column to verses table")
    except Exception as e:
        if "duplicate column name" in str(e).lower():
            print("tafsir_english column already exists")
        else:
            print(f"Error adding tafsir_english column: {e}")
    
    try:
        await db.execute("ALTER TABLE verses ADD COLUMN tafsir_french TEXT")
        await db.commit()
        print("Added tafsir_french column to verses table")
    except Exception as e:
        if "duplicate column name" in str(e).lower():
            print("tafsir_french column already exists")
        else:
            print(f"Error adding tafsir_french column: {e}")


async def update_surah_description(db: aiosqlite.Connection, surah_id: int, description: str):
    """Update description for a specific surah"""
    await db.execute(
        "UPDATE surahs SET description = ? WHERE id = ?",
        (description, surah_id)
    )


async def update_verse_tafsir(db: aiosqlite.Connection, verse_id: int, tafsir_en: str, tafsir_fr: str):
    """Update tafsir for a specific verse"""
    await db.execute(
        "UPDATE verses SET tafsir_english = ?, tafsir_french = ? WHERE id = ?",
        (tafsir_en, tafsir_fr, verse_id)
    )


async def get_surah_ids(db: aiosqlite.Connection) -> List[tuple]:
    """Get all surah IDs and numbers from database"""
    cursor = await db.execute("SELECT id, number FROM surahs ORDER BY number")
    return await cursor.fetchall()


async def get_verses_for_surah(db: aiosqlite.Connection, surah_id: int) -> List[tuple]:
    """Get all verse IDs and numbers for a specific surah"""
    cursor = await db.execute(
        "SELECT id, verse_number_in_surah FROM verses WHERE surah_id = ? ORDER BY verse_number_in_surah",
        (surah_id,)
    )
    return await cursor.fetchall()


async def add_descriptions_and_tafsir():
    """Main function to add descriptions and tafsir"""
    print("Adding Surah Descriptions and Tafsir to Quran Database...")
    
    if not DB_PATH.exists():
        print(f"Error: Database not found at {DB_PATH}")
        return
    
    async with aiohttp.ClientSession() as session:
        async with aiosqlite.connect(str(DB_PATH)) as db:
            # Add columns if needed
            await add_description_column(db)
            await add_tafsir_columns(db)
            
            # Get all surahs
            surahs = await get_surah_ids(db)
            print(f"Found {len(surahs)} surahs")
            
            # Process each surah
            for surah_id, surah_number in surahs:
                print(f"\nProcessing Surah {surah_number}/114...")
                
                # Fetch and update surah description
                surah_info = await fetch_surah_info(session, surah_number)
                await asyncio.sleep(REQUEST_DELAY)
                
                if surah_info and surah_info.get("text"):
                    description = surah_info.get("text", "")
                    await update_surah_description(db, surah_id, description)
                    print(f"  Added description ({len(description)} chars)")
                else:
                    print(f"  No description available")
                
                # Get verses for this surah
                verses = await get_verses_for_surah(db, surah_id)
                print(f"  Processing {len(verses)} verses...")
                
                # Process tafsir for each verse (first 5 verses only to save time/API calls)
                # You can remove the limit to process all verses
                verse_limit = min(5, len(verses))  # Process first 5 verses per surah
                
                for i, (verse_id, verse_num) in enumerate(verses[:verse_limit]):
                    verse_key = f"{surah_number}:{verse_num}"
                    
                    # Fetch English tafsir
                    tafsir_en = await fetch_tafsir(session, verse_key, TAFSIR_ID_ENGLISH)
                    await asyncio.sleep(REQUEST_DELAY)
                    
                    # Fetch French tafsir
                    tafsir_fr = await fetch_tafsir(session, verse_key, TAFSIR_ID_FRENCH)
                    await asyncio.sleep(REQUEST_DELAY)
                    
                    # Update database
                    if tafsir_en or tafsir_fr:
                        await update_verse_tafsir(
                            db, verse_id, 
                            tafsir_en or "", 
                            tafsir_fr or ""
                        )
                        en_len = len(tafsir_en) if tafsir_en else 0
                        fr_len = len(tafsir_fr) if tafsir_fr else 0
                        print(f"    Verse {verse_num}: EN({en_len}) FR({fr_len})")
                
                await db.commit()
                print(f"  Done with Surah {surah_number}")
            
            print(f"\n✓ Descriptions and Tafsir added successfully!")
            print(f"Database location: {DB_PATH.absolute()}")
            print(f"\nNote: Only first 5 verses per surah were processed with tafsir.")
            print("To add tafsir for all verses, remove the verse_limit in the script.")


if __name__ == "__main__":
    asyncio.run(add_descriptions_and_tafsir())
