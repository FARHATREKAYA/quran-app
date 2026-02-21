from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime
from database import get_db
from models import VerseComment, VerseReport, User, Verse, Bookmark
from auth import get_current_user
from pydantic import BaseModel

router = APIRouter(tags=["admin"])

# Admin check dependency
def require_admin(current_user: dict = Depends(get_current_user)):
    """Verify user is admin"""
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# Pydantic models
class CommentModerationResponse(BaseModel):
    id: int
    content: str
    username: str
    verse_info: str
    is_public: bool
    is_approved: bool
    created_at: datetime

class ReportAdminResponse(BaseModel):
    id: int
    report_type: str
    description: str
    username: str
    verse_info: str
    status: str
    admin_notes: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]

class ModerationAction(BaseModel):
    action: str  # "approve", "decline", "delete"
    reason: Optional[str] = None

class ReportUpdate(BaseModel):
    status: str  # "reviewed", "resolved", "rejected"
    admin_notes: Optional[str] = None

# Admin Comment Endpoints
@router.get("/comments/pending", response_model=List[CommentModerationResponse])
def get_pending_comments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Get all pending comments that need approval"""
    comments = db.query(VerseComment).filter(
        VerseComment.is_approved == False
    ).order_by(desc(VerseComment.created_at)).all()
    
    result = []
    for comment in comments:
        verse = db.query(Verse).filter(Verse.id == comment.verse_id).first()
        verse_info = f"{verse.surah.name_english} {verse.verse_number_in_surah}" if verse else "Unknown"
        
        result.append({
            "id": comment.id,
            "content": comment.content,
            "username": comment.user.username,
            "verse_info": verse_info,
            "is_public": comment.is_public,
            "is_approved": comment.is_approved,
            "created_at": comment.created_at
        })
    
    return result

@router.get("/comments/all", response_model=List[CommentModerationResponse])
def get_all_comments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
    approved_only: bool = False
):
    """Get all comments (admin view)"""
    query = db.query(VerseComment)
    
    if approved_only:
        query = query.filter(VerseComment.is_approved == True)
    
    comments = query.order_by(desc(VerseComment.created_at)).all()
    
    result = []
    for comment in comments:
        verse = db.query(Verse).filter(Verse.id == comment.verse_id).first()
        verse_info = f"{verse.surah.name_english} {verse.verse_number_in_surah}" if verse else "Unknown"
        
        result.append({
            "id": comment.id,
            "content": comment.content,
            "username": comment.user.username,
            "verse_info": verse_info,
            "is_public": comment.is_public,
            "is_approved": comment.is_approved,
            "created_at": comment.created_at
        })
    
    return result

@router.post("/comments/{comment_id}/moderate")
def moderate_comment(
    comment_id: int,
    action: ModerationAction,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Moderate a comment (approve, decline, or delete)"""
    comment = db.query(VerseComment).filter(VerseComment.id == comment_id).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    admin_id = current_user["user_id"]
    
    if action.action == "approve":
        comment.is_approved = True
        comment.approved_by = admin_id
        comment.approved_at = datetime.utcnow()
        message = "Comment approved successfully"
    elif action.action == "decline":
        comment.is_approved = False
        comment.approved_by = admin_id
        comment.approved_at = datetime.utcnow()
        message = "Comment declined"
    elif action.action == "delete":
        db.delete(comment)
        message = "Comment deleted"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    db.commit()
    return {"message": message}

# Admin Report Endpoints
@router.get("/reports", response_model=List[ReportAdminResponse])
def get_all_reports(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
    status: Optional[str] = None
):
    """Get all reports with optional status filter"""
    query = db.query(VerseReport)
    
    if status:
        query = query.filter(VerseReport.status == status)
    
    reports = query.order_by(desc(VerseReport.created_at)).all()
    
    result = []
    for report in reports:
        verse = db.query(Verse).filter(Verse.id == report.verse_id).first()
        verse_info = f"{verse.surah.name_english} {verse.verse_number_in_surah}" if verse else "Unknown"
        
        result.append({
            "id": report.id,
            "report_type": report.report_type,
            "description": report.description,
            "username": report.user.username,
            "verse_info": verse_info,
            "status": report.status,
            "admin_notes": report.admin_notes,
            "created_at": report.created_at,
            "resolved_at": report.resolved_at
        })
    
    return result

