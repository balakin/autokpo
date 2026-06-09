export type Locale = 'sr-Latn' | 'en' | 'ru';

export type LegalDocumentKey = 'privacy' | 'terms';

export type LegalDocumentMeta = {
  key: LegalDocumentKey;
  slug: LegalDocumentKey;
  title: string;
  description: string;
  updated: string;
};

export type LegalLocaleContent = {
  locale: Locale;
  languageName: string;
  ui: {
    app: string;
    updatedPrefix: string;
    themeToggle: string;
    themeLight: string;
    themeDark: string;
    footerTagline: string;
  };
  documents: Record<LegalDocumentKey, LegalDocumentMeta>;
};

const createDocuments = (
  titles: Record<LegalDocumentKey, string>,
  descriptions: Record<LegalDocumentKey, string>,
  updated: string,
): Record<LegalDocumentKey, LegalDocumentMeta> => ({
  privacy: {
    key: 'privacy',
    slug: 'privacy',
    title: titles.privacy,
    description: descriptions.privacy,
    updated,
  },
  terms: {
    key: 'terms',
    slug: 'terms',
    title: titles.terms,
    description: descriptions.terms,
    updated,
  },
});

export const legalContent: Record<Locale, LegalLocaleContent> = {
  'sr-Latn': {
    locale: 'sr-Latn',
    languageName: 'Srpski',
    ui: {
      app: 'Otvori aplikaciju',
      updatedPrefix: 'Ažurirano',
      themeToggle: 'Promeni temu',
      themeLight: 'Pređi na svetlu temu',
      themeDark: 'Pređi na tamnu temu',
      footerTagline:
        'Pomoćni alat za KPO evidenciju · besplatan i otvorenog koda',
    },
    documents: createDocuments(
      {
        privacy: 'Politika privatnosti',
        terms: 'Uslovi korišćenja',
      },
      {
        privacy: 'Kako AutoKPO obrađuje i štiti podatke korisnika.',
        terms: 'Pravila korišćenja AutoKPO veb sajta i aplikacije.',
      },
      '2026-06-06',
    ),
  },
  en: {
    locale: 'en',
    languageName: 'English',
    ui: {
      app: 'Open app',
      updatedPrefix: 'Updated',
      themeToggle: 'Change theme',
      themeLight: 'Switch to light theme',
      themeDark: 'Switch to dark theme',
      footerTagline: 'Helper tool for KPO records · free and open source',
    },
    documents: createDocuments(
      {
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
      },
      {
        privacy: 'How AutoKPO processes and protects user data.',
        terms: 'Rules for using the AutoKPO website and app.',
      },
      '2026-06-06',
    ),
  },
  ru: {
    locale: 'ru',
    languageName: 'Русский',
    ui: {
      app: 'Открыть приложение',
      updatedPrefix: 'Обновлено',
      themeToggle: 'Изменить тему',
      themeLight: 'Переключить на светлую тему',
      themeDark: 'Переключить на темную тему',
      footerTagline:
        'Вспомогательный инструмент для учета KPO · бесплатно и с открытым кодом',
    },
    documents: createDocuments(
      {
        privacy: 'Политика конфиденциальности',
        terms: 'Условия использования',
      },
      {
        privacy: 'Как AutoKPO обрабатывает и защищает данные пользователей.',
        terms: 'Правила использования сайта и приложения AutoKPO.',
      },
      '2026-06-06',
    ),
  },
};

export const legalLocales: Locale[] = ['sr-Latn', 'en', 'ru'];
