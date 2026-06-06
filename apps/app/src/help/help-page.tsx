import { Card, Link as HeroLink } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';
import {
  LuBug,
  LuFileText,
  LuGitPullRequest,
  LuInfo,
  LuKeyRound,
  LuScale,
  LuShield,
  LuUsers,
} from 'react-icons/lu';

import { useLocale } from '../i18n/use-locale';
import { getLegalLinks } from '../legal/legal-links';

const GITHUB_REPO = 'https://github.com/balakin/autokpo';
const GITHUB_LICENSE = `${GITHUB_REPO}/blob/main/LICENSE`;
const GITHUB_ISSUES = `${GITHUB_REPO}/issues`;
const GITHUB_CONTRIBUTORS = `${GITHUB_REPO}/graphs/contributors`;
const GITHUB_AUTHOR = 'https://github.com/dm-balakin';

const ZAKON_DOHODAK =
  'https://mfin.gov.rs/sr/propisi-1/zakon-o-porezu-na-dohodak-gradjana-1';
const ZAKON_PDV =
  'https://purs.gov.rs/pravna-lica/pdv/zakon/202/zakon-o-porezu-na-dodatu-vrednost.html';

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <HeroLink
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-sm"
    >
      {children}
      <HeroLink.Icon />
    </HeroLink>
  );
}

export function HelpPage() {
  const { locale } = useLocale();
  const legalLinks = getLegalLinks(locale);

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {/* About — full width */}
      <Card>
        <Card.Header className="flex-row items-center gap-2">
          <LuInfo className="size-4 shrink-0 text-muted" aria-hidden="true" />
          <Card.Title>
            <Trans>O projektu</Trans>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <p className="text-sm/relaxed  text-muted">
            <Trans>
              AutoKPO je besplatna aplikacija otvorenog koda za vođenje{' '}
              <strong className="text-foreground">
                Knjige o ostvarenom prometu (KPO)
              </strong>
              . Podaci se čuvaju lokalno na vašem uređaju i sinhronizuju između
              vaših uređaja.
            </Trans>
          </p>
        </Card.Content>
      </Card>

      {/* Encryption — full width */}
      <Card>
        <Card.Header className="flex-row items-center gap-2">
          <LuKeyRound
            className="size-4 shrink-0 text-muted"
            aria-hidden="true"
          />
          <Card.Title>
            <Trans>Šifrovanje</Trans>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <p className="text-sm/relaxed  text-muted">
            <Trans>
              Vaši podaci su end-to-end šifrovani. Ključ za šifrovanje se izvodi
              iz vaše lozinke{' '}
              <strong className="text-foreground">Argon2id</strong> algoritmom,
              a svi podaci se šifruju{' '}
              <strong className="text-foreground">AES-256-GCM</strong>{' '}
              algoritmom. Server nikada ne vidi vaše podatke u čitljivom obliku.
            </Trans>
          </p>
        </Card.Content>
      </Card>

      {/* Reference — 2 columns */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
        <Card>
          <Card.Header className="flex-row items-center gap-2">
            <LuBug className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <Card.Title>
              <Trans>Kako prijaviti problem</Trans>
            </Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col gap-3">
            <p className="text-sm/relaxed  text-muted">
              <Trans>
                Ako ste naišli na grešku ili imate predlog za poboljšanje,
                otvorite tiket na GitHub-u. Opišite šta se dogodilo, šta ste
                očekivali i korake za reprodukciju.
              </Trans>
            </p>
            <ExternalLink href={GITHUB_ISSUES}>
              <Trans>Prijavite problem na GitHub-u</Trans>
            </ExternalLink>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex-row items-center gap-2">
            <LuScale
              className="size-4 shrink-0 text-muted"
              aria-hidden="true"
            />
            <Card.Title>
              <Trans>Zakonski propisi</Trans>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <ul className="flex flex-col gap-3">
              <li className="flex flex-col gap-0.5">
                <ExternalLink href={ZAKON_DOHODAK}>
                  <Trans>Zakon o porezu na dohodak građana</Trans>
                </ExternalLink>
                <span className="text-xs text-muted">
                  <Trans>čl. 42 — godišnji limit</Trans>
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <ExternalLink href={ZAKON_PDV}>
                  <Trans>Zakon o porezu na dodatu vrednost</Trans>
                </ExternalLink>
                <span className="text-xs text-muted">
                  <Trans>čl. 33 — rolling 12 meseci</Trans>
                </span>
              </li>
            </ul>
          </Card.Content>
        </Card>
      </div>

      {/* Contribute + Authors — 2 columns */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
        <Card>
          <Card.Header className="flex-row items-center gap-2">
            <LuGitPullRequest
              className="size-4 shrink-0 text-muted"
              aria-hidden="true"
            />
            <Card.Title>
              <Trans>Doprinesite projektu</Trans>
            </Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col gap-3">
            <p className="text-sm/relaxed  text-muted">
              <Trans>
                Ako želite da poboljšate AutoKPO, vaši pull request-ovi su
                dobrodošli.
              </Trans>
            </p>
            <ExternalLink href={GITHUB_REPO}>
              <Trans>Izvorni kod na GitHub-u</Trans>
            </ExternalLink>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex-row items-center gap-2">
            <LuUsers
              className="size-4 shrink-0 text-muted"
              aria-hidden="true"
            />
            <Card.Title>
              <Trans>Autori</Trans>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <ul className="flex flex-col gap-3">
              <li className="flex flex-col gap-0.5">
                <ExternalLink href={GITHUB_AUTHOR}>
                  Dmitrii Balakin
                </ExternalLink>
                <span className="text-xs text-muted">
                  <Trans>Osnivač projekta</Trans>
                </span>
              </li>
              <li>
                <ExternalLink href={GITHUB_CONTRIBUTORS}>
                  <Trans>Svi doprinosioci</Trans>
                </ExternalLink>
              </li>
            </ul>
          </Card.Content>
        </Card>
      </div>

      {/* Rules + License — 2 columns */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
        <Card>
          <Card.Header className="flex-row items-center gap-2">
            <LuFileText
              className="size-4 shrink-0 text-muted"
              aria-hidden="true"
            />
            <Card.Title>
              <Trans>Pravila i privatnost</Trans>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <ul className="flex flex-col gap-3">
              <li>
                <ExternalLink href={legalLinks.terms}>
                  <Trans>Uslovi korišćenja</Trans>
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={legalLinks.privacy}>
                  <Trans>Politika privatnosti</Trans>
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={legalLinks.cookies}>
                  <Trans>Politika kolačića</Trans>
                </ExternalLink>
              </li>
            </ul>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex-row items-center gap-2">
            <LuShield
              className="size-4 shrink-0 text-muted"
              aria-hidden="true"
            />
            <Card.Title>
              <Trans>Licenca</Trans>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <ul className="flex flex-col gap-3">
              <li className="flex flex-col gap-0.5">
                <ExternalLink href={GITHUB_LICENSE}>AGPL-3.0</ExternalLink>
                <span className="text-xs text-muted">
                  <Trans>GNU Affero General Public License v3.0</Trans>
                </span>
              </li>
            </ul>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
