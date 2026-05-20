import { Button, Card, Modal, Surface, Tooltip } from '@heroui/react';
import { useLingui, Trans } from '@lingui/react/macro';
import { useId } from 'react';
import { LuPencil } from 'react-icons/lu';

import { SignatureForm } from './signature-form';
import type { Signature } from './signature-schema';

interface SignaturePreviewProps {
  signature?: Signature | null;
  saveSignature?: (signature: Signature) => void;
}

export function SignaturePreview({
  signature,
  saveSignature,
}: SignaturePreviewProps) {
  const formId = useId();
  const { t } = useLingui();

  if (!signature) return null;

  return (
    <Card className="w-full">
      <Card.Header className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-semibold">
          <Trans>Potpis</Trans>
        </h2>
        <Modal>
          <Tooltip delay={700}>
            <Button isIconOnly variant="secondary" aria-label={t`Uredi`}>
              <LuPencil />
            </Button>
            <Tooltip.Content>
              <Trans>Uredi</Trans>
            </Tooltip.Content>
          </Tooltip>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog>
                {({ close }) => (
                  <>
                    <Modal.Header>
                      <Modal.Heading>
                        <Trans>Uredi potpis</Trans>
                      </Modal.Heading>
                      <p className="mt-1.5 text-sm/5  text-muted">
                        <Trans>Izmijenite podatke potpisa.</Trans>
                      </p>
                    </Modal.Header>
                    <Modal.Body className="p-6">
                      <SignatureForm
                        formId={formId}
                        signature={signature}
                        saveSignature={saveSignature}
                        onSuccess={close}
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
      </Card.Header>
      <Card.Content>
        <Surface variant="secondary" className="rounded-xl p-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="text-xs font-medium text-muted">
                <Trans>Sastavio</Trans>
              </dt>
              <dd className="mt-0.5 text-sm">{signature.sastavioIme}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">
                <Trans>Odgovorno lice</Trans>
              </dt>
              <dd className="mt-0.5 text-sm">{signature.odgovornoLiceIme}</dd>
            </div>
          </dl>
        </Surface>
      </Card.Content>
    </Card>
  );
}
