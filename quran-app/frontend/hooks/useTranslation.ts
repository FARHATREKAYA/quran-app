'use client';

import useQuranStore from '@/lib/store';
import { getTranslations } from '@/lib/i18n';

export function useTranslation() {
  const { language } = useQuranStore();
  const t = getTranslations(language);
  
  return { t, language };
}
