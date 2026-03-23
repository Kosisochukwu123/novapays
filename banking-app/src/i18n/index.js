import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import ar from './locales/ar.json';
import de from './locales/de.json';
import zh from './locales/zh.json';
import it from './locales/it.json';
import pt from './locales/pt.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      ar: { translation: ar },
      de: { translation: de },
      zh: { translation: zh },
      it: { translation: it },
      pt: { translation: pt },
    },
    fallbackLng: 'en',
    // Do NOT hardcode lng here — let LanguageDetector read from localStorage
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',  // key used in localStorage
      caches: ['localStorage'],
    },
    initImmediate: false, // ensures language is set before first render
  });

// Apply direction and lang attribute whenever language changes
const applyLanguageAttributes = (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir  = dir;
  document.documentElement.lang = lng;
  document.body.style.direction  = dir;
};

// Apply on init
applyLanguageAttributes(i18n.language);

// Apply on every change
i18n.on('languageChanged', applyLanguageAttributes);

export default i18n;