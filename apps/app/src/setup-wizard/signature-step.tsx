import { Button, Card } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import { useId } from 'react';

import { SignatureForm } from '../signatures/signature-form';
import type { Signature } from '../signatures/signature-schema';

interface SignatureStepProps {
  signature?: Signature | null;
  saveSignature?: (signature: Signature) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function SignatureStep({
  signature,
  saveSignature,
  onDirtyChange,
}: SignatureStepProps) {
  const formId = useId();

  return (
    <Card className="w-full">
      <Card.Header>
        <h2 className="text-lg font-semibold">
          <Trans>Potpis</Trans>
        </h2>
      </Card.Header>
      <Card.Content>
        <SignatureForm
          formId={formId}
          signature={signature}
          saveSignature={saveSignature}
          onDirtyChange={onDirtyChange}
        />
      </Card.Content>
      <Card.Footer>
        <Button type="submit" form={formId}>
          <Trans>Sačuvaj</Trans>
        </Button>
      </Card.Footer>
    </Card>
  );
}
