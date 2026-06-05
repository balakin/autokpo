export type Locale = 'sr-Latn' | 'en' | 'ru';

export type IconName =
  | 'book'
  | 'chart'
  | 'code'
  | 'creditCard'
  | 'fileDown'
  | 'filePlus'
  | 'lock'
  | 'user';

type LinkText = {
  app: string;
  github: string;
};

export type LandingContent = {
  locale: Locale;
  route: string;
  languageName: string;
  meta: {
    title: string;
    description: string;
  };
  skipLink: string;
  navLabel: string;
  nav: {
    features: string;
    security: string;
    faq: string;
  };
  theme: {
    toggle: string;
    light: string;
    dark: string;
  };
  languageSwitcherLabel: string;
  languageSwitcherCurrent: string;
  links: LinkText;
  hero: {
    badge: string;
    titlePrefix: string;
    titleEmphasis: string;
    titleSuffix: string;
    lede: string;
  };
  ledger: {
    title: string;
    columns: {
      number: string;
      description: string;
      amount: string;
    };
    rows: Array<{
      number: string;
      date: string;
      client: string;
      amount: string;
    }>;
    totalLabel: string;
    totalAmount: string;
  };
  features: {
    eyebrow: string;
    title: string;
    body: string;
    items: Array<{
      icon: IconName;
      title: string;
      body: string;
    }>;
  };
  trust: {
    eyebrow: string;
    title: string;
    body: string;
    items: Array<{
      icon: IconName;
      title: string;
      body: string;
    }>;
  };
  faq: {
    eyebrow: string;
    title: string;
    note: string;
    items: Array<{
      question: string;
      answerHtml: string;
    }>;
  };
  final: {
    title: string;
    bodyHtml: string;
  };
  footer: {
    taglinePrefix: string;
  };
};

export const supportedLocales: Locale[] = ['sr-Latn', 'en', 'ru'];

