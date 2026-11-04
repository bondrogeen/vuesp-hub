import { createI18n } from 'vue-i18n';

import en from './locales/en.ts';
import ru from './locales/ru.ts';

export const SUPPORTED_LOCALES = ['en', 'ru'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const LOCALE_KEY = 'vuesp-locale';

const isSupportedLocale = (value: string): value is SupportedLocale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(value);

const detectLocale = (): SupportedLocale => {
  try {
    const saved = typeof localStorage === 'undefined' ? null : localStorage.getItem(LOCALE_KEY);
    if (saved && isSupportedLocale(saved)) return saved;
  } catch {
    // localStorage may be unavailable in restricted contexts.
  }

  if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('ru')) return 'ru';
  return 'en';
};

const initialLocale = detectLocale();

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: { en, ru },
});

export const getLocale = (): SupportedLocale => i18n.global.locale.value as SupportedLocale;

export const setLocale = (locale: SupportedLocale): void => {
  i18n.global.locale.value = locale;

  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // Ignore storage failures; the in-memory locale still changes.
  }

  if (typeof document !== 'undefined') document.documentElement.lang = locale;
};

export const translate = (key: string, values?: Record<string, unknown>): string =>
  String(i18n.global.t(key, values ?? {}));

if (typeof document !== 'undefined') document.documentElement.lang = initialLocale;
