import { legalContent, type LegalDocumentKey } from './legal';

export type Locale = 'sr-Latn' | 'en' | 'ru';

export type IconName =
  | 'book'
  | 'chart'
  | 'code'
  | 'creditCard'
  | 'fileDown'
  | 'filePlus'
  | 'key'
  | 'lock'
  | 'refresh'
  | 'user';

type LinkText = {
  app: string;
  github: string;
};

type LegalLinkText = Record<LegalDocumentKey, string>;

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
  legalLinks: LegalLinkText;
  support: string;
  notFound: {
    title: string;
    meta: { title: string; description: string };
    message: string;
    navLabel: string;
  };
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
      faq: 'FAQ',
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
    legalLinks: {
      privacy: legalContent['sr-Latn'].documents.privacy.title,
      terms: legalContent['sr-Latn'].documents.terms.title,
    },
    support: 'support@autokpo.com',
    notFound: {
      title: 'Stranica nije pronađena',
      meta: {
        title: '404 — Stranica nije pronađena | AutoKPO',
        description: 'Tražena stranica nije pronađena.',
      },
      message: 'Tražena stranica ne postoji ili je premeštena.',
      navLabel: 'Povratak na početnu stranicu',
    },
    hero: {
      badge: 'Besplatno i otvorenog koda',
      titlePrefix: 'Vodite KPO-knjige ',
      titleEmphasis: 'jednostavno i lako',
      titleSuffix: '.',
      lede: 'Da li ste paušalac u Srbiji? AutoKPO vam pomaže da vodite KPO-knjige u redu — unosi prihoda, knjige po godinama i izvoz u PDF.',
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
          client: 'Primer Trade d.o.o.',
          amount: '1.700.000,00 RSD',
        },
        {
          number: '3',
          date: '12.05.2026.',
          client: 'Primer Logistika d.o.o.',
          amount: '350.000,00 RSD',
        },
        {
          number: '4',
          date: '28.05.2026.',
          client: 'Primer Tech d.o.o.',
          amount: '650.000,00 RSD',
        },
        {
          number: '5',
          date: '01.06.2026.',
          client: 'Primer Servis PR',
          amount: '2.786.856,00 RSD',
        },
      ],
      totalLabel: 'Ukupan prihod · 2026',
      totalAmount: '5.614.259,70 RSD',
    },
    features: {
      eyebrow: 'Mogućnosti',
      title: 'Sve što treba za vođenje KPO knjiga',
      body: 'Od unosa prihoda do izvoza u PDF — s knjigama po godinama, praćenjem paušalnog limita i sinhronizacijom između uređaja.',
      items: [
        {
          icon: 'book',
          title: 'Knjige po godinama',
          body: 'Zasebna knjiga za svaku godinu. Prošli periodi su uvek dostupni.',
        },
        {
          icon: 'filePlus',
          title: 'Unosi prihoda',
          body: 'Unosi prihoda u RSD s automatskom konverzijom iz bilo koje valute.',
        },
        {
          icon: 'chart',
          title: 'Pregled i paušalni limit',
          body: 'Prihod po godinama uz jasan prikaz koliko ste blizu paušalnog limita.',
        },
        {
          icon: 'fileDown',
          title: 'Izvoz u PDF',
          body: 'Izvezite KPO-knjigu u PDF — spremno za štampu ili arhiviranje.',
        },
        {
          icon: 'lock',
          title: 'Šifrovana sinhronizacija',
          body: 'Sinhronizacija između uređaja. Podaci su uvek šifrovani.',
        },
        {
          icon: 'code',
          title: 'Otvoren kod',
          body: 'Kod je otvoren pod AGPL-3.0 i dostupan na GitHub-u. Ništa skriveno.',
        },
      ],
    },
    trust: {
      eyebrow: 'Sigurnost',
      title: 'Nalog i sinhronizacija',
      body: 'Registrujte se emailom ili putem Google ili GitHub naloga. Svi vaši uređaji automatski se sinhronizuju, a svi podaci su end-to-end šifrovani.',
      items: [
        {
          icon: 'user',
          title: 'Prijava emailom ili OAuth',
          body: 'Registrujte se emailom ili jednim klikom putem Google ili GitHub naloga.',
        },
        {
          icon: 'key',
          title: 'Lozinka za šifrovanje',
          body: 'Pri prvoj prijavi kreirate posebnu lozinku za šifrovanje — ona nikada ne napušta vaš uređaj. Važno: ne možemo obnoviti ovu lozinku. Bez nje, svi podaci su trajno izgubljeni.',
        },
        {
          icon: 'lock',
          title: 'End-to-end šifrovanje',
          body: 'Svi podaci su šifrovani pre nego što napuste vaš uređaj. Server nikada ne vidi sadržaj vaše knjige u čitljivom obliku.',
        },
        {
          icon: 'refresh',
          title: 'Sinhronizacija između uređaja',
          body: 'Radite sa bilo kog uređaja. Podaci se automatski sinhronizuju.',
        },
        {
          icon: 'code',
          title: 'Otvoren za proveru',
          body: 'Izvorni kod je otvoren — svako može da proveri kako aplikacija radi.',
        },
      ],
    },
    faq: {
      eyebrow: 'Česta pitanja',
      title: 'Što je važno znati',
      note: 'AutoKPO je alat za evidenciju, ne pravna ili poreska usluga. Za zvanične savete obratite se stručnjacima.',
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
            'Podaci se čuvaju lokalno na vašem uređaju i sinhronizuju sa Cloudflare serverima u EU. Svi podaci knjige su šifrovani — i na uređaju i na serveru. Podaci naloga (email, Google ili GitHub) i podaci sesija čuvaju se na serveru u čitljivom obliku — to je neophodno za prijavu i omogućava vam pregled i brisanje aktivnih sesija.',
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
        {
          question: 'Zaboravio sam lozinku za šifrovanje. Šta da radim?',
          answerHtml:
            'Ne možemo obnoviti lozinku za šifrovanje. Možete pokušati da je se setite — ili da obrišete nalog i počnete iznova. U tom slučaju, svi podaci će biti trajno izgubljeni.',
        },
      ],
    },
    final: {
      title: 'Počnite odmah',
      bodyHtml:
        'Bez pretplate, bez instalacije.<br />Prijavite se i počnite da vodite KPO evidenciju.',
    },
    footer: {
      taglinePrefix: 'by',
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
      faq: 'FAQ',
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
    legalLinks: {
      privacy: legalContent.en.documents.privacy.title,
      terms: legalContent.en.documents.terms.title,
    },
    support: 'support@autokpo.com',
    notFound: {
      title: 'Page not found',
      meta: {
        title: '404 — Page not found | AutoKPO',
        description: 'The page you requested could not be found.',
      },
      message: 'The page you requested does not exist or has been moved.',
      navLabel: 'Back to homepage',
    },
    hero: {
      badge: 'Free and open source',
      titlePrefix: 'Keep your KPO book ',
      titleEmphasis: 'effortlessly',
      titleSuffix: '.',
      lede: 'Are you a flat-rate taxpayer in Serbia? AutoKPO helps you keep your KPO book in order — income entries, yearly books and PDF export.',
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
          date: '11.03.2026.',
          client: 'Primer Studio d.o.o.',
          amount: '127,403.70 RSD',
        },
        {
          number: '2',
          date: '15.04.2026.',
          client: 'Primer Trade d.o.o.',
          amount: '1,700,000.00 RSD',
        },
        {
          number: '3',
          date: '12.05.2026.',
          client: 'Primer Logistika d.o.o.',
          amount: '350,000.00 RSD',
        },
        {
          number: '4',
          date: '28.05.2026.',
          client: 'Primer Tech d.o.o.',
          amount: '650,000.00 RSD',
        },
        {
          number: '5',
          date: '01.06.2026.',
          client: 'Primer Servis PR',
          amount: '2,786,856.00 RSD',
        },
      ],
      totalLabel: 'Total income · 2026',
      totalAmount: '5,614,259.70 RSD',
    },
    features: {
      eyebrow: 'Features',
      title: 'Everything needed for keeping KPO books',
      body: 'From recording income to exporting PDF — with yearly books, flat-rate limit tracking and sync across devices.',
      items: [
        {
          icon: 'book',
          title: 'Books by year',
          body: 'A separate book for every year. Past periods are always accessible.',
        },
        {
          icon: 'filePlus',
          title: 'Income entries',
          body: 'Income entries in RSD with automatic conversion from any currency.',
        },
        {
          icon: 'chart',
          title: 'Overview and flat-rate limit',
          body: 'Track income by year and see clearly how close you are to the flat-rate taxation limit.',
        },
        {
          icon: 'fileDown',
          title: 'PDF export',
          body: 'Export your KPO book to PDF — ready for printing or archiving.',
        },
        {
          icon: 'lock',
          title: 'Encrypted synchronization',
          body: 'Sync across devices. Data is always encrypted.',
        },
        {
          icon: 'code',
          title: 'Open source',
          body: 'Code is open under AGPL-3.0 and available on GitHub. Nothing hidden.',
        },
      ],
    },
    trust: {
      eyebrow: 'Security',
      title: 'Account and synchronization',
      body: 'Sign up with email, Google or GitHub. Your devices synchronize automatically, and your application data is end-to-end encrypted.',
      items: [
        {
          icon: 'user',
          title: 'Email or OAuth sign-in',
          body: 'Register with email or in one click using a Google or GitHub account.',
        },
        {
          icon: 'key',
          title: 'Encryption password',
          body: 'On first sign-in you create a separate encryption password — it never leaves your device. Important: we cannot restore this password. Without it, all data is permanently lost.',
        },
        {
          icon: 'lock',
          title: 'End-to-end encryption',
          body: 'Data is encrypted before it leaves your device. The server never sees your book content in readable form.',
        },
        {
          icon: 'refresh',
          title: 'Sync across devices',
          body: 'Work from any device. Data synchronizes automatically.',
        },
        {
          icon: 'code',
          title: 'Open for inspection',
          body: 'The source code is open — anyone can check how the app works.',
        },
      ],
    },
    faq: {
      eyebrow: 'Frequently asked questions',
      title: 'What to know',
      note: 'AutoKPO is a record-keeping tool, not a legal or tax service. For official advice, consult qualified professionals.',
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
            'Data is stored locally on your device and synchronized with Cloudflare servers located in the EU. All book data is encrypted — both on the device and on the server. Account data (email, Google or GitHub) and session data are stored on the server in readable form — this is required for sign-in and lets you view and delete your active sessions.',
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
        {
          question: 'I forgot my encryption password. What can I do?',
          answerHtml:
            'We cannot restore your encryption password. You can try to remember it — or delete your account and start over. In that case, all your data will be permanently lost.',
        },
      ],
    },
    final: {
      title: 'Start right now',
      bodyHtml:
        'No subscription, no installation.<br />Sign in and start keeping KPO records.',
    },
    footer: {
      taglinePrefix: 'by',
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
      faq: 'FAQ',
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
    legalLinks: {
      privacy: legalContent.ru.documents.privacy.title,
      terms: legalContent.ru.documents.terms.title,
    },
    support: 'support@autokpo.com',
    notFound: {
      title: 'Страница не найдена',
      meta: {
        title: '404 — Страница не найдена | AutoKPO',
        description: 'Запрошенная страница не найдена.',
      },
      message: 'Запрошенная страница не существует или была перемещена.',
      navLabel: 'Вернуться на главную',
    },
    hero: {
      badge: 'Бесплатно и open source',
      titlePrefix: 'Ведите KPO-книгу ',
      titleEmphasis: 'без лишних усилий',
      titleSuffix: '.',
      lede: 'Вы паушал в Сербии? AutoKPO поможет держать KPO-книгу в порядке — записи доходов, книги по годам и экспорт в PDF.',
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
          date: '11.03.2026.',
          client: 'Primer Studio d.o.o.',
          amount: '127 403,70 RSD',
        },
        {
          number: '2',
          date: '15.04.2026.',
          client: 'Primer Trade d.o.o.',
          amount: '1 700 000,00 RSD',
        },
        {
          number: '3',
          date: '12.05.2026.',
          client: 'Primer Logistika d.o.o.',
          amount: '350 000,00 RSD',
        },
        {
          number: '4',
          date: '28.05.2026.',
          client: 'Primer Tech d.o.o.',
          amount: '650 000,00 RSD',
        },
        {
          number: '5',
          date: '01.06.2026.',
          client: 'Primer Servis PR',
          amount: '2 786 856,00 RSD',
        },
      ],
      totalLabel: 'Общий доход · 2026',
      totalAmount: '5 614 259,70 RSD',
    },
    features: {
      eyebrow: 'Возможности',
      title: 'Все, что нужно для ведения KPO-книг',
      body: 'От записи дохода до экспорта в PDF — с книгами по годам, контролем паушального лимита и синхронизацией между устройствами.',
      items: [
        {
          icon: 'book',
          title: 'Книги по годам',
          body: 'Отдельная книга на каждый год. Прошлые периоды всегда доступны.',
        },
        {
          icon: 'filePlus',
          title: 'Записи доходов',
          body: 'Записи доходов в RSD с автоматической конвертацией из любой валюты.',
        },
        {
          icon: 'chart',
          title: 'Обзор и паушальный лимит',
          body: 'Доход по годам и понятное отображение того, насколько вы близки к паушальному лимиту.',
        },
        {
          icon: 'fileDown',
          title: 'Экспорт в PDF',
          body: 'Экспортируйте KPO-книгу в PDF — готово для печати или архива.',
        },
        {
          icon: 'lock',
          title: 'Зашифрованная синхронизация',
          body: 'Синхронизация между устройствами. Данные всегда зашифрованы.',
        },
        {
          icon: 'code',
          title: 'Открытый код',
          body: 'Код открыт под AGPL-3.0 и доступен на GitHub. Никаких скрытых частей.',
        },
      ],
    },
    trust: {
      eyebrow: 'Безопасность',
      title: 'Аккаунт и синхронизация',
      body: 'Зарегистрируйтесь по email или через Google/GitHub. Все ваши устройства синхронизируются автоматически, а данные приложения защищены end-to-end шифрованием.',
      items: [
        {
          icon: 'user',
          title: 'Вход по email или OAuth',
          body: 'Зарегистрируйтесь по email или в один клик через аккаунт Google или GitHub.',
        },
        {
          icon: 'key',
          title: 'Пароль шифрования',
          body: 'При первом входе вы создаёте отдельный пароль шифрования — он никогда не покидает ваше устройство. Важно: мы не можем восстановить этот пароль. Без него все данные будут безвозвратно утеряны.',
        },
        {
          icon: 'lock',
          title: 'End-to-end шифрование',
          body: 'Шифрование на стороне устройства — сервер видит только зашифрованные данные.',
        },
        {
          icon: 'refresh',
          title: 'Синхронизация между устройствами',
          body: 'Работайте с любого устройства. Данные синхронизируются автоматически.',
        },
        {
          icon: 'code',
          title: 'Открыто для проверки',
          body: 'Исходный код открыт — любой может проверить, как работает приложение.',
        },
      ],
    },
    faq: {
      eyebrow: 'Частые вопросы',
      title: 'Что важно знать',
      note: 'AutoKPO — инструмент для учета, не юридическая и не налоговая услуга. За официальными консультациями обращайтесь к специалистам.',
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
            'Данные хранятся локально на вашем устройстве и синхронизируются с серверами Cloudflare, расположенными в ЕС. Все данные книги зашифрованы — как на устройстве, так и на сервере. Данные аккаунта (email, Google или GitHub) и данные сессий хранятся на сервере в читаемом виде — это необходимо для входа и позволяет просматривать и удалять активные сессии.',
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
          question: 'AutoKPO работает без интернета?',
          answerHtml:
            '<strong>Да.</strong> AutoKPO — прогрессивное веб-приложение (PWA), которое работает без подключения к интернету. Достаточно один раз войти — после этого можно пользоваться приложением и вносить изменения офлайн. Изменения автоматически синхронизируются после повторного подключения.',
        },
        {
          question: 'Я забыл пароль шифрования. Что делать?',
          answerHtml:
            'Мы не можем восстановить пароль шифрования. Вы можете попробовать вспомнить его — или удалить аккаунт и начать заново. В этом случае все данные будут безвозвратно утеряны.',
        },
      ],
    },
    final: {
      title: 'Начните прямо сейчас',
      bodyHtml:
        'Без подписки, без установки.<br />Войдите и начните вести учет KPO.',
    },
    footer: {
      taglinePrefix: 'by',
    },
  },
};

export const localeAlternates = supportedLocales.map((locale) => ({
  locale,
  route: landingContent[locale].route,
  languageName: landingContent[locale].languageName,
}));
