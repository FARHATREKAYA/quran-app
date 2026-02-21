from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Index, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(100), nullable=True, unique=True)
    password_hash = Column(String(255), nullable=True)  # Null for social auth users
    is_guest = Column(Boolean, default=False)
    
    # Social auth fields
    google_id = Column(String(100), nullable=True, unique=True)
    facebook_id = Column(String(100), nullable=True, unique=True)
    
    # Profile
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Preferences
    preferred_theme = Column(String(20), default="light")
    preferred_language = Column(String(10), default="english")
    
    # Admin privileges
    is_admin = Column(Boolean, default=False)
    
    # Account status
    is_active = Column(Boolean, default=True)  # False = blocked/banned

class Surah(Base):
    __tablename__ = "surahs"
    
    id = Column(Integer, primary_key=True)
    number = Column(Integer, nullable=False, unique=True)
    name_arabic = Column(String(100), nullable=False)
    name_english = Column(String(100), nullable=False)
    name_transliteration = Column(String(100), nullable=False)
    verse_count = Column(Integer, nullable=False)
    revelation_type = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)
    
    verses = relationship("Verse", back_populates="surah")

class Verse(Base):
    __tablename__ = "verses"
    
    id = Column(Integer, primary_key=True)
    surah_id = Column(Integer, ForeignKey("surahs.id"), nullable=False)
    verse_number = Column(Integer, nullable=False)
    verse_number_in_surah = Column(Integer, nullable=False)
    text_arabic = Column(Text, nullable=False)
    text_english = Column(Text, nullable=False)
    text_french = Column(Text, nullable=True)
    tafsir_english = Column(Text, nullable=True)
    tafsir_french = Column(Text, nullable=True)
    juz_number = Column(Integer, nullable=False)
    page_number = Column(Integer, nullable=False)
    
    surah = relationship("Surah", back_populates="verses")
    
    __table_args__ = (
        Index('idx_verse_surah', 'surah_id', 'verse_number_in_surah'),
    )

class AudioRecitation(Base):
    __tablename__ = "audio_recitations"
    
    id = Column(Integer, primary_key=True)
    reciter_id = Column(Integer, ForeignKey("reciters.id"), nullable=False)
    verse_id = Column(Integer, ForeignKey("verses.id"), nullable=False)
    audio_url = Column(String(500), nullable=False)
    format = Column(String(10), nullable=False)  # mp3, ogg, etc.
    bitrate = Column(Integer, nullable=True)
    
    reciter = relationship("Reciter")

class Reciter(Base):
    __tablename__ = "reciters"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    name_arabic = Column(String(100), nullable=True)
    style = Column(String(50), nullable=True)  # Hafs, Warsh, etc.
    is_default = Column(Integer, default=0)

class Bookmark(Base):
    __tablename__ = "bookmarks"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    verse_id = Column(Integer, ForeignKey("verses.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", backref="bookmarks")
    verse = relationship("Verse", backref="bookmarked_by")
    
    __table_args__ = (
        Index('idx_bookmark_user', 'user_id', 'created_at'),
        Index('idx_bookmark_verse', 'verse_id'),
    )

class UserPreference:
    __tablename__ = "user_preferences"

    id: int
    user_id: str
    font_size: int = 16
    theme: str = "light" # light, dark, sepia
    default_translation: str = "english"
    show_tajweed: bool = True
    audio_reciter_id: int | None = None

class Khatm(Base):
    __tablename__ = "khatms"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Schedule settings
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    target_date = Column(DateTime, nullable=True) # When they want to finish
    
    # Reading settings
    frequency_type = Column(String(20), nullable=False) # daily, weekly, custom
    reading_days = Column(String(100), nullable=True) # JSON array of days ["sun", "wed", "fri"]
    reading_time = Column(String(10), nullable=False) # "19:00" format
    timezone = Column(String(50), default="UTC")
    
    # Reading mode
    reading_mode = Column(String(20), default="read_listen") # read_only, read_listen
    enable_audio_break = Column(Boolean, default=True) # Pause after each verse for reading time
    
    # Progress tracking
    total_sessions = Column(Integer, nullable=False) # Total reading sessions
    completed_sessions = Column(Integer, default=0)
    total_verses = Column(Integer, default=6236) # Total verses in Quran
    completed_verses = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_completed = Column(Boolean, default=False)
    
    # Reminder settings
    reminder_minutes_before = Column(Integer, default=30)
    enable_missed_day_notifications = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="khatms")
    sessions = relationship("KhatmSession", back_populates="khatm", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_khatm_user', 'user_id', 'is_active'),
    )

