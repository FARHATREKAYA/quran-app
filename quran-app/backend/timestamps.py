#!/usr/bin/env python3
"""
Verse timestamps for accurate audio synchronization
Uses data from mp3quran.net timing files
"""
from typing import Dict, List, Tuple
import json

# Verse timestamps for common reciters (in seconds)
# Format: {reciter_id: {surah_number: [(verse_num, start_time, end_time), ...]}}
# These are sample timestamps - in production, fetch from actual timing files

# For Abdul Basit (Mujawwad) - sample data for Al-Fatiha (Surah 1)
# Timestamps are approximate and should be replaced with actual data
VERSE_TIMESTAMPS = {
    # Abdul Basit Mujawwad
    1: {
        1: [
            (1, 0.0, 7.0),      # Bismillah
            (2, 7.0, 15.0),     # Alhamdu lillahi
            (3, 15.0, 20.0),    # Ar-Rahmanir-Rahim
            (4, 20.0, 26.0),    # Maliki yawmid-din
            (5, 26.0, 32.0),    # Iyyaka na'budu
            (6, 32.0, 38.0),    # Ihdinas-siratal
            (7, 38.0, 48.0),    # Siratal-ladhina
        ]
    },
    # Al-Afasy
    2: {},
    # Al-Husary
    3: {},
}

def get_verse_timestamp(reciter_id: int, surah_number: int, verse_number: int) -> Tuple[float, float]:
    """Get start and end timestamp for a specific verse"""
    if reciter_id in VERSE_TIMESTAMPS:
        if surah_number in VERSE_TIMESTAMPS[reciter_id]:
            for v_num, start, end in VERSE_TIMESTAMPS[reciter_id][surah_number]:
                if v_num == verse_number:
                    return (start, end)
    return (0.0, 0.0)

def get_current_verse_from_timestamp(reciter_id: int, surah_number: int, current_time: float) -> int:
    """Get current verse number based on audio timestamp"""
    if reciter_id not in VERSE_TIMESTAMPS:
        return 1
    if surah_number not in VERSE_TIMESTAMPS[reciter_id]:
        return 1
    
    verses = VERSE_TIMESTAMPS[reciter_id][surah_number]
    for verse_num, start, end in verses:
        if start <= current_time < end:
            return verse_num
    
    # If past last verse, return last verse
    if verses:
        return verses[-1][0]
    return 1

def interpolate_verse_timestamps(surah_number: int, verse_count: int, total_duration: float) -> List[Tuple[int, float, float]]:
    """
    Generate approximate timestamps based on verse count and total duration
    This is a fallback when actual timestamps are not available
    """
    timestamps = []
    verse_duration = total_duration / verse_count
    
    for i in range(1, verse_count + 1):
        start = (i - 1) * verse_duration
        end = i * verse_duration
        timestamps.append((i, start, end))
    
    return timestamps

def load_timestamps_from_mp3quran(reciter_id: int, surah_number: int) -> List[Tuple[int, float, float]]:
    """
    Load timestamps from mp3quran.net timing files
    These are typically .txt files with format: verse_number|start_time|end_time
    """
    # This would fetch actual timing data from mp3quran API
    # For now, return empty to use interpolation fallback
    return []

# Reciter mapping
RECITER_TIMESTAMPS = {
    1: "Abdul Basit",      # Has actual timestamp data
    2: "Al-Afasy",         # Uses interpolation
    3: "Al-Husary",        # Uses interpolation
}
