from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import secrets
import string

from database import get_quran_db
from models import User
from auth import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    get_current_user,
    decode_token
)

router = APIRouter()
security = HTTPBearer()


# Pydantic models for request/response
class UserCreate(BaseModel):
    username: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class GuestLogin(BaseModel):
    pass


class SocialLogin(BaseModel):
    provider: str  # 'google' or 'facebook'
    token: str
    email: Optional[str] = None
    name: Optional[str] = None
    social_id: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


class UserResponse(BaseModel):
    id: int
    username: str
    is_guest: bool
    is_admin: bool
    preferred_theme: str
    preferred_language: str


def generate_guest_username() -> str:
    """Generate a random guest username"""
    random_string = ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(8))
    return f"guest_{random_string}"


@router.post("/register", response_model=TokenResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_quran_db)
):
    """Register a new user with username and password"""
    # Check if username already exists
    result = await db.execute(
        select(User).where(User.username == user_data.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        password_hash=hashed_password,
        is_guest=False
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(new_user.id), "username": new_user.username}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "is_guest": new_user.is_guest,
            "is_admin": new_user.is_admin
        }
    }


@router.post("/login", response_model=TokenResponse)
async def login(
    user_data: UserLogin,
    db: AsyncSession = Depends(get_quran_db)
):
    """Login with username and password"""
    # Find user
    result = await db.execute(
        select(User).where(User.username == user_data.username)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Verify password
    if not user.password_hash or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Check if user is blocked
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked. Please contact support."
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "is_guest": user.is_guest,
            "is_admin": user.is_admin
        }
    }


@router.post("/guest", response_model=TokenResponse)
async def create_guest(
    db: AsyncSession = Depends(get_quran_db)
):
    """Create a guest user account"""
    # Generate unique guest username
    username = generate_guest_username()
    
    # Ensure uniqueness
    while True:
        result = await db.execute(
            select(User).where(User.username == username)
        )
        if not result.scalar_one_or_none():
            break
        username = generate_guest_username()
    
    # Create guest user
    guest_user = User(
        username=username,
        password_hash=None,  # No password for guests
        is_guest=True
    )
    
    db.add(guest_user)
    await db.commit()
    await db.refresh(guest_user)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(guest_user.id), "username": guest_user.username}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": guest_user.id,
            "username": guest_user.username,
            "is_guest": guest_user.is_guest,
            "is_admin": guest_user.is_admin
        }
    }


@router.post("/social", response_model=TokenResponse)
async def social_login(
    social_data: SocialLogin,
    db: AsyncSession = Depends(get_quran_db)
):
    """Login or register with social provider (Google/Facebook)"""
    
    # Check if user already exists with this social ID
    if social_data.provider == "google":
        result = await db.execute(
            select(User).where(User.google_id == social_data.social_id)
        )
    else:  # facebook
        result = await db.execute(
            select(User).where(User.facebook_id == social_data.social_id)
        )
    
    user = result.scalar_one_or_none()
    
    if user:
        # Update last login
        user.last_login = datetime.utcnow()
        await db.commit()
    else:
        # Create new user
        # Generate username from name or social_id
        base_username = social_data.name.lower().replace(" ", "_") if social_data.name else f"user_{social_data.social_id[:8]}"
        username = base_username
        
        # Ensure username is unique
        counter = 1
        while True:
            result = await db.execute(
                select(User).where(User.username == username)
            )
            if not result.scalar_one_or_none():
                break
            username = f"{base_username}_{counter}"
            counter += 1
        
        user = User(
            username=username,
            email=social_data.email,
            password_hash=None,  # No password for social auth
            is_guest=False,
            google_id=social_data.social_id if social_data.provider == "google" else None,
            facebook_id=social_data.social_id if social_data.provider == "facebook" else None
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "is_guest": user.is_guest,
            "is_admin": user.is_admin
        }
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_quran_db)
):
    """Get current user information"""
    result = await db.execute(
        select(User).where(User.id == int(current_user["user_id"]))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "id": user.id,
        "username": user.username,
        "is_guest": user.is_guest,
        "preferred_theme": user.preferred_theme,
        "preferred_language": user.preferred_language
    }


@router.post("/logout")
async def logout():
    """Logout (client should remove token)"""
    return {"message": "Successfully logged out"}
