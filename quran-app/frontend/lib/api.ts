import axios from 'axios';
import { Surah, SurahWithVerses, SearchResult, TranslationLanguage } from '@/types/quran';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Quran API
export const quranApi = {
  getAllSurahs: async (): Promise<Surah[]> => {
    const { data } = await api.get('/quran/surahs');
    return data;
  },

  getSurah: async (number: number): Promise<Surah> => {
    const { data } = await api.get(`/quran/surahs/${number}`);
    return data;
  },

  getSurahVerses: async (number: number, translation: TranslationLanguage = 'english'): Promise<SurahWithVerses> => {
    const { data } = await api.get(`/quran/surahs/${number}/verses`, {
      params: { translation },
    });
    return data;
  },

  search: async (query: string, searchIn: 'arabic' | 'translation' | 'both' = 'translation', limit: number = 20): Promise<SearchResult> => {
    const { data } = await api.get('/quran/search', {
      params: { query, search_in: searchIn, limit },
    });
    return data;
  },

  getAudio: async (surahNumber: number, reciter: number = 1): Promise<{ audio_url: string }> => {
    const { data } = await api.get(`/quran/audio/${surahNumber}`, {
      params: { reciter },
    });
    return data;
  },

  getVerseAudio: async (surahNumber: number, verseNumber: number, reciter: string = 'Alafasy'): Promise<{ audio_url: string }> => {
    const { data } = await api.get(`/quran/audio/verse/${surahNumber}/${verseNumber}`, {
      params: { reciter },
    });
    return data;
  },
};

// Bookmark types
export interface Bookmark {
  id: number;
  user_id: number;
  verse_id: number;
  created_at: string;
  notes: string | null;
  verse: {
    id: number;
    verse_number_in_surah: number;
    text_arabic: string;
    surah: {
      id: number;
      name_arabic: string;
      name_english: string;
      number: number;
    };
  };
}

