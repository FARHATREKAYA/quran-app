from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from database import get_quran_db
from models import Bookmark, Verse, Surah
from auth import get_current_user

router = APIRouter()


# Pydantic models
class BookmarkCreate(BaseModel):
    verse_id: int
    notes: Optional[str] = None


class BookmarkResponse(BaseModel):
    id: int
    user_id: int
    verse_id: int
    created_at: datetime
    notes: Optional[str]
    verse: dict
    
    class Config:
        from_attributes = True


class BookmarkUpdate(BaseModel):
    notes: Optional[str] = None


@router.post("/", response_model=BookmarkResponse)
async def create_bookmark(
    bookmark_data: BookmarkCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_quran_db)
):
    """Add a verse to bookmarks"""
    user_id = int(current_user["user_id"])
    
    # Check if bookmark already exists
    result = await db.execute(
        select(Bookmark).where(
            and_(Bookmark.user_id == user_id, Bookmark.verse_id == bookmark_data.verse_id)
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verse already bookmarked"
        )
    
    # Create new bookmark
    bookmark = Bookmark(
        user_id=user_id,
        verse_id=bookmark_data.verse_id,
        notes=bookmark_data.notes
    )
    
    db.add(bookmark)
    await db.commit()
    await db.refresh(bookmark)
    
    # Get verse details
    verse_result = await db.execute(
        select(Verse, Surah).join(Surah).where(Verse.id == bookmark.verse_id)
    )
    verse, surah = verse_result.first()
    
    return {
        "id": bookmark.id,
        "user_id": bookmark.user_id,
        "verse_id": bookmark.verse_id,
        "created_at": bookmark.created_at,
        "notes": bookmark.notes,
        "verse": {
            "id": verse.id,
            "verse_number_in_surah": verse.verse_number_in_surah,
            "text_arabic": verse.text_arabic[:100] + "..." if len(verse.text_arabic) > 100 else verse.text_arabic,
            "surah": {
                "id": surah.id,
                "name_arabic": surah.name_arabic,
                "name_english": surah.name_english,
                "number": surah.number
            }
        }
    }


@router.get("/", response_model=List[BookmarkResponse])
async def get_bookmarks(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_quran_db)
):
    """Get all bookmarks for current user"""
    user_id = int(current_user["user_id"])
    
    result = await db.execute(
        select(Bookmark).where(Bookmark.user_id == user_id).order_by(Bookmark.created_at.desc())
    )
    bookmarks = result.scalars().all()
    
    # Enrich with verse data
    response = []
    for bookmark in bookmarks:
        verse_result = await db.execute(
            select(Verse, Surah).join(Surah).where(Verse.id == bookmark.verse_id)
        )
        verse, surah = verse_result.first()
        
        response.append({
            "id": bookmark.id,
            "user_id": bookmark.user_id,
            "verse_id": bookmark.verse_id,
            "created_at": bookmark.created_at,
            "notes": bookmark.notes,
            "verse": {
                "id": verse.id,
                "verse_number_in_surah": verse.verse_number_in_surah,
                "text_arabic": verse.text_arabic[:100] + "..." if len(verse.text_arabic) > 100 else verse.text_arabic,
                "surah": {
                    "id": surah.id,
                    "name_arabic": surah.name_arabic,
                    "name_english": surah.name_english,
                    "number": surah.number
                }
            }
        })
    
    return response


@router.get("/check/{verse_id}")
async def check_bookmark(
    verse_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_quran_db)
):
    """Check if a verse is bookmarked by current user"""
    user_id = int(current_user["user_id"])
    
    result = await db.execute(
        select(Bookmark).where(
            and_(Bookmark.user_id == user_id, Bookmark.verse_id == verse_id)
        )
    )
    bookmark = result.scalar_one_or_none()
    
    return {
        "is_bookmarked": bookmark is not None,
        "bookmark_id": bookmark.id if bookmark else None
    }


@router.delete("/{bookmark_id}")
async def delete_bookmark(
    bookmark_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_quran_db)
):
    """Remove a bookmark"""
    user_id = int(current_user["user_id"])
    
    result = await db.execute(
        select(Bookmark).where(
            and_(Bookmark.id == bookmark_id, Bookmark.user_id == user_id)
        )
    )
    bookmark = result.scalar_one_or_none()
    
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    
    await db.delete(bookmark)
    await db.commit()
    
    return {"message": "Bookmark deleted successfully"}


@router.patch("/{bookmark_id}", response_model=BookmarkResponse)
async def update_bookmark(
    bookmark_id: int,
    update_data: BookmarkUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_quran_db)
):
    """Update bookmark notes"""
    user_id = int(current_user["user_id"])
    
    result = await db.execute(
        select(Bookmark).where(
            and_(Bookmark.id == bookmark_id, Bookmark.user_id == user_id)
        )
    )
    bookmark = result.scalar_one_or_none()
    
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    
    if update_data.notes is not None:
        bookmark.notes = update_data.notes
    
    await db.commit()
    await db.refresh(bookmark)
    
    # Get verse details
    verse_result = await db.execute(
        select(Verse, Surah).join(Surah).where(Verse.id == bookmark.verse_id)
    )
    verse, surah = verse_result.first()
    
    return {
        "id": bookmark.id,
        "user_id": bookmark.user_id,
        "verse_id": bookmark.verse_id,
        "created_at": bookmark.created_at,
        "notes": bookmark.notes,
        "verse": {
            "id": verse.id,
            "verse_number_in_surah": verse.verse_number_in_surah,
            "text_arabic": verse.text_arabic[:100] + "..." if len(verse.text_arabic) > 100 else verse.text_arabic,
            "surah": {
                "id": surah.id,
                "name_arabic": surah.name_arabic,
                "name_english": surah.name_english,
                "number": surah.number
            }
        }
    }
