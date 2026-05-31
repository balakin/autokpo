import { AlertDialog, Button, EmptyState, Table, Tooltip } from '@heroui/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { LuInbox, LuPencil, LuTrash } from 'react-icons/lu';

import { formatCurrency, formatDate } from '../utils/formatters';

import type { KpoEntry } from './entries-schema';
import { EntryModal } from './entry-modal';

interface EntriesTableProps {
  entries: KpoEntry[];
  year: number;
  onSaveEntry?: (entry: KpoEntry) => void;
  onDeleteEntry?: (id: string) => void;
}

export function EntriesTable({
  entries,
  year,
  onSaveEntry,
  onDeleteEntry,
}: EntriesTableProps) {
  const { t } = useLingui();

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label={t`KPO unosi`}>
            <Table.Header>
              <Table.Column isRowHeader>
                <Trans>Redni broj</Trans>
              </Table.Column>
              <Table.Column>
                <Trans>Datum i opis knjiženja</Trans>
              </Table.Column>
              <Table.Column>
                <Trans>Od prodaje proizvoda (RSD)</Trans>
              </Table.Column>
              <Table.Column>
                <Trans>Od izvršenih usluga (RSD)</Trans>
              </Table.Column>
              <Table.Column>
                <Trans>Svega (RSD)</Trans>
              </Table.Column>
              <Table.Column>
                <Trans>Akcije</Trans>
              </Table.Column>
            </Table.Header>
            <Table.Body
              renderEmptyState={() => (
                <EmptyState className="my-10 flex size-full  flex-col items-center justify-center gap-4 text-center">
                  <LuInbox className="size-6 text-muted" />
                  <span className="text-sm text-muted">
                    <Trans>Nema unetih stavki</Trans>
                  </span>
                </EmptyState>
              )}
            >
              {entries.map((entry, index) => (
                <Table.Row key={entry.id} id={entry.id}>
                  <Table.Cell>{index + 1}</Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col">
                      <span>{formatDate(entry.datumPrometa)}</span>
                      <span className="text-sm text-muted">
                        {entry.opisPrometa}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-mono">
                      {formatCurrency(entry.odProdajeProizvoda)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-mono">
                      {formatCurrency(entry.odIzvrsenihUsluga)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-mono">
                      {formatCurrency(
                        entry.odProdajeProizvoda + entry.odIzvrsenihUsluga,
                      )}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <EntryModal
                        entry={entry}
                        year={year}
                        onSaveEntry={onSaveEntry}
                      >
                        <Tooltip delay={700}>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="secondary"
                            aria-label={t`Uredi`}
                          >
                            <LuPencil />
                          </Button>
                          <Tooltip.Content>
                            <Trans>Uredi</Trans>
                          </Tooltip.Content>
                        </Tooltip>
                      </EntryModal>
                      <AlertDialog>
                        <Tooltip delay={700}>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="danger-soft"
                            aria-label={t`Obriši`}
                          >
                            <LuTrash />
                          </Button>
                          <Tooltip.Content>
                            <Trans>Obriši</Trans>
                          </Tooltip.Content>
                        </Tooltip>
                        <AlertDialog.Backdrop>
                          <AlertDialog.Container>
                            <AlertDialog.Dialog>
                              <AlertDialog.Header>
                                <AlertDialog.Icon status="danger" />
                                <AlertDialog.Heading>
                                  <Trans>Obrisati unos?</Trans>
                                </AlertDialog.Heading>
                              </AlertDialog.Header>
                              <AlertDialog.Body>
                                <p>
                                  {formatDate(entry.datumPrometa)} —{' '}
                                  {entry.opisPrometa}
                                </p>
                                <p>
                                  <Trans>
                                    Ovu radnju nije moguće poništiti.
                                  </Trans>
                                </p>
                              </AlertDialog.Body>
                              <AlertDialog.Footer>
                                <Button slot="close" variant="tertiary">
                                  <Trans>Otkaži</Trans>
                                </Button>
                                <Button
                                  slot="close"
                                  variant="danger"
                                  onPress={() => onDeleteEntry?.(entry.id)}
                                >
                                  <Trans>Obriši</Trans>
                                </Button>
                              </AlertDialog.Footer>
                            </AlertDialog.Dialog>
                          </AlertDialog.Container>
                        </AlertDialog.Backdrop>
                      </AlertDialog>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