@router.get("/reports/pending", response_model=List[ReportAdminResponse])
def get_pending_reports(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Get all pending reports"""
    reports = db.query(VerseReport).filter(
        VerseReport.status == "pending"
    ).order_by(desc(VerseReport.created_at)).all()
    
    result = []
    for report in reports:
        verse = db.query(Verse).filter(Verse.id == report.verse_id).first()
        verse_info = f"{verse.surah.name_english} {verse.verse_number_in_surah}" if verse else "Unknown"
        
        result.append({
            "id": report.id,
            "report_type": report.report_type,
            "description": report.description,
            "username": report.user.username,
            "verse_info": verse_info,
            "status": report.status,
            "admin_notes": report.admin_notes,
            "created_at": report.created_at,
            "resolved_at": report.resolved_at
        })
    
    return result

@router.patch("/reports/{report_id}")
def update_report(
    report_id: int,
    update_data: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Update report status and admin notes"""
    report = db.query(VerseReport).filter(VerseReport.id == report_id).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.status = update_data.status
    report.admin_notes = update_data.admin_notes
    
    if update_data.status in ["resolved", "rejected"]:
        report.resolved_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": f"Report updated to {update_data.status}",
        "report_id": report_id
    }

# Admin Dashboard Stats
@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Get admin dashboard statistics"""
    pending_comments = db.query(VerseComment).filter(
        VerseComment.is_approved == False
    ).count()
    
    pending_reports = db.query(VerseReport).filter(
        VerseReport.status == "pending"
    ).count()
    
    total_users = db.query(User).count()
    total_comments = db.query(VerseComment).count()
    total_reports = db.query(VerseReport).count()
    blocked_users = db.query(User).filter(User.is_active == False).count()
    
    return {
        "pending_comments": pending_comments,
        "pending_reports": pending_reports,
        "total_users": total_users,
        "total_comments": total_comments,
        "total_reports": total_reports,
        "blocked_users": blocked_users
    }


# User Management Endpoints
class UserAdminResponse(BaseModel):
    id: int
    username: str
    email: Optional[str]
    is_guest: bool
    is_admin: bool
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]

class UserActionResponse(BaseModel):
    message: str
    user_id: int
    action: str


@router.get("/users", response_model=List[UserAdminResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """Get all users with optional filtering"""
    query = db.query(User)
    
    if search:
        query = query.filter(User.username.ilike(f"%{search}%"))
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    users = query.offset(skip).limit(limit).all()
    
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_guest": user.is_guest,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "last_login": user.last_login
        }
        for user in users
    ]


@router.post("/users/{user_id}/block", response_model=UserActionResponse)
def block_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Block/ban a user account"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot block admin users"
        )
    
    user.is_active = False
    db.commit()
    
    return {
        "message": f"User {user.username} has been blocked",
        "user_id": user_id,
        "action": "blocked"
    }


@router.post("/users/{user_id}/unblock", response_model=UserActionResponse)
def unblock_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Unblock a user account"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    db.commit()
    
    return {
        "message": f"User {user.username} has been unblocked",
        "user_id": user_id,
        "action": "unblocked"
    }


@router.delete("/users/{user_id}", response_model=UserActionResponse)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Permanently delete a user account and all associated data"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete admin users"
        )
    
    if user.id == current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete your own account"
        )
    
    username = user.username
    
    try:
        # Delete user's bookmarks
        db.query(Bookmark).filter(Bookmark.user_id == user_id).delete()
        
        # Delete user's khatm records
        from models import Khatm
        db.query(Khatm).filter(Khatm.user_id == user_id).delete()
        
        # Delete user's comments
        db.query(VerseComment).filter(VerseComment.user_id == user_id).delete()
        
        # Delete user's reports
        db.query(VerseReport).filter(VerseReport.user_id == user_id).delete()
        
        # Delete the user
        db.delete(user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )
    
    return {
        "message": f"User {username} and all associated data have been permanently deleted",
        "user_id": user_id,
        "action": "deleted"
    }