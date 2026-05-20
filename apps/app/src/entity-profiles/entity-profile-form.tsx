import {
  FieldError,
  Form,
  Input,
  Label,
  TextField,
  toast,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { digitsOnly } from '../formatters';

import {
  createEntityProfileSchema,
  type EntityProfile,
} from './entity-profile-schema';

const DEFAULT_VALUES: EntityProfile = {
  pib: '',
  obveznik: '',
  firmaRadnje: '',
  sediste: '',
  sifraPoreskogObveznika: '',
  sifraDelatnosti: '',
};

interface EntityProfileFormProps {
  formId: string;
  profile: EntityProfile | null;
  onSaveProfile: (profile: EntityProfile) => void;
  onSuccess?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function EntityProfileForm({
  formId,
  profile,
  onSaveProfile,
  onSuccess,
  onDirtyChange,
}: EntityProfileFormProps) {
  const { t } = useLingui();

  const { control, handleSubmit, reset, formState } = useForm({
    resolver: zodResolver(createEntityProfileSchema()),
    defaultValues: profile ?? DEFAULT_VALUES,
  });

  useEffect(() => {
    if (profile) reset(profile);
  }, [profile, reset]);

  useEffect(() => {
    onDirtyChange?.(formState.isDirty);
  }, [formState.isDirty, onDirtyChange]);

  function onSubmit(data: EntityProfile) {
    onSaveProfile(data);
    toast.success(t`Profil je sačuvan`);
    onSuccess?.();
  }

  return (
    <Form
      id={formId}
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e);
      }}
    >
      <Controller
        name="pib"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            isInvalid={!!fieldState.error}
            value={field.value}
            onChange={(v) => field.onChange(digitsOnly(v))}
          >
            <Label>{t`PIB`}</Label>
            <Input
              ref={field.ref}
              onBlur={field.onBlur}
              inputMode="numeric"
              maxLength={9}
            />
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </TextField>
        )}
      />

      <Controller
        name="obveznik"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            isInvalid={!!fieldState.error}
            value={field.value}
            onChange={field.onChange}
          >
            <Label>{t`Obveznik`}</Label>
            <Input ref={field.ref} onBlur={field.onBlur} />
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </TextField>
        )}
      />

      <Controller
        name="firmaRadnje"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            isInvalid={!!fieldState.error}
            value={field.value}
            onChange={field.onChange}
          >
            <Label>{t`Firma-radnje`}</Label>
            <Input ref={field.ref} onBlur={field.onBlur} />
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </TextField>
        )}
      />

      <Controller
        name="sediste"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            isInvalid={!!fieldState.error}
            value={field.value}
            onChange={field.onChange}
          >
            <Label>{t`Sedište`}</Label>
            <Input ref={field.ref} onBlur={field.onBlur} />
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </TextField>
        )}
      />

      <Controller
        name="sifraPoreskogObveznika"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            isInvalid={!!fieldState.error}
            value={field.value}
            onChange={(v) => field.onChange(digitsOnly(v))}
          >
            <Label>{t`Šifra poreskog obveznika`}</Label>
            <Input
              ref={field.ref}
              onBlur={field.onBlur}
              inputMode="numeric"
              maxLength={8}
            />
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </TextField>
        )}
      />

      <Controller
        name="sifraDelatnosti"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            isInvalid={!!fieldState.error}
            value={field.value}
            onChange={(v) => field.onChange(digitsOnly(v))}
          >
            <Label>{t`Šifra delatnosti`}</Label>
            <Input
              ref={field.ref}
              onBlur={field.onBlur}
              inputMode="numeric"
              maxLength={4}
            />
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </TextField>
        )}
      />
    </Form>
  );
}
