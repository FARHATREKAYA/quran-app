from pydantic import BaseModel
from typing import List, Optional

class SurahResponse(BaseModel):
    id: int
    number: int
    name_arabic: str
    name_english: str
    name_transliteration: str
    verse_count: int
    revelation_type: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

class VerseResponse(BaseModel):
    id: int
    surah_id: int
    verse_number: int
    verse_number_in_surah: int
    text_arabic: str
    text_english: str
    text_french: Optional[str] = None
    tafsir_english: Optional[str] = None
    tafsir_french: Optional[str] = None
    juz_number: int
    page_number: int
    surah: Optional[SurahResponse] = None
    
    class Config:
        from_attributes = True

class QuranPageResponse(BaseModel):
    page_number: int
    verses: List[VerseResponse]

class SearchResult(BaseModel):
    query: str
    results: List[VerseResponse]
    count: int