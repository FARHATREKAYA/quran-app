import { en } from './en';
import { ar } from './ar';
import { fr } from './fr';
import { TranslationLanguage } from '@/types/quran';

export const translations = {
  en,
  ar,
  fr,
};

export type Language = TranslationLanguage;
export type Translations = typeof en;

export function getTranslations(language: Language): Translations {
  switch (language) {
    case 'arabic':
      return ar as unknown as Translations;
    case 'french':
      return fr as unknown as Translations;
    case 'english':
    default:
      return en;
  }
}
