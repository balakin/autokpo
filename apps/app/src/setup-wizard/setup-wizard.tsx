import { useState } from 'react';
import { useBlocker } from 'react-router';

import { useBookId } from '../books/use-book-id';
import { useDoc, useYDoc } from '../crdt';
import type { EntityProfile } from '../entity-profiles/entity-profile-schema';
import { profileMutations } from '../entity-profiles/profile-mutations';
import { profileSelectors } from '../entity-profiles/profile-selectors';
import { signatureMutations } from '../signatures/signature-mutations';
import type { Signature } from '../signatures/signature-schema';
import { signatureSelectors } from '../signatures/signature-selectors';

import { ProfileStep } from './profile-step';
import { SignatureStep } from './signature-step';
import { StartStep } from './start-step';
import { UnsavedChangesDialog } from './unsaved-changes-dialog';
import { WizardStepper } from './wizard-stepper';
import type { WizardStep } from './wizard-stepper';

export function SetupWizard() {
  const ydoc = useDoc();
  const bookId = useBookId();
  const profile = useYDoc(profileSelectors.active(bookId));
  const signature = useYDoc(signatureSelectors.active(bookId));

  const [step, setStep] = useState<WizardStep>(() =>
    profile === null ? 'start' : 'signature',
  );

  const [isDirty, setIsDirty] = useState(false);
  const [pendingStep, setPendingStep] = useState<WizardStep | null>(null);

  const handleSetStep = (nextStep: WizardStep) => {
    if (isDirty) {
      setPendingStep(nextStep);
      return;
    }
    setStep(nextStep);
  };

  const handleFormSuccess = (nextStep: WizardStep) => {
    setIsDirty(false);
    setStep(nextStep);
  };

  const handleDirtyChange = (dirty: boolean) => {
    setIsDirty(dirty);
  };

  const handleSaveProfile = (data: EntityProfile) => {
    profileMutations.save(ydoc, bookId, data);
  };

  const handleSaveSignature = (data: Signature) => {
    signatureMutations.save(ydoc, bookId, data);
  };

  const blocker = useBlocker(isDirty);

  const isDialogOpen = blocker.state === 'blocked' || pendingStep !== null;

  const handleConfirm = () => {
    if (pendingStep !== null) {
      setIsDirty(false);
      setStep(pendingStep);
      setPendingStep(null);
    } else {
      blocker.proceed?.();
    }
  };

  const handleCancel = () => {
    if (pendingStep !== null) {
      setPendingStep(null);
    } else {
      blocker.reset?.();
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 pt-6 lg:p-6">
      <WizardStepper step={step} setStep={handleSetStep} />
      <div className="mx-auto w-full max-w-2xl">
        {step === 'start' ? (
          <StartStep onNext={() => handleSetStep('profile')} />
        ) : step === 'profile' ? (
          <ProfileStep
            profile={profile}
            onSaveProfile={handleSaveProfile}
            onNext={() => handleFormSuccess('signature')}
            onDirtyChange={handleDirtyChange}
          />
        ) : (
          <SignatureStep
            signature={signature}
            saveSignature={handleSaveSignature}
            onDirtyChange={handleDirtyChange}
          />
        )}
      </div>

      <UnsavedChangesDialog
        isOpen={isDialogOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
