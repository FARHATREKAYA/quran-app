from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from database import get_db
from models import VerseComment, VerseReport, User, Verse
from auth import get_current_user
from pydantic import BaseModel, Field

router = APIRouter(tags=["verse_interactions"])

# Pydantic models
class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    is_public: bool = True

class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)

class CommentResponse(BaseModel):
    id: int
    content: str
    is_public: bool
    is_approved: bool
    created_at: datetime
    username: str

class ReportCreate(BaseModel):
    report_type: str = Field(..., pattern="^(translation_error|audio_error|tafsir_error|other)$")
    description: str = Field(..., min_length=10, max_length=2000)

class ReportResponse(BaseModel):
    id: int
    report_type: str
    description: str
    status: str
    created_at: datetime

# Comment Endpoints
@router.get("/{verse_id}/comments", response_model=List[CommentResponse])
def get_verse_comments(
    verse_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all approved public comments for a verse plus user's own comments"""
    user_id = current_user["user_id"]
    is_admin = current_user.get("is_admin", False)
    
    # Build query
    query = db.query(VerseComment).filter(VerseComment.verse_id == verse_id)
    
    # If not admin, filter by approval status
    if not is_admin:
        # Regular users see: approved public comments OR their own comments (any status)
        query = query.filter(
            ((VerseComment.is_public == True) & (VerseComment.is_approved == True)) |
            (VerseComment.user_id == user_id)
        )
    
    comments = query.order_by(VerseComment.created_at.desc()).all()
    
    result = []
    for comment in comments:
        # Include if: admin OR approved public OR user's own
        if is_admin or comment.is_approved or comment.user_id == user_id:
            result.append({
                "id": comment.id,
                "content": comment.content,
                "is_public": comment.is_public,
                "is_approved": comment.is_approved,
                "created_at": comment.created_at,
                "username": comment.user.username
            })
    
    return result

@router.post("/{verse_id}/comments", response_model=dict)
def create_comment(
    verse_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Add a comment to a verse"""
    user_id = current_user["user_id"]
    
    # Verify verse exists
    verse = db.query(Verse).filter(Verse.id == verse_id).first()
    if not verse:
        raise HTTPException(status_code=404, detail="Verse not found")
    
    comment = VerseComment(
        user_id=user_id,
        verse_id=verse_id,
        content=comment_data.content,
        is_public=comment_data.is_public
    )
    
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    return {
        "id": comment.id,
        "message": "Comment added successfully"
    }

@router.patch("/{verse_id}/comments/{comment_id}", response_model=dict)
def update_comment(
    verse_id: int,
    comment_id: int,
    comment_data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a comment"""
    user_id = current_user["user_id"]
    
    comment = db.query(VerseComment).filter(
        VerseComment.id == comment_id,
        VerseComment.verse_id == verse_id,
        VerseComment.user_id == user_id
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment.content = comment_data.content
    comment.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Comment updated successfully"}

@router.delete("/{verse_id}/comments/{comment_id}")
def delete_comment(
    verse_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a comment"""
    user_id = current_user["user_id"]
    
    comment = db.query(VerseComment).filter(
        VerseComment.id == comment_id,
        VerseComment.verse_id == verse_id,
        VerseComment.user_id == user_id
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    db.delete(comment)
    db.commit()
    
    return {"message": "Comment deleted successfully"}

@router.get("/my-comments", response_model=List[dict])
def get_my_comments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all comments by current user"""
    user_id = current_user["user_id"]
    
    comments = db.query(VerseComment).filter(
        VerseComment.user_id == user_id
    ).order_by(VerseComment.created_at.desc()).all()
    
    result = []
    for comment in comments:
        result.append({
            "id": comment.id,
            "verse_id": comment.verse_id,
            "surah_name": comment.verse.surah.name_english,
            "verse_number": comment.verse.verse_number_in_surah,
            "content": comment.content,
            "is_public": comment.is_public,
            "created_at": comment.created_at
        })
    
    return result

# Report Endpoints
@router.post("/{verse_id}/reports", response_model=dict)
def create_report(
    verse_id: int,
    report_data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Report an issue with a verse"""
    user_id = current_user["user_id"]
    
    # Verify verse exists
    verse = db.query(Verse).filter(Verse.id == verse_id).first()
    if not verse:
        raise HTTPException(status_code=404, detail="Verse not found")
    
    report = VerseReport(
        user_id=user_id,
        verse_id=verse_id,
        report_type=report_data.report_type,
        description=report_data.description
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return {
        "id": report.id,
        "message": "Report submitted successfully"
    }

@router.get("/{verse_id}/reports", response_model=List[ReportResponse])
def get_my_verse_reports(
    verse_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get current user's reports for a specific verse"""
    user_id = current_user["user_id"]
    
    reports = db.query(VerseReport).filter(
        VerseReport.verse_id == verse_id,
        VerseReport.user_id == user_id
    ).order_by(VerseReport.created_at.desc()).all()
    
    return [
        {
            "id": r.id,
            "report_type": r.report_type,
            "description": r.description,
            "status": r.status,
            "created_at": r.created_at
        }
        for r in reports
    ]

@router.get("/my-reports", response_model=List[dict])
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all reports by current user"""
    user_id = current_user["user_id"]
    
    reports = db.query(VerseReport).filter(
        VerseReport.user_id == user_id
    ).order_by(VerseReport.created_at.desc()).all()
    
    result = []
    for report in reports:
        result.append({
            "id": report.id,
            "verse_id": report.verse_id,
            "surah_name": report.verse.surah.name_english,
            "verse_number": report.verse.verse_number_in_surah,
            "report_type": report.report_type,
            "description": report.description,
            "status": report.status,
            "admin_notes": report.admin_notes,
            "created_at": report.created_at,
            "resolved_at": report.resolved_at
        })
    
    return result

@router.get("/report-types", response_model=dict)
def get_report_types():
    """Get available report types"""
    return {
        "report_types": [
            {"value": "translation_error", "label": "Translation Error"},
            {"value": "audio_error", "label": "Audio Error"},
            {"value": "tafsir_error", "label": "Tafsir/Explanation Error"},
            {"value": "other", "label": "Other Issue"}
        ]
    }