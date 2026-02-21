from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import json
from database import get_db
from models import Khatm, KhatmSession, Verse, Surah
from auth import get_current_user
from pydantic import BaseModel, Field

router = APIRouter(tags=["khatm"])

# Total verses in Quran
TOTAL_QURAN_VERSES = 6236

# Pydantic models
class KhatmCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    frequency_type: str = Field(..., pattern="^(daily|weekly|custom)$")
    reading_days: Optional[List[str]] = None  # ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
    reading_time: str = Field(..., pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    timezone: str = "UTC"
    reading_mode: str = Field(default="read_listen", pattern="^(read_only|read_listen)$")
    enable_audio_break: bool = True
    reminder_minutes_before: int = Field(default=30, ge=5, le=1440)
    enable_missed_day_notifications: bool = True

class KhatmUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    reading_time: Optional[str] = Field(None, pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    reading_mode: Optional[str] = None
    enable_audio_break: Optional[bool] = None
    reminder_minutes_before: Optional[int] = Field(None, ge=5, le=1440)
    is_active: Optional[bool] = None

class SessionComplete(BaseModel):
    verses_read: int
    last_verse_id: Optional[int] = None

class SessionSkip(BaseModel):
    reason: Optional[str] = None

@router.post("/", response_model=dict)
def create_khatm(
    khatm_data: KhatmCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new Khatm reading schedule"""
    
    # Validate reading days for weekly/custom frequency
    if khatm_data.frequency_type in ["weekly", "custom"] and not khatm_data.reading_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reading days are required for weekly/custom frequency"
        )
    
    # Calculate total sessions based on frequency
    total_days = (khatm_data.end_date - khatm_data.start_date).days + 1
    
    if khatm_data.frequency_type == "daily":
        total_sessions = total_days
    elif khatm_data.frequency_type == "weekly":
        # Count how many of the selected days occur in the date range
        total_sessions = 0
        current_date = khatm_data.start_date
        while current_date <= khatm_data.end_date:
            day_name = current_date.strftime("%a").lower()
            if day_name in [d.lower() for d in khatm_data.reading_days]:
                total_sessions += 1
            current_date += timedelta(days=1)
    else:  # custom
        total_sessions = len([d for d in khatm_data.reading_days if d]) if khatm_data.reading_days else total_days
    
    if total_sessions == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid reading days found in the selected date range"
        )
    
    # Create Khatm
    khatm = Khatm(
        user_id=current_user["user_id"],
        title=khatm_data.title,
        description=khatm_data.description,
        start_date=khatm_data.start_date,
        end_date=khatm_data.end_date,
        target_date=khatm_data.end_date,
        frequency_type=khatm_data.frequency_type,
        reading_days=json.dumps(khatm_data.reading_days) if khatm_data.reading_days else None,
        reading_time=khatm_data.reading_time,
        timezone=khatm_data.timezone,
        reading_mode=khatm_data.reading_mode,
        enable_audio_break=khatm_data.enable_audio_break,
        total_sessions=total_sessions,
        total_verses=TOTAL_QURAN_VERSES,
        reminder_minutes_before=khatm_data.reminder_minutes_before,
        enable_missed_day_notifications=khatm_data.enable_missed_day_notifications
    )
    
    db.add(khatm)
    db.commit()
    db.refresh(khatm)
    
    # Generate sessions
    generate_khatm_sessions(db, khatm)
    
    return {
        "id": khatm.id,
        "title": khatm.title,
        "total_sessions": khatm.total_sessions,
        "message": "Khatm schedule created successfully"
    }

def generate_khatm_sessions(db: Session, khatm: Khatm):
    """Generate reading sessions for a Khatm"""
    
    verses_per_session = khatm.total_verses // khatm.total_sessions
    remaining_verses = khatm.total_verses % khatm.total_sessions
    
    # Get all verses ordered by global number
    all_verses = db.query(Verse).order_by(Verse.id).all()
    
    current_verse_index = 0
    session_number = 1
    current_date = khatm.start_date
    reading_days_list = json.loads(khatm.reading_days) if khatm.reading_days else []
    
    while session_number <= khatm.total_sessions and current_verse_index < len(all_verses):
        # Check if this date should have a session
        if khatm.frequency_type == "daily":
            should_create_session = True
        elif khatm.frequency_type in ["weekly", "custom"]:
            day_name = current_date.strftime("%a").lower()
            should_create_session = day_name in [d.lower() for d in reading_days_list]
        else:
            should_create_session = True
        
        if should_create_session:
            # Calculate verses for this session
            session_verse_count = verses_per_session + (1 if session_number <= remaining_verses else 0)
            end_index = min(current_verse_index + session_verse_count, len(all_verses))
            
            start_verse = all_verses[current_verse_index]
            end_verse = all_verses[end_index - 1]
            
            # Parse reading time
            time_parts = khatm.reading_time.split(":")
            scheduled_datetime = datetime.combine(
                current_date.date(),
                datetime.strptime(khatm.reading_time, "%H:%M").time()
            )
            
            session = KhatmSession(
                khatm_id=khatm.id,
                session_number=session_number,
                scheduled_date=scheduled_datetime,
                scheduled_time=khatm.reading_time,
                start_verse_id=start_verse.id,
                end_verse_id=end_verse.id,
                start_verse_global_number=current_verse_index + 1,
                end_verse_global_number=end_index,
                verse_count=end_index - current_verse_index,
                start_surah_id=start_verse.surah_id,
                start_verse_in_surah=start_verse.verse_number_in_surah,
                end_surah_id=end_verse.surah_id,
                end_verse_in_surah=end_verse.verse_number_in_surah
            )
            
            db.add(session)
            session_number += 1
            current_verse_index = end_index
        
        current_date += timedelta(days=1)
    
    db.commit()

@router.get("/", response_model=List[dict])
def get_user_khatms(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    active_only: bool = True
):
    """Get all Khatm schedules for current user"""
    
    query = db.query(Khatm).filter(Khatm.user_id == current_user["user_id"])
    
    if active_only:
        query = query.filter(Khatm.is_active == True)
    
    khatms = query.order_by(Khatm.created_at.desc()).all()
    
    result = []
    for khatm in khatms:
        # Calculate progress
        progress_percentage = (khatm.completed_sessions / khatm.total_sessions * 100) if khatm.total_sessions > 0 else 0
        verses_percentage = (khatm.completed_verses / khatm.total_verses * 100) if khatm.total_verses > 0 else 0
        
        result.append({
            "id": khatm.id,
            "title": khatm.title,
            "description": khatm.description,
            "start_date": khatm.start_date.isoformat(),
            "end_date": khatm.end_date.isoformat(),
            "frequency_type": khatm.frequency_type,
            "reading_days": json.loads(khatm.reading_days) if khatm.reading_days else None,
            "reading_time": khatm.reading_time,
            "reading_mode": khatm.reading_mode,
            "total_sessions": khatm.total_sessions,
            "completed_sessions": khatm.completed_sessions,
            "total_verses": khatm.total_verses,
            "completed_verses": khatm.completed_verses,
            "progress_percentage": round(progress_percentage, 2),
            "verses_percentage": round(verses_percentage, 2),
            "is_active": khatm.is_active,
            "is_completed": khatm.is_completed,
            "created_at": khatm.created_at.isoformat()
        })
    
    return result

@router.get("/{khatm_id}", response_model=dict)
def get_khatm_details(
    khatm_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed information about a specific Khatm"""
    
    khatm = db.query(Khatm).filter(
        Khatm.id == khatm_id,
        Khatm.user_id == current_user["user_id"]
    ).first()
    
    if not khatm:
        raise HTTPException(status_code=404, detail="Khatm not found")
    
    # Get all sessions
    sessions = db.query(KhatmSession).filter(
        KhatmSession.khatm_id == khatm_id
    ).order_by(KhatmSession.session_number).all()
    
    sessions_data = []
    for session in sessions:
        sessions_data.append({
            "id": session.id,
            "session_number": session.session_number,
            "scheduled_date": session.scheduled_date.isoformat(),
            "scheduled_time": session.scheduled_time,
            "start_surah": session.start_surah.name_english if session.start_surah else None,
            "start_verse_in_surah": session.start_verse_in_surah,
            "end_surah": session.end_surah.name_english if session.end_surah else None,
            "end_verse_in_surah": session.end_verse_in_surah,
            "verse_count": session.verse_count,
            "status": session.status,
            "completed_at": session.completed_at.isoformat() if session.completed_at else None,
            "skipped_at": session.skipped_at.isoformat() if session.skipped_at else None,
            "verses_read_count": session.verses_read_count
        })
    
    progress_percentage = (khatm.completed_sessions / khatm.total_sessions * 100) if khatm.total_sessions > 0 else 0
    
    return {
        "id": khatm.id,
        "title": khatm.title,
        "description": khatm.description,
        "start_date": khatm.start_date.isoformat(),
        "end_date": khatm.end_date.isoformat(),
        "frequency_type": khatm.frequency_type,
        "reading_days": json.loads(khatm.reading_days) if khatm.reading_days else None,
        "reading_time": khatm.reading_time,
        "reading_mode": khatm.reading_mode,
        "enable_audio_break": khatm.enable_audio_break,
        "total_sessions": khatm.total_sessions,
        "completed_sessions": khatm.completed_sessions,
        "total_verses": khatm.total_verses,
        "completed_verses": khatm.completed_verses,
        "progress_percentage": round(progress_percentage, 2),
        "is_active": khatm.is_active,
        "is_completed": khatm.is_completed,
        "reminder_minutes_before": khatm.reminder_minutes_before,
        "sessions": sessions_data
    }

@router.get("/{khatm_id}/today", response_model=dict)
def get_today_session(
    khatm_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get today's session for a Khatm"""
    
    today = datetime.now().date()
    
    session = db.query(KhatmSession).join(Khatm).filter(
        KhatmSession.khatm_id == khatm_id,
        Khatm.user_id == current_user["user_id"],
        func.date(KhatmSession.scheduled_date) == today
    ).first()
    
    if not session:
        return {"message": "No session scheduled for today"}
    
    return {
        "id": session.id,
        "session_number": session.session_number,
        "scheduled_time": session.scheduled_time,
        "start_verse_id": session.start_verse_id,
        "end_verse_id": session.end_verse_id,
        "start_surah_id": session.start_surah_id,
        "start_verse_in_surah": session.start_verse_in_surah,
        "end_surah_id": session.end_surah_id,
        "end_verse_in_surah": session.end_verse_in_surah,
        "verse_count": session.verse_count,
        "status": session.status,
        "current_verse_id": session.current_verse_id
    }

@router.get("/{khatm_id}/sessions/{session_id}", response_model=dict)
def get_session_details(
    khatm_id: int,
    session_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get details of a specific session with verses"""
    
    session = db.query(KhatmSession).join(Khatm).filter(
        KhatmSession.id == session_id,
        KhatmSession.khatm_id == khatm_id,
        Khatm.user_id == current_user["user_id"]
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get khatm settings
    khatm = session.khatm
    
    # Get all verses in this session
    verses = db.query(Verse).filter(
        Verse.id >= session.start_verse_id,
        Verse.id <= session.end_verse_id
    ).order_by(Verse.id).all()
    
    verses_data = []
    for verse in verses:
        verses_data.append({
            "id": verse.id,
            "surah_id": verse.surah_id,
            "surah_name": verse.surah.name_english,
            "verse_number_in_surah": verse.verse_number_in_surah,
            "text_arabic": verse.text_arabic,
            "text_english": verse.text_english,
            "text_french": verse.text_french,
            "page_number": verse.page_number,
            "juz_number": verse.juz_number
        })
    
    return {
        "id": session.id,
        "session_number": session.session_number,
        "scheduled_date": session.scheduled_date.isoformat(),
        "scheduled_time": session.scheduled_time,
        "status": session.status,
        "start_surah": session.start_surah.name_english if session.start_surah else None,
        "end_surah": session.end_surah.name_english if session.end_surah else None,
        "verse_count": session.verse_count,
        "verses_read_count": session.verses_read_count,
        "current_verse_id": session.current_verse_id,
        "reading_mode": khatm.reading_mode,
        "enable_audio_break": khatm.enable_audio_break,
        "verses": verses_data
    }

@router.post("/{khatm_id}/sessions/{session_id}/complete")
def complete_session(
    khatm_id: int,
    session_id: int,
    completion_data: SessionComplete,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mark a session as completed"""
    
    session = db.query(KhatmSession).join(Khatm).filter(
        KhatmSession.id == session_id,
        KhatmSession.khatm_id == khatm_id,
        Khatm.user_id == current_user["user_id"]
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Session already completed")
    
    # Update session
    session.status = "completed"
    session.completed_at = datetime.utcnow()
    session.verses_read_count = completion_data.verses_read
    session.current_verse_id = completion_data.last_verse_id
    
    # Update Khatm progress
    khatm = session.khatm
    khatm.completed_sessions += 1
    khatm.completed_verses += session.verse_count
    
    # Check if Khatm is completed
    if khatm.completed_sessions >= khatm.total_sessions:
        khatm.is_completed = True
        khatm.is_active = False
    
    db.commit()
    
    return {
        "message": "Session completed successfully",
        "progress": {
            "completed_sessions": khatm.completed_sessions,
            "total_sessions": khatm.total_sessions,
            "percentage": round(khatm.completed_sessions / khatm.total_sessions * 100, 2)
        }
    }

@router.post("/{khatm_id}/sessions/{session_id}/skip")
def skip_session(
    khatm_id: int,
    session_id: int,
    skip_data: SessionSkip,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Skip a session"""
    
    session = db.query(KhatmSession).join(Khatm).filter(
        KhatmSession.id == session_id,
        KhatmSession.khatm_id == khatm_id,
        Khatm.user_id == current_user["user_id"]
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status in ["completed", "skipped"]:
        raise HTTPException(status_code=400, detail=f"Session already {session.status}")
    
    session.status = "skipped"
    session.skipped_at = datetime.utcnow()
    session.skipped_reason = skip_data.reason
    
    db.commit()
    
    return {"message": "Session skipped successfully"}

@router.patch("/{khatm_id}")
def update_khatm(
    khatm_id: int,
    khatm_update: KhatmUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update Khatm settings"""
    
    khatm = db.query(Khatm).filter(
        Khatm.id == khatm_id,
        Khatm.user_id == current_user["user_id"]
    ).first()
    
    if not khatm:
        raise HTTPException(status_code=404, detail="Khatm not found")
    
    update_data = khatm_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(khatm, field, value)
    
    db.commit()
    db.refresh(khatm)
    
    return {"message": "Khatm updated successfully"}

@router.delete("/{khatm_id}")
def delete_khatm(
    khatm_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a Khatm schedule"""
    
    khatm = db.query(Khatm).filter(
        Khatm.id == khatm_id,
        Khatm.user_id == current_user["user_id"]
    ).first()
    
    if not khatm:
        raise HTTPException(status_code=404, detail="Khatm not found")
    
    db.delete(khatm)
    db.commit()
    
    return {"message": "Khatm deleted successfully"}

@router.get("/{khatm_id}/progress")
def get_khatm_progress(
    khatm_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed progress statistics"""
    
    khatm = db.query(Khatm).filter(
        Khatm.id == khatm_id,
        Khatm.user_id == current_user["user_id"]
    ).first()
    
    if not khatm:
        raise HTTPException(status_code=404, detail="Khatm not found")
    
    # Get session statistics
    sessions_stats = db.query(
        KhatmSession.status,
        func.count(KhatmSession.id)
    ).filter(
        KhatmSession.khatm_id == khatm_id
    ).group_by(KhatmSession.status).all()
    
    stats = {status: count for status, count in sessions_stats}
    
    return {
        "khatm_id": khatm.id,
        "title": khatm.title,
        "total_sessions": khatm.total_sessions,
        "completed_sessions": khatm.completed_sessions,
        "remaining_sessions": khatm.total_sessions - khatm.completed_sessions,
        "total_verses": khatm.total_verses,
        "completed_verses": khatm.completed_verses,
        "remaining_verses": khatm.total_verses - khatm.completed_verses,
        "progress_percentage": round(khatm.completed_sessions / khatm.total_sessions * 100, 2) if khatm.total_sessions > 0 else 0,
        "verses_percentage": round(khatm.completed_verses / khatm.total_verses * 100, 2) if khatm.total_verses > 0 else 0,
        "session_stats": {
            "scheduled": stats.get("scheduled", 0),
            "completed": stats.get("completed", 0),
            "skipped": stats.get("skipped", 0),
            "missed": stats.get("missed", 0)
        },
        "is_active": khatm.is_active,
        "is_completed": khatm.is_completed
    }