export const landingContent: Record<Locale, LandingContent> = {
  'sr-Latn': {
    locale: 'sr-Latn',
    route: '/',
    languageName: 'Srpski',
    meta: {
      title: 'AutoKPO — KPO evidencija za preduzetnike i paušalce',
      description:
        'AutoKPO je besplatan alat otvorenog koda za vođenje KPO evidencije. Knjige po godinama, unosi prihoda, pregled i izvoz — uz šifrovanu sinhronizaciju.',
    },
    skipLink: 'Pređi na sadržaj',
    navLabel: 'Glavna navigacija',
    nav: {
      features: 'Mogućnosti',
      security: 'Sigurnost',
      faq: 'Pitanja',
    },
    theme: {
      toggle: 'Promeni temu',
      light: 'Pređi na svetlu temu',
      dark: 'Pređi na tamnu temu',
    },
    languageSwitcherLabel: 'Promeni jezik',
    languageSwitcherCurrent: 'Trenutni jezik',
    links: {
      app: 'Otvori aplikaciju',
      github: 'Pogledaj kod',
    },
    hero: {
      badge: 'Besplatno i otvorenog koda',
      titlePrefix: 'KPO evidencija, vođena ',
      titleEmphasis: 'mirno i precizno',
      titleSuffix: '.',
      lede: 'AutoKPO je pomoćni alat za preduzetnike i paušalce za vođenje Knjige o ostvarenom prometu. Knjige po godinama, unosi prihoda i izvoz — bez nepotrebnog šuma.',
    },
    ledger: {
      title: 'KPO unosi',
      columns: {
        number: 'Br.',
        description: 'Datum i opis',
        amount: 'Prihod',
      },
      rows: [
        {
          number: '1',
          date: '11.03.2026.',
          client: 'Primer Studio d.o.o.',
          amount: '127.403,70 RSD',
        },
        {
          number: '2',
          date: '15.04.2026.',
          client: 'Demo Trade d.o.o.',
          amount: '1.700.000,00 RSD',
        },
        {
          number: '3',
          date: '12.05.2026.',
          client: 'Nova Logistika d.o.o.',
          amount: '350.000,00 RSD',
        },
        {
          number: '4',
          date: '28.05.2026.',
          client: 'Alpha Tech d.o.o.',
          amount: '650.000,00 RSD',
        },
        {
          number: '5',
          date: '01.06.2026.',
          client: 'Test Servis PR',
          amount: '2.786.856,00 RSD',
        },
      ],
      totalLabel: 'Ukupan prihod · 2026',
      totalAmount: '5.614.259,70 RSD',
    },
    features: {
      eyebrow: 'Mogućnosti',
      title: 'Sve što treba za urednu KPO knjigu',
      body: 'Alat usmeren na evidenciju — bez suvišnih opcija. Svaki ekran radi jedno i radi ga jasno.',
      items: [
        {
          icon: 'book',
          title: 'Knjige po godinama',
          body: 'Zasebna KPO knjiga za svaku poslovnu godinu, uredno razdvojena i lako dostupna.',
        },
        {
          icon: 'filePlus',
          title: 'Unosi prihoda',
          body: 'Brz unos pojedinačnih stavki prihoda sa datumom, dokumentom i iznosom.',
        },
        {
          icon: 'chart',
          title: 'Pregled i paušalni limit',
          body: 'Prihod po godinama uz jasan prikaz koliko ste blizu paušalnog limita.',
        },
        {
          icon: 'fileDown',
          title: 'PDF i izvoz',
          body: 'Izvoz knjige u PDF i druge formate, spreman za štampu ili dalju obradu.',
        },
        {
          icon: 'lock',
          title: 'Šifrovana sinhronizacija',
          body: 'KPO dokumenti se sinhronizuju u šifrovanom obliku, dostupni sa više uređaja.',
        },
        {
          icon: 'code',
          title: 'Otvoren kod',
          body: 'Ceo izvorni kod je javan pod licencom AGPL-3.0 — proverljiv i bez skrivenih delova.',
        },
      ],
    },
    trust: {
      eyebrow: 'Sigurnost i podaci',
      title: 'Nalog i sinhronizacija',
      body: 'Registrujte se emailom ili putem Google ili GitHub naloga. Svi vaši uređaji automatski se sinhronizuju, a svi podaci su end-to-end šifrovani.',
      items: [
        {
          icon: 'user',
          title: 'Prijava emailom ili OAuth',
          body: 'Registrujte se emailom ili jednim klikom putem Google ili GitHub naloga.',
        },
        {
          icon: 'creditCard',
          title: 'Sinhronizacija između uređaja',
          body: 'Pristupajte KPO knjizi sa svih uređaja. Podaci se automatski sinhronizuju.',
        },
        {
          icon: 'lock',
          title: 'End-to-end šifrovanje',
          body: 'Svi podaci su šifrovani pre nego što napuste vaš uređaj. Server nikada ne vidi sadržaj vaše knjige u čitljivom obliku.',
        },
        {
          icon: 'code',
          title: 'Otvoren za proveru',
          body: 'Izvorni kod je javan pod licencom AGPL-3.0 — svako može da proveri kako aplikacija radi.',
        },
      ],
    },
    faq: {
      eyebrow: 'Česta pitanja',
      title: 'Kratko i praktično',
      note: 'Napomena: AutoKPO je pomoćni alat za evidenciju i ne predstavlja zvaničnu uslugu niti pravni ili poreski savet. Za obavezujuća tumačenja obratite se knjigovođi, savetniku ili nadležnoj instituciji.',
      items: [
        {
          question: 'Da li je AutoKPO besplatan?',
          answerHtml:
            '<strong>Da.</strong> AutoKPO je besplatan i otvorenog koda. Ova verzija nema cenovnik ni pakete — sve mogućnosti su dostupne bez plaćanja.',
        },
        {
          question: 'Da li je AutoKPO zvanična poreska ili pravna usluga?',
          answerHtml:
            '<strong>Ne.</strong> AutoKPO je pomoćni alat za vođenje evidencije. Nije zamena za knjigovođu, poreskog ili pravnog savetnika, niti za nadležnu instituciju. Alat ne garantuje poresku ili pravnu ispravnost vaših podataka.',
        },
        {
          question: 'Gde se čuvaju moji podaci?',
          answerHtml:
            'Podaci KPO knjige čuvaju se lokalno na vašem uređaju u šifrovanom obliku i sinhronizuju se sa serverom — takođe šifrovani. Podaci naloga (email, Google ili GitHub nalog) čuvaju se odvojeno i koriste samo za prijavu.',
        },
        {
          question: 'Može li server da čita moje KPO podatke?',
          answerHtml:
            'Vaši podaci su end-to-end šifrovani. Ključ za šifrovanje izvodi se iz vaše lozinke pomoću algoritma <strong>Argon2id</strong>, a svi podaci šifruju se algoritmom <strong>AES-256-GCM</strong>. Šifrovanje i dešifrovanje odvija se isključivo na vašem uređaju — server nikada ne vidi vaše podatke u čitljivom obliku.',
        },
        {
          question: 'Da li mi je potreban nalog?',
          answerHtml:
            '<strong>Da.</strong> Nalog je potreban za korišćenje aplikacije, prijavu i sinhronizaciju podataka.',
        },
        {
          question: 'Da li AutoKPO radi van mreže?',
          answerHtml:
            '<strong>Da.</strong> AutoKPO je progresivna veb aplikacija (PWA) koja radi i bez internet veze. Dovoljno je da se jednom prijavite — nakon toga možete koristiti aplikaciju i praviti izmene i van mreže. Sve promene sinhronizuju se automatski pri ponovnom povezivanju na mrežu.',
        },
      ],
    },
    final: {
      title: 'Otvorite knjigu kada vama odgovara',
      bodyHtml:
        'Bez pretplate, bez instalacije.<br />Prijavite se i počnite da vodite KPO evidenciju.',
    },
    footer: {
      taglinePrefix: 'Autor',
    },
  },
  en: {
    locale: 'en',
    route: '/en/',
    languageName: 'English',
    meta: {
      title: 'AutoKPO — KPO records for entrepreneurs and flat-rate taxpayers',
      description:
        'AutoKPO is a free, open-source tool for maintaining KPO income records. Yearly books, income entries, overview and export — with encrypted synchronization.',
    },
    skipLink: 'Skip to content',
    navLabel: 'Main navigation',
    nav: {
      features: 'Features',
      security: 'Security',
      faq: 'Questions',
    },
    theme: {
      toggle: 'Change theme',
      light: 'Switch to light theme',
      dark: 'Switch to dark theme',
    },
    languageSwitcherLabel: 'Change language',
    languageSwitcherCurrent: 'Current language',
    links: {
      app: 'Open app',
      github: 'View source',
    },
    hero: {
      badge: 'Free and open source',
      titlePrefix: 'KPO records, kept ',
      titleEmphasis: 'calmly and precisely',
      titleSuffix: '.',
      lede: 'AutoKPO is a helper tool for Serbian entrepreneurs and flat-rate taxpayers who maintain the Book of Turnover Records. Yearly books, income entries and exports — without unnecessary noise.',
    },
    ledger: {
      title: 'KPO entries',
      columns: {
        number: 'No.',
        description: 'Date and description',
        amount: 'Income',
      },
      rows: [
        {
          number: '1',
          date: '11 Mar 2026',
          client: 'Primer Studio d.o.o.',
          amount: '127,403.70 RSD',
        },
        {
          number: '2',
          date: '15 Apr 2026',
          client: 'Demo Trade d.o.o.',
          amount: '1,700,000.00 RSD',
        },
        {
          number: '3',
          date: '12 May 2026',
          client: 'Nova Logistika d.o.o.',
          amount: '350,000.00 RSD',
        },
        {
          number: '4',
          date: '28 May 2026',
          client: 'Alpha Tech d.o.o.',
          amount: '650,000.00 RSD',
        },
        {
          number: '5',
          date: '01 Jun 2026',
          client: 'Test Servis PR',
          amount: '2,786,856.00 RSD',
        },
      ],
      totalLabel: 'Total income · 2026',
      totalAmount: '5,614,259.70 RSD',
    },
    features: {
      eyebrow: 'Features',
      title: 'Everything needed for an orderly KPO book',
      body: 'A focused record-keeping tool — no extra clutter. Each screen does one job and does it clearly.',
      items: [
        {
          icon: 'book',
          title: 'Books by year',
          body: 'A separate KPO book for every business year, clearly separated and easy to access.',
        },
        {
          icon: 'filePlus',
          title: 'Income entries',
          body: 'Quickly record individual income items with date, document and amount.',
        },
        {
          icon: 'chart',
          title: 'Overview and flat-rate limit',
          body: 'Track income by year and see clearly how close you are to the flat-rate taxation limit.',
        },
        {
          icon: 'fileDown',
          title: 'PDF and export',
          body: 'Export the book to PDF and other formats, ready for printing or further processing.',
        },
        {
          icon: 'lock',
          title: 'Encrypted synchronization',
          body: 'KPO documents synchronize in encrypted form and remain available across devices.',
        },
        {
          icon: 'code',
          title: 'Open source',
          body: 'The full source code is public under the AGPL-3.0 license — verifiable and without hidden parts.',
        },
      ],
    },
    trust: {
      eyebrow: 'Security and data',
      title: 'Account and synchronization',
      body: 'Sign up with email, Google or GitHub. Your devices synchronize automatically, and your application data is end-to-end encrypted.',
      items: [
        {
          icon: 'user',
          title: 'Email or OAuth sign-in',
          body: 'Register with email or in one click using a Google or GitHub account.',
        },
        {
          icon: 'creditCard',
          title: 'Sync across devices',
          body: 'Access your KPO book from all your devices. Data synchronizes automatically.',
        },
        {
          icon: 'lock',
          title: 'End-to-end encryption',
          body: 'Data is encrypted before it leaves your device. The server never sees your book content in readable form.',
        },
        {
          icon: 'code',
          title: 'Open for inspection',
          body: 'The source code is public under the AGPL-3.0 license — anyone can check how the app works.',
        },
      ],
    },
    faq: {
      eyebrow: 'Frequently asked questions',
      title: 'Short and practical',
      note: 'Note: AutoKPO is a helper tool for record keeping. It is not an official service and does not provide legal or tax advice. For binding interpretations, consult a bookkeeper, advisor or competent institution.',
      items: [
        {
          question: 'Is AutoKPO free?',
          answerHtml:
            '<strong>Yes.</strong> AutoKPO is free and open source. This version has no pricing plans or packages — all features are available without payment.',
        },
        {
          question: 'Is AutoKPO an official tax or legal service?',
          answerHtml:
            '<strong>No.</strong> AutoKPO is a helper tool for keeping records. It is not a replacement for a bookkeeper, tax advisor, legal advisor or competent institution. The tool does not guarantee the tax or legal correctness of your data.',
        },
        {
          question: 'Where is my data stored?',
          answerHtml:
            'KPO book data is stored locally on your device in encrypted form and synchronized with the server — also encrypted. Account data such as email and linked Google or GitHub accounts is stored separately and used only for sign-in.',
        },
        {
          question: 'Can the server read my KPO data?',
          answerHtml:
            'Your data is end-to-end encrypted. The encryption key is derived from your password using <strong>Argon2id</strong>, and all data is encrypted with <strong>AES-256-GCM</strong>. Encryption and decryption happen only on your device — the server never sees your data in readable form.',
        },
        {
          question: 'Do I need an account?',
          answerHtml:
            '<strong>Yes.</strong> An account is required to use the application, sign in and synchronize data.',
        },
        {
          question: 'Does AutoKPO work offline?',
          answerHtml:
            '<strong>Yes.</strong> AutoKPO is a progressive web app (PWA) that works without an internet connection. Sign in once, then continue using the app and making changes offline. Changes synchronize automatically when you reconnect.',
        },
      ],
    },
    final: {
      title: 'Open your book when it suits you',
      bodyHtml:
        'No subscription, no installation.<br />Sign in and start keeping KPO records.',
    },
    footer: {
      taglinePrefix: 'Made by',
    },
  },
  ru: {
    locale: 'ru',
    route: '/ru/',
    languageName: 'Русский',
    meta: {
      title: 'AutoKPO — учет KPO для предпринимателей и паушальцев',
      description:
        'AutoKPO — бесплатный инструмент с открытым исходным кодом для ведения учета KPO. Книги по годам, записи доходов, обзор и экспорт — с зашифрованной синхронизацией.',
    },
    skipLink: 'Перейти к содержимому',
    navLabel: 'Основная навигация',
    nav: {
      features: 'Возможности',
      security: 'Безопасность',
      faq: 'Вопросы',
    },
    theme: {
      toggle: 'Изменить тему',
      light: 'Переключить на светлую тему',
      dark: 'Переключить на темную тему',
    },
    languageSwitcherLabel: 'Сменить язык',
    languageSwitcherCurrent: 'Текущий язык',
    links: {
      app: 'Открыть приложение',
      github: 'Смотреть код',
    },
    hero: {
      badge: 'Бесплатно и open source',
      titlePrefix: 'Учет KPO, который ведется ',
      titleEmphasis: 'спокойно и точно',
      titleSuffix: '.',
      lede: 'AutoKPO — вспомогательный инструмент для сербских предпринимателей и паушальцев, ведущих книгу учета оборота. Книги по годам, записи доходов и экспорт — без лишнего шума.',
    },
    ledger: {
      title: 'Записи KPO',
      columns: {
        number: '№',
        description: 'Дата и описание',
        amount: 'Доход',
      },
      rows: [
        {
          number: '1',
          date: '11.03.2026',
          client: 'Primer Studio d.o.o.',
          amount: '127 403,70 RSD',
        },
        {
          number: '2',
          date: '15.04.2026',
          client: 'Demo Trade d.o.o.',
          amount: '1 700 000,00 RSD',
        },
        {
          number: '3',
          date: '12.05.2026',
          client: 'Nova Logistika d.o.o.',
          amount: '350 000,00 RSD',
        },
        {
          number: '4',
          date: '28.05.2026',
          client: 'Alpha Tech d.o.o.',
          amount: '650 000,00 RSD',
        },
        {
          number: '5',
          date: '01.06.2026',
          client: 'Test Servis PR',
          amount: '2 786 856,00 RSD',
        },
      ],
      totalLabel: 'Общий доход · 2026',
      totalAmount: '5 614 259,70 RSD',
    },
    features: {
      eyebrow: 'Возможности',
      title: 'Все, что нужно для аккуратной книги KPO',
      body: 'Инструмент сфокусирован на учете — без лишних функций. Каждый экран делает одну задачу и делает ее понятно.',
      items: [
        {
          icon: 'book',
          title: 'Книги по годам',
          body: 'Отдельная книга KPO для каждого делового года, аккуратно разделенная и легко доступная.',
        },
        {
          icon: 'filePlus',
          title: 'Записи доходов',
          body: 'Быстрое добавление отдельных доходов с датой, документом и суммой.',
        },
        {
          icon: 'chart',
          title: 'Обзор и паушальный лимит',
          body: 'Доход по годам и понятное отображение того, насколько вы близки к паушальному лимиту.',
        },
        {
          icon: 'fileDown',
          title: 'PDF и экспорт',
          body: 'Экспорт книги в PDF и другие форматы, готовые для печати или дальнейшей обработки.',
        },
        {
          icon: 'lock',
          title: 'Зашифрованная синхронизация',
          body: 'Документы KPO синхронизируются в зашифрованном виде и доступны с нескольких устройств.',
        },
        {
          icon: 'code',
          title: 'Открытый код',
          body: 'Весь исходный код открыт под лицензией AGPL-3.0 — его можно проверить, скрытых частей нет.',
        },
      ],
    },
    trust: {
      eyebrow: 'Безопасность и данные',
      title: 'Аккаунт и синхронизация',
      body: 'Зарегистрируйтесь по email или через Google/GitHub. Все ваши устройства синхронизируются автоматически, а данные приложения защищены end-to-end шифрованием.',
      items: [
        {
          icon: 'user',
          title: 'Вход по email или OAuth',
          body: 'Зарегистрируйтесь по email или в один клик через аккаунт Google или GitHub.',
        },
        {
          icon: 'creditCard',
          title: 'Синхронизация между устройствами',
          body: 'Открывайте книгу KPO на всех устройствах. Данные синхронизируются автоматически.',
        },
        {
          icon: 'lock',
          title: 'End-to-end шифрование',
          body: 'Данные шифруются до того, как покидают ваше устройство. Сервер никогда не видит содержимое книги в читаемом виде.',
        },
        {
          icon: 'code',
          title: 'Открыто для проверки',
          body: 'Исходный код открыт под лицензией AGPL-3.0 — любой может проверить, как работает приложение.',
        },
      ],
    },
    faq: {
      eyebrow: 'Частые вопросы',
      title: 'Коротко и практично',
      note: 'Примечание: AutoKPO — вспомогательный инструмент для учета. Это не официальная услуга и не юридическая или налоговая консультация. За обязательными толкованиями обращайтесь к бухгалтеру, консультанту или компетентному органу.',
      items: [
        {
          question: 'AutoKPO бесплатный?',
          answerHtml:
            '<strong>Да.</strong> AutoKPO бесплатен и имеет открытый исходный код. В этой версии нет тарифов или пакетов — все возможности доступны без оплаты.',
        },
        {
          question: 'AutoKPO — официальная налоговая или юридическая услуга?',
          answerHtml:
            '<strong>Нет.</strong> AutoKPO — вспомогательный инструмент для ведения учета. Он не заменяет бухгалтера, налогового или юридического консультанта либо компетентный орган. Инструмент не гарантирует налоговую или юридическую корректность ваших данных.',
        },
        {
          question: 'Где хранятся мои данные?',
          answerHtml:
            'Данные книги KPO хранятся локально на вашем устройстве в зашифрованном виде и синхронизируются с сервером — также зашифрованными. Данные аккаунта, например email и связанные аккаунты Google или GitHub, хранятся отдельно и используются только для входа.',
        },
        {
          question: 'Может ли сервер читать мои данные KPO?',
          answerHtml:
            'Ваши данные защищены end-to-end шифрованием. Ключ шифрования выводится из вашего пароля с помощью алгоритма <strong>Argon2id</strong>, а все данные шифруются алгоритмом <strong>AES-256-GCM</strong>. Шифрование и расшифровка происходят только на вашем устройстве — сервер никогда не видит данные в читаемом виде.',
        },
        {
          question: 'Нужен ли аккаунт?',
          answerHtml:
            '<strong>Да.</strong> Аккаунт нужен для использования приложения, входа и синхронизации данных.',
        },
        {
          question: 'AutoKPO работает офлайн?',
          answerHtml:
            '<strong>Да.</strong> AutoKPO — прогрессивное веб-приложение (PWA), которое работает без подключения к интернету. Достаточно один раз войти — после этого можно пользоваться приложением и вносить изменения офлайн. Изменения автоматически синхронизируются после повторного подключения.',
        },
      ],
    },
    final: {
      title: 'Откройте книгу, когда вам удобно',
      bodyHtml:
        'Без подписки, без установки.<br />Войдите и начните вести учет KPO.',
    },
    footer: {
      taglinePrefix: 'Сделано',
    },
  },
};

export const localeAlternates = supportedLocales.map((locale) => ({
  locale,
  route: landingContent[locale].route,
  languageName: landingContent[locale].languageName,
}));
