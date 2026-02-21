#!/usr/bin/env python3
"""
Add verse timestamps to database for accurate audio synchronization
Uses timing data from mp3quran.net
"""
import asyncio
import aiosqlite
from pathlib import Path
from typing import Dict, List, Tuple
import re

DB_PATH = Path(__file__).parent / "data" / "quran.db"

# Sample timing data for Abdul Basit (Surah 1 Al-Fatiha)
# Format: (verse_number, start_seconds, end_seconds)
# These are approximate timings - actual data should be loaded from official sources
SAMPLE_TIMESTAMPS = {
    1: {  # Abdul Basit
        1: [  # Surah 1 - Al-Fatiha (approximate timings)
            (1, 0.0, 8.0),
            (2, 8.0, 15.0),
            (3, 15.0, 21.0),
            (4, 21.0, 26.0),
            (5, 26.0, 32.0),
            (6, 32.0, 39.0),
            (7, 39.0, 50.0),
        ],
    },
    2: {  # Al-Afasy - would load actual data
    },
    3: {  # Al-Husary - would load actual data
    },
}

async def create_timestamps_table():
    """Create timestamps table"""
    async with aiosqlite.connect(str(DB_PATH)) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS verse_timestamps (
                id INTEGER PRIMARY KEY,
                reciter_id INTEGER NOT NULL,
                surah_id INTEGER NOT NULL,
                verse_id INTEGER NOT NULL,
                verse_number INTEGER NOT NULL,
                start_time REAL NOT NULL,
                end_time REAL NOT NULL,
                FOREIGN KEY (surah_id) REFERENCES surahs(id),
                FOREIGN KEY (verse_id) REFERENCES verses(id)
            )
        """)
        
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_timestamps_reciter_surah 
            ON verse_timestamps(reciter_id, surah_id)
        """)
        
        await db.commit()
        print("Timestamps table created")

async def populate_timestamps():
    """Populate timestamps table with sample data"""
    async with aiosqlite.connect(str(DB_PATH)) as db:
        # Clear existing timestamps
        await db.execute("DELETE FROM verse_timestamps")
        
        for reciter_id, surahs in SAMPLE_TIMESTAMPS.items():
            for surah_number, verses in surahs.items():
                # Get surah_id
                cursor = await db.execute(
                    "SELECT id FROM surahs WHERE number = ?",
                    (surah_number,)
                )
                surah_row = await cursor.fetchone()
                if not surah_row:
                    continue
                surah_id = surah_row[0]
                
                for verse_number, start_time, end_time in verses:
                    # Get verse_id
                    cursor = await db.execute(
                        "SELECT id FROM verses WHERE surah_id = ? AND verse_number_in_surah = ?",
                        (surah_id, verse_number)
                    )
                    verse_row = await cursor.fetchone()
                    if not verse_row:
                        continue
                    verse_id = verse_row[0]
                    
                    await db.execute(
                        """
                        INSERT INTO verse_timestamps 
                        (reciter_id, surah_id, verse_id, verse_number, start_time, end_time)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (reciter_id, surah_id, verse_id, verse_number, start_time, end_time)
                    )
        
        await db.commit()
        print("Timestamps populated")

async def get_verse_timestamps(reciter_id: int, surah_number: int):
    """Get all timestamps for a reciter and surah"""
    async with aiosqlite.connect(str(DB_PATH)) as db:
        cursor = await db.execute(
            """
            SELECT vt.verse_number, vt.start_time, vt.end_time
            FROM verse_timestamps vt
            JOIN surahs s ON vt.surah_id = s.id
            WHERE vt.reciter_id = ? AND s.number = ?
            ORDER BY vt.verse_number
            """,
            (reciter_id, surah_number)
        )
        return await cursor.fetchall()

async def main():
    print("Setting up verse timestamps...")
    await create_timestamps_table()
    await populate_timestamps()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
