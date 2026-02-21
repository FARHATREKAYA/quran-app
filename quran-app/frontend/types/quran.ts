export interface Surah {
  id: number;
  number: number;
  name_arabic: string;
  name_english: string;
  name_transliteration: string;
  verse_count: number;
  revelation_type: 'Meccan' | 'Medinan';
  description?: string;
}

export interface Verse {
  id: number;
  surah_id: number;
  verse_number: number;
  verse_number_in_surah: number;
  text_arabic: string;
  text_english: string;
  text_french?: string;
  tafsir_english?: string;
  tafsir_french?: string;
  juz_number: number;
  page_number: number;
  surah?: Surah;
}

export type TranslationLanguage = 'english' | 'arabic' | 'french';

export interface SurahWithVerses {
  surah: Surah;
  verses: Verse[];
}

export interface SearchResult {
  query: string;
  results: Verse[];
  count: number;
}

export type Theme = 'light' | 'dark' | 'sepia';