import { Button, Card } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import { LuArrowRight, LuFileText, LuPencil } from 'react-icons/lu';

interface StartStepProps {
  onNext: () => void;
}

export function StartStep({ onNext }: StartStepProps) {
  return (
    <Card className="w-full">
      <Card.Header>
        <h2 className="text-lg font-semibold">
          <Trans>Podešavanje knjige</Trans>
        </h2>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4 text-muted">
        <p>
          <Trans>
            Da biste mogli da koristite knjigu, potrebno je da popunite:
          </Trans>
        </p>
        <ul className="flex flex-col gap-2">
          <li className="flex items-center gap-2">
            <LuPencil
              className="size-4 shrink-0 text-accent"
              aria-hidden="true"
            />
            <span>
              <span className="font-medium">
                <Trans>Profil</Trans>
              </span>{' '}
              — <Trans>podaci o obvezniku</Trans>
            </span>
          </li>
          <li className="flex items-center gap-2">
            <LuFileText
              className="size-4 shrink-0 text-accent"
              aria-hidden="true"
            />
            <span>
              <span className="font-medium">
                <Trans>Potpis</Trans>
              </span>{' '}
              — <Trans>odgovorno lice i sastavljač za PDF</Trans>
            </span>
          </li>
        </ul>
        <p>
          <Trans>Sve podatke možete promeniti kasnije u podešavanjima.</Trans>
        </p>
      </Card.Content>
      <Card.Footer>
        <Button onPress={onNext}>
          <Trans>Počnite</Trans>
          <LuArrowRight aria-hidden="true" />
        </Button>
      </Card.Footer>
    </Card>
  );
}
