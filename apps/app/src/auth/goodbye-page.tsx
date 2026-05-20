import { Button, Card } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import { LuArrowRight } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import { AuthShell } from './auth-shell';

export function GoodbyePage() {
  const navigate = useNavigate();

  return (
    <AuthShell>
      <Card className="w-full max-w-md gap-3 border-border bg-surface p-4 shadow-overlay sm:p-6">
        <Card.Header className="gap-1 pb-1">
          <Card.Title className="text-2xl/tight  font-bold tracking-tight">
            <Trans>Nalog je obrisan</Trans>
          </Card.Title>
          <Card.Description className="text-sm">
            <Trans>
              Vaš AutoKPO nalog i sinhronizovani podaci su trajno uklonjeni.
            </Trans>
          </Card.Description>
        </Card.Header>

        <Card.Content className="gap-6 pt-1">
          <p className="text-sm/6  text-muted">
            <Trans>
              Ako ponovo budete želeli da koristite AutoKPO, možete napraviti
              novi nalog u bilo kom trenutku.
            </Trans>
          </p>

          <Button
            fullWidth
            variant="secondary"
            onPress={() => void navigate('/sign-in')}
          >
            <LuArrowRight aria-hidden="true" className="size-4" />
            <Trans>Nazad na prijavu</Trans>
          </Button>
        </Card.Content>
      </Card>
    </AuthShell>
  );
}
