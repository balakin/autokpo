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

import { createSignatureSchema, type Signature } from './signature-schema';

const DEFAULT_VALUES: Signature = {
  sastavioIme: '',
  odgovornoLiceIme: '',
};

interface SignatureFormProps {
  formId: string;
  signature?: Signature | null;
  saveSignature?: (signature: Signature) => void;
  onSuccess?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function SignatureForm({
  formId,
  signature,
  saveSignature,
  onSuccess,
  onDirtyChange,
}: SignatureFormProps) {
  const { t } = useLingui();

  const { control, handleSubmit, reset, formState } = useForm({
    resolver: zodResolver(createSignatureSchema()),
    defaultValues: signature ?? DEFAULT_VALUES,
  });

  useEffect(() => {
    if (signature) reset(signature);
  }, [signature, reset]);

  useEffect(() => {
    onDirtyChange?.(formState.isDirty);
  }, [formState.isDirty, onDirtyChange]);

  function onSubmit(data: Signature) {
    saveSignature?.(data);
    toast.success(t`Potpis je sačuvan`);
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
        name="sastavioIme"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            isInvalid={!!fieldState.error}
            value={field.value}
            onChange={field.onChange}
          >
            <Label>{t`Sastavio`}</Label>
            <Input ref={field.ref} onBlur={field.onBlur} />
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </TextField>
        )}
      />

      <Controller
        name="odgovornoLiceIme"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            isInvalid={!!fieldState.error}
            value={field.value}
            onChange={field.onChange}
          >
            <Label>{t`Odgovorno lice`}</Label>
            <Input ref={field.ref} onBlur={field.onBlur} />
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </TextField>
        )}
      />
    </Form>
  );
}
