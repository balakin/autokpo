import { Button, Card } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import { useId } from 'react';

import { EntityProfileForm } from '../entity-profiles/entity-profile-form';
import type { EntityProfile } from '../entity-profiles/entity-profile-schema';

interface ProfileStepProps {
  profile: EntityProfile | null;
  onSaveProfile: (profile: EntityProfile) => void;
  onNext: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function ProfileStep({
  profile,
  onSaveProfile,
  onNext,
  onDirtyChange,
}: ProfileStepProps) {
  const formId = useId();

  return (
    <Card className="w-full">
      <Card.Header>
        <h2 className="text-lg font-semibold">
          <Trans>Podaci o obvezniku</Trans>
        </h2>
      </Card.Header>
      <Card.Content>
        <EntityProfileForm
          formId={formId}
          profile={profile}
          onSaveProfile={onSaveProfile}
          onSuccess={onNext}
          onDirtyChange={onDirtyChange}
        />
      </Card.Content>
      <Card.Footer>
        <Button type="submit" form={formId}>
          <Trans>Dalje</Trans>
        </Button>
      </Card.Footer>
    </Card>
  );
}
