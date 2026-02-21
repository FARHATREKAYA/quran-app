from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
import httpx
from database import get_quran_db
from models import Surah, Verse, Reciter
from schemas import SurahResponse, VerseResponse, QuranPageResponse
from monitoring import track_external_api_call

router = APIRouter()

QURAN_API_BASE = "https://api.quran.com/api/v4"

@router.get("/audio/{surah_number}")
async def get_surah_audio(
    surah_number: int,
    reciter: int = Query(default=1, description="Reciter ID")
):
    """Get audio URL for a surah"""
    async with httpx.AsyncClient() as client:
        with track_external_api_call("quran-com", f"/chapter_recitations/{reciter}"):
            response = await client.get(
                f"{QURAN_API_BASE}/chapter_recitations/{reciter}?chapter={surah_number}"
            )
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Audio not found")
        data = response.json()
        audio_files = data.get("audio_files", [])
        if not audio_files:
            raise HTTPException(status_code=404, detail="Audio not available")
        return {
            "surah_number": surah_number,
            "audio_url": audio_files[0].get("audio_url"),
            "format": audio_files[0].get("format")
        }

@router.get("/audio/verse/{surah_number}/{verse_number}")
async def get_verse_audio(
    surah_number: int,
    verse_number: int,
    reciter: str = Query(default="Alafasy", description="Reciter name")
):
    """Get audio URL for a specific verse using everyayah.com API"""
    # Format: https://everyayah.com/data/Alafasy_64kbps/001001.mp3
    # Surah number padded to 3 digits, verse number padded to 3 digits
    surah_padded = str(surah_number).zfill(3)
    verse_padded = str(verse_number).zfill(3)
    
    # Map reciter names to everyayah.com folder names
    reciter_map = {
        "Alafasy": "Alafasy_64kbps",
        "AbdulBasit": "Abdul_Basit_Murattal_64kbps",
        "Husary": "Husary_64kbps",
        "Minshawi": "Minshawy_Murattal_64kbps",
        "Ghamdi": "Ghamadi_40kbps"
    }
    
    reciter_folder = reciter_map.get(reciter, "Alafasy_64kbps")
    audio_url = f"https://everyayah.com/data/{reciter_folder}/{surah_padded}{verse_padded}.mp3"
    
    return {
        "surah_number": surah_number,
        "verse_number": verse_number,
        "reciter": reciter,
        "audio_url": audio_url,
        "format": "mp3"
    }

@router.get("/surahs", response_model=List[SurahResponse])
async def get_all_surahs(
    db: AsyncSession = Depends(get_quran_db)
):
    result = await db.execute(select(Surah).order_by(Surah.number))
    surahs = result.scalars().all()
    return surahs

@router.get("/surahs/{surah_number}", response_model=SurahResponse)
async def get_surah(
    surah_number: int,
    db: AsyncSession = Depends(get_quran_db)
):
    result = await db.execute(
        select(Surah).where(Surah.number == surah_number)
    )
    surah = result.scalar_one_or_none()
    if not surah:
        raise HTTPException(status_code=404, detail="Surah not found")
    return surah

@router.get("/surahs/{surah_number}/verses")
async def get_surah_verses(
    surah_number: int,
    translation: str = Query(default="english", enum=["english", "arabic", "french"]),
    db: AsyncSession = Depends(get_quran_db)
):
    """
    Get verses for a specific surah.
    
    - **translation**: Language option
      - "english": Show Arabic + English translation (default)
      - "arabic": Show Arabic only
      - "french": Show Arabic + French translation
    """
    result = await db.execute(
        select(Surah).where(Surah.number == surah_number)
    )
    surah = result.scalar_one_or_none()
    if not surah:
        raise HTTPException(status_code=404, detail="Surah not found")
    
    verses_result = await db.execute(
        select(Verse).where(Verse.surah_id == surah.id).order_by(Verse.verse_number_in_surah)
    )
    verses = verses_result.scalars().all()
    
    # Transform verses based on translation preference
    transformed_verses = []
    for verse in verses:
        verse_dict = {
            "id": verse.id,
            "surah_id": verse.surah_id,
            "verse_number": verse.verse_number,
            "verse_number_in_surah": verse.verse_number_in_surah,
            "text_arabic": verse.text_arabic,
            "text_english": verse.text_english if translation != "arabic" else "",
            "text_french": verse.text_french if translation == "french" else None,
            "tafsir_english": verse.tafsir_english,
            "tafsir_french": verse.tafsir_french,
            "juz_number": verse.juz_number,
            "page_number": verse.page_number,
        }
        transformed_verses.append(verse_dict)
    
    return {
        "surah": surah,
        "verses": transformed_verses,
        "translation": translation
    }

