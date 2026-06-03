import { Button, Card, Modal, Surface, Tooltip } from '@heroui/react';
import { useLingui, Trans } from '@lingui/react/macro';
import { useId } from 'react';
import { LuPencil } from 'react-icons/lu';

import { EntityProfileForm } from './entity-profile-form';
import type { EntityProfile } from './entity-profile-schema';

export function EntityProfilePreview({
  profile,
  onSaveProfile,
}: {
  profile: EntityProfile | null;
  onSaveProfile: (profile: EntityProfile) => void;
}) {
  const formId = useId();
  const { t } = useLingui();

  if (!profile) return null;

  return (
    <Card className="w-full">
      <Card.Header className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-semibold">
          <Trans>Podaci o obvezniku</Trans>
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
                        <Trans>Uredi profil</Trans>
                      </Modal.Heading>
                      <p className="mt-1.5 text-sm/5  text-muted">
                        <Trans>Izmijenite podatke profila obveznika.</Trans>
                      </p>
                    </Modal.Header>
                    <Modal.Body className="p-6">
                      <EntityProfileForm
                        formId={formId}
                        profile={profile}
                        onSaveProfile={onSaveProfile}
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
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-muted">
                <Trans>PIB</Trans>
              </dt>
              <dd className="mt-0.5 text-sm">{profile.pib}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">
                <Trans>Obveznik</Trans>
              </dt>
              <dd className="mt-0.5 text-sm">{profile.obveznik}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">
                <Trans>Firma-radnje</Trans>
              </dt>
              <dd className="mt-0.5 text-sm">{profile.firmaRadnje}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">
                <Trans>Sedište</Trans>
              </dt>
              <dd className="mt-0.5 text-sm">{profile.sediste}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">
                <Trans>Šifra poreskog obveznika</Trans>
              </dt>
              <dd className="mt-0.5 text-sm">
                {profile.sifraPoreskogObveznika}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">
                <Trans>Šifra delatnosti</Trans>
              </dt>
              <dd className="mt-0.5 text-sm">{profile.sifraDelatnosti}</dd>
            </div>
          </dl>
        </Surface>
      </Card.Content>
    </Card>
  );
}