class KhatmSession(Base):
    __tablename__ = "khatm_sessions"

    id = Column(Integer, primary_key=True)
    khatm_id = Column(Integer, ForeignKey("khatms.id"), nullable=False)
    session_number = Column(Integer, nullable=False) # 1, 2, 3...
    scheduled_date = Column(DateTime, nullable=False)
    scheduled_time = Column(String(10), nullable=False) # "19:00"
    
    # Verse range for this session
    start_verse_id = Column(Integer, ForeignKey("verses.id"), nullable=False)
    end_verse_id = Column(Integer, ForeignKey("verses.id"), nullable=False)
    start_verse_global_number = Column(Integer, nullable=False) # 1-6236
    end_verse_global_number = Column(Integer, nullable=False) # 1-6236
    verse_count = Column(Integer, nullable=False)
    
    # Session details
    start_surah_id = Column(Integer, ForeignKey("surahs.id"), nullable=False)
    start_verse_in_surah = Column(Integer, nullable=False)
    end_surah_id = Column(Integer, ForeignKey("surahs.id"), nullable=False)
    end_verse_in_surah = Column(Integer, nullable=False)
    
    # Status tracking
    status = Column(String(20), default="scheduled") # scheduled, completed, skipped, missed
    completed_at = Column(DateTime, nullable=True)
    skipped_at = Column(DateTime, nullable=True)
    skipped_reason = Column(String(100), nullable=True)
    
    # Reading progress within session
    current_verse_id = Column(Integer, ForeignKey("verses.id"), nullable=True)
    verses_read_count = Column(Integer, default=0)
    
    # Reminder tracking
    reminder_sent = Column(Boolean, default=False)
    reminder_sent_at = Column(DateTime, nullable=True)
    missed_notification_sent = Column(Boolean, default=False)
    missed_notification_sent_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    khatm = relationship("Khatm", back_populates="sessions")
    start_verse = relationship("Verse", foreign_keys=[start_verse_id])
    end_verse = relationship("Verse", foreign_keys=[end_verse_id])
    current_verse = relationship("Verse", foreign_keys=[current_verse_id])
    start_surah = relationship("Surah", foreign_keys=[start_surah_id])
    end_surah = relationship("Surah", foreign_keys=[end_surah_id])
    
    __table_args__ = (
        Index('idx_khatm_session_khatm', 'khatm_id', 'session_number'),
        Index('idx_khatm_session_date', 'scheduled_date', 'status'),
    )

class VerseComment(Base):
    __tablename__ = "verse_comments"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    verse_id = Column(Integer, ForeignKey("verses.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_public = Column(Boolean, default=True)  # Public or private comment
    is_approved = Column(Boolean, default=True)  # Admin approval status
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin who approved
    approved_at = Column(DateTime, nullable=True)  # When approved
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="verse_comments", foreign_keys=[user_id])
    verse = relationship("Verse", backref="comments")
    approver = relationship("User", foreign_keys=[approved_by])

    __table_args__ = (
        Index('idx_comment_user', 'user_id', 'created_at'),
        Index('idx_comment_verse', 'verse_id', 'created_at'),
        Index('idx_comment_approved', 'is_approved', 'created_at'),
    )

class VerseReport(Base):
    __tablename__ = "verse_reports"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    verse_id = Column(Integer, ForeignKey("verses.id"), nullable=False)
    report_type = Column(String(50), nullable=False)  # translation_error, audio_error, tafsir_error, other
    description = Column(Text, nullable=False)
    status = Column(String(20), default="pending")  # pending, reviewed, resolved, rejected
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", backref="verse_reports")
    verse = relationship("Verse", backref="reports")
    
    __table_args__ = (
        Index('idx_report_user', 'user_id', 'created_at'),
        Index('idx_report_verse', 'verse_id'),
        Index('idx_report_status', 'status', 'created_at'),
    )