import {
  Alert,
  Card,
  Label,
  ProgressBar,
  Tabs,
  Tooltip,
  Button,
} from '@heroui/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { LuPlus } from 'react-icons/lu';

import { TopBarActionsSlot } from '../app-shell/top-bar-actions';
import { bookSelectors } from '../books/book-selectors';
import { useBookId } from '../books/use-book-id';
import { ANNUAL_LIMIT } from '../constants';
import { useDoc, useYDoc } from '../crdt';
import { EntityProfilePreview } from '../entity-profiles/entity-profile-preview';
import type { EntityProfile } from '../entity-profiles/entity-profile-schema';
import { profileMutations } from '../entity-profiles/profile-mutations';
import { profileSelectors } from '../entity-profiles/profile-selectors';
import type { KpoEntry } from '../entries/entries-schema';
import { EntriesTable } from '../entries/entries-table';
import { EntryModal } from '../entries/entry-modal';
import { entryMutations } from '../entries/entry-mutations';
import { entrySelectors } from '../entries/entry-selectors';
import { DownloadPdfButton } from '../pdf/download-pdf-button';
import { signatureMutations } from '../signatures/signature-mutations';
import { SignaturePreview } from '../signatures/signature-preview';
import type { Signature } from '../signatures/signature-schema';
import { signatureSelectors } from '../signatures/signature-selectors';
import { thresholdColor } from '../stats/threshold';
import { formatFullCurrency } from '../utils/formatters';

function BookIncomeProgress({ entries }: { entries: KpoEntry[] }) {
  const { t } = useLingui();
  const income = entries.reduce(
    (sum, e) => sum + e.odProdajeProizvoda + e.odIzvrsenihUsluga,
    0,
  );
  const color = thresholdColor(income, ANNUAL_LIMIT);
  const progressValue = Math.min((income / ANNUAL_LIMIT) * 100, 100);
  const limitFormatted = formatFullCurrency(ANNUAL_LIMIT);

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          <Trans>Godišnji prihod</Trans>
        </span>
        <span
          className={
            'font-mono text-sm font-semibold' +
            (color === 'success'
              ? ' text-success'
              : color === 'warning'
                ? ' text-warning'
                : ' text-danger')
          }
        >
          {formatFullCurrency(income)}
        </span>
      </div>
      <ProgressBar
        aria-label={t`Godišnji prihod`}
        value={progressValue}
        color={color}
        size="sm"
        formatOptions={{ style: 'decimal', maximumFractionDigits: 0 }}
      >
        <Label className="sr-only">
          <Trans>Godišnji prihod</Trans>
        </Label>
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
      <p className="text-xs text-muted">
        <Trans>
          Limit: {limitFormatted} (
          <a
            href="https://mfin.gov.rs/sr/propisi-1/zakon-o-porezu-na-dohodak-gradjana-1"
            target="_blank"
            rel="noopener noreferrer"
          >
            čl. 42 ZPDGa
          </a>
          )
        </Trans>
      </p>
    </div>
  );
}

export function WorkingLayout() {
  const { t } = useLingui();
  const ydoc = useDoc();
  const bookId = useBookId();
  const year = useYDoc(bookSelectors.year(bookId));
  const profile = useYDoc(profileSelectors.active(bookId));
  const signature = useYDoc(signatureSelectors.active(bookId));
  const entries = useYDoc(entrySelectors.all(bookId));

  const handleSaveProfile = (nextProfile: EntityProfile) => {
    profileMutations.save(ydoc, bookId, nextProfile);
  };

  const handleSaveSignature = (nextSignature: Signature) => {
    signatureMutations.save(ydoc, bookId, nextSignature);
  };

  const handleAddEntry = (entry: KpoEntry) => {
    entryMutations.add(ydoc, bookId, entry);
  };

  const handleUpdateEntry = (entry: KpoEntry) => {
    entryMutations.update(ydoc, bookId, entry);
  };

  const handleDeleteEntry = (id: string) => {
    entryMutations.remove(ydoc, bookId, id);
  };

  if (year === null) return null;

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Inject DownloadPdfButton into AppShell top bar */}
      <TopBarActionsSlot>
        <DownloadPdfButton />
      </TopBarActionsSlot>

      {/* Draft warning — always visible regardless of active tab */}
      <Alert status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Description>
            <Trans>
              Preuzeti dokument je nacrt. Obavezno ga potpišite i overite
              pečatom (Član 13, stav 2 Pravilnika o poslovnim knjigama).
            </Trans>
          </Alert.Description>
        </Alert.Content>
      </Alert>

      {/* Tab-based navigation: Unosi / Profil / Potpis */}
      <Tabs defaultSelectedKey="unosi">
        <Tabs.ListContainer>
          <Tabs.List aria-label={t`Sadržaj knjige`}>
            <Tabs.Tab id="unosi">
              <Trans>Unosi</Trans>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="profil">
              <Trans>Profil</Trans>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="potpis">
              <Trans>Potpis</Trans>
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="unosi" className="pt-4">
          <div className="flex flex-col gap-4">
            <BookIncomeProgress entries={entries} />
            <Card className="w-full">
              <Card.Header className="flex flex-row items-center justify-between">
                <h2 className="text-lg font-semibold">
                  <Trans>KPO unosi</Trans>
                </h2>
                <EntryModal year={year} onSaveEntry={handleAddEntry}>
                  <Tooltip delay={700}>
                    <Button isIconOnly aria-label={t`Dodaj unos`}>
                      <LuPlus />
                    </Button>
                    <Tooltip.Content>
                      <Trans>Dodaj unos</Trans>
                    </Tooltip.Content>
                  </Tooltip>
                </EntryModal>
              </Card.Header>
              <Card.Content>
                <EntriesTable
                  entries={entries}
                  year={year}
                  onSaveEntry={handleUpdateEntry}
                  onDeleteEntry={handleDeleteEntry}
                />
              </Card.Content>
            </Card>
          </div>
        </Tabs.Panel>

        <Tabs.Panel id="profil" className="pt-4">
          <EntityProfilePreview
            profile={profile}
            onSaveProfile={handleSaveProfile}
          />
        </Tabs.Panel>

        <Tabs.Panel id="potpis" className="pt-4">
          <SignaturePreview
            signature={signature}
            saveSignature={handleSaveSignature}
          />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