@router.get("/juz/{juz_number}")
async def get_juz(
    juz_number: int,
    db: AsyncSession = Depends(get_quran_db)
):
    result = await db.execute(
        select(Verse).where(Verse.juz_number == juz_number).order_by(Verse.verse_number)
    )
    verses = result.scalars().all()
    
    if not verses:
        raise HTTPException(status_code=404, detail="Juz not found")
    
    return {"juz_number": juz_number, "verses": verses}

@router.get("/page/{page_number}")
async def get_page(
    page_number: int,
    db: AsyncSession = Depends(get_quran_db)
):
    result = await db.execute(
        select(Verse).where(Verse.page_number == page_number).order_by(Verse.verse_number)
    )
    verses = result.scalars().all()
    
    if not verses:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return {"page_number": page_number, "verses": verses}

@router.get("/timestamps/{surah_number}")
async def get_verse_timestamps(
    surah_number: int,
    reciter: int = Query(default=1, description="Reciter ID: 1=Abdul Basit, 2=Al-Afasy, 3=Al-Husary"),
    db: AsyncSession = Depends(get_quran_db)
):
    """Get verse timestamps for accurate audio synchronization"""
    # Get surah
    result = await db.execute(
        select(Surah).where(Surah.number == surah_number)
    )
    surah = result.scalar_one_or_none()
    if not surah:
        raise HTTPException(status_code=404, detail="Surah not found")
    
    # Get verses
    verses_result = await db.execute(
        select(Verse).where(Verse.surah_id == surah.id).order_by(Verse.verse_number_in_surah)
    )
    verses = verses_result.scalars().all()
    
    # Check if we have actual timestamps in database
    from sqlalchemy import text
    timestamp_result = await db.execute(
        text("""
            SELECT verse_number, start_time, end_time
            FROM verse_timestamps
            WHERE reciter_id = :reciter_id AND surah_id = :surah_id
            ORDER BY verse_number
        """),
        {"reciter_id": reciter, "surah_id": surah.id}
    )
    timestamps = timestamp_result.fetchall()
    
    if timestamps:
        # Use actual timestamps
        return {
            "surah_number": surah_number,
            "reciter_id": reciter,
            "source": "database",
            "timestamps": [
                {"verse_number": t[0], "start_time": t[1], "end_time": t[2]}
                for t in timestamps
            ]
        }
    else:
        # Fall back to interpolation - will be calculated on frontend
        return {
            "surah_number": surah_number,
            "reciter_id": reciter,
            "source": "interpolation",
            "verse_count": len(verses),
            "message": "Timestamps will be interpolated based on audio duration"
        }

@router.get("/search")
async def search_quran(
    query: str = Query(..., min_length=2),
    search_in: str = Query(default="translation", enum=["arabic", "translation", "both"]),
    limit: int = Query(default=20, le=100),
    db: AsyncSession = Depends(get_quran_db)
):
    if search_in in ["translation", "both"]:
        text_filter = Verse.text_english.ilike(f"%{query}%")
        if search_in == "both":
            text_filter = text_filter | Verse.text_arabic.contains(query)

        result = await db.execute(
            select(Verse).where(text_filter).limit(limit)
        )
    else:
        result = await db.execute(
            select(Verse).where(Verse.text_arabic.contains(query)).limit(limit)
        )

    verses = result.scalars().all()
    return {"query": query, "results": verses, "count": len(verses)}