// Bookmarks API
export const bookmarksApi = {
  getBookmarks: async (token: string): Promise<Bookmark[]> => {
    const { data } = await api.get('/bookmarks/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  createBookmark: async (verseId: number, token: string, notes?: string): Promise<Bookmark> => {
    const { data } = await api.post('/bookmarks/', { verse_id: verseId, notes }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  deleteBookmark: async (bookmarkId: number, token: string): Promise<void> => {
    await api.delete(`/bookmarks/${bookmarkId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  checkBookmark: async (verseId: number, token: string): Promise<{ is_bookmarked: boolean; bookmark_id: number | null }> => {
const { data } = await api.get(`/bookmarks/check/${verseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
  },
};

// Khatm types
export interface Khatm {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  frequency_type: 'daily' | 'weekly' | 'custom';
  reading_days?: string[];
  reading_time: string;
  reading_mode: 'read_only' | 'read_listen';
  enable_audio_break: boolean;
  total_sessions: number;
  completed_sessions: number;
  total_verses: number;
  completed_verses: number;
  progress_percentage: number;
  verses_percentage: number;
  is_active: boolean;
  is_completed: boolean;
  created_at: string;
}

export interface KhatmSession {
  id: number;
  session_number: number;
  scheduled_date: string;
  scheduled_time: string;
  start_surah?: string;
  start_verse_in_surah: number;
  end_surah?: string;
  end_verse_in_surah: number;
  verse_count: number;
  status: 'scheduled' | 'completed' | 'skipped' | 'missed';
  completed_at?: string;
  skipped_at?: string;
  verses_read_count: number;
  current_verse_id?: number | null;
  reading_mode?: 'read_only' | 'read_listen';
  enable_audio_break?: boolean;
}

export interface KhatmCreate {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  frequency_type: 'daily' | 'weekly' | 'custom';
  reading_days?: string[];
  reading_time: string;
  timezone?: string;
  reading_mode: 'read_only' | 'read_listen';
  enable_audio_break: boolean;
  reminder_minutes_before: number;
  enable_missed_day_notifications: boolean;
}

// Khatm API
export const khatmApi = {
  getKhatms: async (token: string, activeOnly = true): Promise<Khatm[]> => {
    const { data } = await api.get('/khatm/', {
      headers: { Authorization: `Bearer ${token}` },
      params: { active_only: activeOnly },
    });
    return data;
  },

  createKhatm: async (khatmData: KhatmCreate, token: string): Promise<{ id: number; message: string }> => {
    const { data } = await api.post('/khatm/', khatmData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  getKhatmDetails: async (khatmId: number, token: string): Promise<Khatm & { sessions: KhatmSession[] }> => {
    const { data } = await api.get(`/khatm/${khatmId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  getTodaySession: async (khatmId: number, token: string): Promise<KhatmSession | { message: string }> => {
    const { data } = await api.get(`/khatm/${khatmId}/today`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  getSessionDetails: async (khatmId: number, sessionId: number, token: string): Promise<KhatmSession & { verses: any[] }> => {
    const { data } = await api.get(`/khatm/${khatmId}/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  completeSession: async (khatmId: number, sessionId: number, versesRead: number, lastVerseId: number | null, token: string): Promise<any> => {
    const { data } = await api.post(`/khatm/${khatmId}/sessions/${sessionId}/complete`, {
      verses_read: versesRead,
      last_verse_id: lastVerseId,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  skipSession: async (khatmId: number, sessionId: number, reason: string | null, token: string): Promise<any> => {
    const { data } = await api.post(`/khatm/${khatmId}/sessions/${sessionId}/skip`, {
      reason,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  deleteKhatm: async (khatmId: number, token: string): Promise<void> => {
    await api.delete(`/khatm/${khatmId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getProgress: async (khatmId: number, token: string): Promise<any> => {
    const { data } = await api.get(`/khatm/${khatmId}/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },
};

// Verse Comment types
export interface VerseComment {
  id: number;
  content: string;
  is_public: boolean;
  created_at: string;
  username: string;
}

export interface VerseCommentWithVerse {
  id: number;
  verse_id: number;
  surah_name: string;
  verse_number: number;
  content: string;
  is_public: boolean;
  created_at: string;
}

// Verse Report types
export interface VerseReport {
  id: number;
  report_type: string;
  description: string;
  status: string;
  created_at: string;
}

export interface VerseReportWithVerse {
  id: number;
  verse_id: number;
  surah_name: string;
  verse_number: number;
  report_type: string;
  description: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

// Verse Interactions API
export const verseInteractionsApi = {
  // Comments
  getVerseComments: async (verseId: number, token: string): Promise<VerseComment[]> => {
    const { data } = await api.get(`/verses/${verseId}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  createComment: async (verseId: number, content: string, isPublic: boolean, token: string): Promise<{ id: number; message: string }> => {
    const { data } = await api.post(`/verses/${verseId}/comments`, {
      content,
      is_public: isPublic,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updateComment: async (verseId: number, commentId: number, content: string, token: string): Promise<{ message: string }> => {
    const { data } = await api.patch(`/verses/${verseId}/comments/${commentId}`, {
      content,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  deleteComment: async (verseId: number, commentId: number, token: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/verses/${verseId}/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  getMyComments: async (token: string): Promise<VerseCommentWithVerse[]> => {
    const { data } = await api.get('/verses/my-comments', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // Reports
  createReport: async (verseId: number, reportType: string, description: string, token: string): Promise<{ id: number; message: string }> => {
    const { data } = await api.post(`/verses/${verseId}/reports`, {
      report_type: reportType,
      description,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  getMyVerseReports: async (verseId: number, token: string): Promise<VerseReport[]> => {
    const { data } = await api.get(`/verses/${verseId}/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  getMyReports: async (token: string): Promise<VerseReportWithVerse[]> => {
    const { data } = await api.get('/verses/my-reports', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  getReportTypes: async (): Promise<{ report_types: { value: string; label: string }[] }> => {
    const { data } = await api.get('/verses/report-types');
    return data;
  },
};

// Admin API Types
export interface AdminComment {
  id: number;
  content: string;
  username: string;
  verse_info: string;
  is_public: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface AdminReport {
  id: number;
  report_type: string;
  description: string;
  username: string;
  verse_info: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface AdminStats {
  pending_comments: number;
  pending_reports: number;
  total_users: number;
  total_comments: number;
  total_reports: number;
  blocked_users: number;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  is_guest: boolean;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

// Admin API
export const adminApi = {
  // Stats
  getStats: async (token: string): Promise<AdminStats> => {
    const { data } = await api.get('/admin/stats', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // Comments Moderation
  getPendingComments: async (token: string): Promise<AdminComment[]> => {
    const { data } = await api.get('/admin/comments/pending', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  getAllComments: async (token: string, approvedOnly?: boolean): Promise<AdminComment[]> => {
    const { data } = await api.get('/admin/comments/all', {
      headers: { Authorization: `Bearer ${token}` },
      params: { approved_only: approvedOnly },
    });
    return data;
  },

  moderateComment: async (commentId: number, action: 'approve' | 'decline' | 'delete', token: string, reason?: string): Promise<{ message: string }> => {
    const { data } = await api.post(`/admin/comments/${commentId}/moderate`, {
      action,
      reason,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // Reports Management
  getAllReports: async (token: string, status?: string): Promise<AdminReport[]> => {
    const { data } = await api.get('/admin/reports', {
      headers: { Authorization: `Bearer ${token}` },
      params: { status },
    });
    return data;
  },

  getPendingReports: async (token: string): Promise<AdminReport[]> => {
    const { data } = await api.get('/admin/reports/pending', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updateReport: async (reportId: number, status: string, adminNotes: string | null, token: string): Promise<{ message: string; report_id: number }> => {
    const { data } = await api.patch(`/admin/reports/${reportId}`, {
      status,
      admin_notes: adminNotes,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // User Management
  getUsers: async (token: string, params?: { skip?: number; limit?: number; search?: string; is_active?: boolean }): Promise<AdminUser[]> => {
    const { data } = await api.get('/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return data;
  },

  blockUser: async (userId: number, token: string): Promise<{ message: string; user_id: number; action: string }> => {
    const { data } = await api.post(`/admin/users/${userId}/block`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  unblockUser: async (userId: number, token: string): Promise<{ message: string; user_id: number; action: string }> => {
    const { data } = await api.post(`/admin/users/${userId}/unblock`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  deleteUser: async (userId: number, token: string): Promise<{ message: string; user_id: number; action: string }> => {
    const { data } = await api.delete(`/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },
};

export default api;