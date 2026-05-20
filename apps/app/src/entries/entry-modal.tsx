import { Button, Modal } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import { useId, type ReactNode } from 'react';

import { type EntryModelData, type KpoEntry } from './entries-schema';
import { EntryForm } from './entry-form';

interface EntryModalProps {
  children: ReactNode;
  entry?: KpoEntry;
  year: number;
  onSaveEntry?: (entry: KpoEntry) => void;
}

export function EntryModal({
  children,
  entry,
  year,
  onSaveEntry,
}: EntryModalProps) {
  const formId = useId();

  function handleSave(data: EntryModelData, close: () => void) {
    const newEntry: KpoEntry = {
      ...data,
      id: entry?.id ?? crypto.randomUUID(),
    };
    onSaveEntry?.(newEntry);
    close();
  }

  return (
    <Modal>
      {children}
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            {({ close }) => (
              <>
                <Modal.Header>
                  <Modal.Heading>
                    {entry ? (
                      <Trans>Uredi unos</Trans>
                    ) : (
                      <Trans>Novi unos</Trans>
                    )}
                  </Modal.Heading>
                  <p className="mt-1.5 text-sm/5  text-muted">
                    {entry ? (
                      <Trans>Izmijenite podatke unosa.</Trans>
                    ) : (
                      <Trans>Unesite podatke novog unosa.</Trans>
                    )}
                  </p>
                </Modal.Header>
                <Modal.Body className="p-6">
                  <EntryForm
                    formId={formId}
                    entry={entry}
                    year={year}
                    onSuccess={(data) => handleSave(data, close)}
                  />
                </Modal.Body>
                <Modal.Footer>
                  <Button slot="close" variant="secondary">
                    <Trans>Otkaži</Trans>
                  </Button>
                  <Button type="submit" form={formId}>
                    <Trans>Sačuvaj</Trans>
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
