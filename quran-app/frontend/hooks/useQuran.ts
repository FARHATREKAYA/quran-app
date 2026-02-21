import { useQuery } from '@tanstack/react-query';
import { quranApi } from '@/lib/api';
import { Surah, SurahWithVerses, TranslationLanguage } from '@/types/quran';

// Query keys
export const quranKeys = {
  all: ['quran'] as const,
  surahs: () => [...quranKeys.all, 'surahs'] as const,
  surah: (number: number) => [...quranKeys.all, 'surah', number] as const,
  verses: (number: number, translation: TranslationLanguage) => [...quranKeys.all, 'verses', number, translation] as const,
  search: (query: string) => [...quranKeys.all, 'search', query] as const,
};

// Hooks
export function useSurahs() {
  return useQuery<Surah[]>({
    queryKey: quranKeys.surahs(),
    queryFn: quranApi.getAllSurahs,
  });
}

export function useSurah(number: number, translation: TranslationLanguage = 'english') {
  return useQuery<SurahWithVerses>({
    queryKey: quranKeys.verses(number, translation),
    queryFn: () => quranApi.getSurahVerses(number, translation),
    enabled: !!number,
  });
}

export function useSearch(query: string, enabled: boolean = false) {
  return useQuery({
    queryKey: quranKeys.search(query),
    queryFn: () => quranApi.search(query),
    enabled: enabled && query.length > 0,
  });
}