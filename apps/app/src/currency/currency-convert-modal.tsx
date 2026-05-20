import {
  Alert,
  Button,
  ComboBox,
  FieldError,
  Form,
  Input,
  InputGroup,
  Label,
  Link,
  ListBox,
  Modal,
  Skeleton,
  TextField,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useId } from 'react';
import CurrencyInput from 'react-currency-input-field';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { formatCurrency, formatFullCurrency } from '../formatters';
import { useLocale } from '../i18n/use-locale';

import { convertToRsd } from './convert-to-rsd';
import { useCurrencies, useExchangeRate } from './use-exchange-rates';

const NBS_URL =
  'https://webappcenter.nbs.rs/ExchangeRateWebApp/ExchangeRate/IndexPeriod?isSearchExecuted=false';
const KURS_RESENJE_ORG_URL = 'https://kurs.resenje.org';

function createCurrencyConvertSchema() {
  return z.object({
    currency: z.string().min(1, t`Polje je obavezno`),
    foreignAmount: z.string().min(1, t`Polje je obavezno`),
  });
}

type CurrencyConvertFormData = z.infer<
  ReturnType<typeof createCurrencyConvertSchema>
>;

interface CurrencyConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (rsdValue: string) => void;
  datumPrometa: string;
  fieldLabel: string;
}

export function CurrencyConvertModal({
  isOpen,
  onClose,
  onApply,
  datumPrometa,
  fieldLabel,
}: CurrencyConvertModalProps) {
  const { locale } = useLocale();
  const formId = useId();
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(createCurrencyConvertSchema()),
    defaultValues: { currency: 'EUR', foreignAmount: '' },
  });

  const selectedCurrency = useWatch({ control, name: 'currency' });
  const foreignAmount = useWatch({ control, name: 'foreignAmount' });

  const currenciesQuery = useCurrencies();
  const rateQuery = useExchangeRate(selectedCurrency, datumPrometa);

  const rsdPreview =
    foreignAmount && rateQuery.data
      ? convertToRsd(
          parseFloat(foreignAmount.replace(',', '.')),
          rateQuery.data.exchange_middle,
          rateQuery.data.parity,
        )
      : null;

  async function onValidSubmit(data: CurrencyConvertFormData) {
    const amount = parseFloat(data.foreignAmount.replace(',', '.'));
    let rate = rateQuery.data;
    if (!rate) {
      const result = await rateQuery.refetch();
      rate = result.data;
      if (!rate) return;
    }
    const rsd = convertToRsd(amount, rate.exchange_middle, rate.parity);
    onApply(rsd.toString());
    onClose();
  }

  const formattedExchangeMiddle = formatFullCurrency(
    rateQuery.data?.exchange_middle ?? 0,
  );

  const parity = rateQuery.data?.parity ?? 1;

  const formattedDateFrom = rateQuery.data?.date_from
    ? new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(rateQuery.data.date_from))
    : '';

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>
              <Trans>Konverzija valute</Trans>
            </Modal.Heading>
            <p className="mt-1.5 text-sm/5  text-muted">{fieldLabel}</p>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-4 p-6">
            <Form
              id={formId}
              className="contents"
              onSubmit={(e) => {
                void handleSubmit(onValidSubmit)(e);
              }}
            >
              {currenciesQuery.isPending ? (
                <Skeleton className="h-10 w-full rounded-lg" />
              ) : (
                <Controller
                  name="currency"
                  control={control}
                  render={({ field, fieldState }) => (
                    <ComboBox
                      className="w-full"
                      isInvalid={!!fieldState.error}
                      selectedKey={field.value || null}
                      onSelectionChange={(key) => {
                        field.onChange(key ? key.toString() : '');
                      }}
                    >
                      <Label>
                        <Trans>Valuta</Trans>
                      </Label>
                      <ComboBox.InputGroup>
                        <Input placeholder={t`Izaberite valutu`} />
                        <ComboBox.Trigger />
                      </ComboBox.InputGroup>
                      <ComboBox.Popover>
                        <ListBox>
                          {(currenciesQuery.data ?? []).map((c) => (
                            <ListBox.Item
                              key={c.code}
                              id={c.code}
                              textValue={`${c.code} – ${c.country}`}
                            >
                              {c.code} – {c.country}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </ComboBox.Popover>
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </ComboBox>
                  )}
                />
              )}

              <Controller
                name="foreignAmount"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField className="w-full" isInvalid={!!fieldState.error}>
                    <Label className="sr-only">
                      <Trans>Iznos u stranoj valuti</Trans>
                    </Label>
                    <InputGroup>
                      <CurrencyInput
                        customInput={InputGroup.Input}
                        groupSeparator="."
                        decimalSeparator=","
                        placeholder="0"
                        decimalsLimit={2}
                        decimalScale={2}
                        disableAbbreviations
                        allowNegativeValue={false}
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value ?? '');
                        }}
                        onBlur={field.onBlur}
                        ref={field.ref}
                      />
                      <InputGroup.Suffix>
                        <span className="text-sm text-muted">
                          {selectedCurrency}
                        </span>
                      </InputGroup.Suffix>
                    </InputGroup>
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </TextField>
                )}
              />
            </Form>

            <div className="space-y-2 text-sm">
              {rateQuery.isPending ? (
                <>
                  <Skeleton className="h-5 w-3/4 rounded-sm" />
                  {foreignAmount && (
                    <Skeleton className="h-5 w-1/2 rounded-sm" />
                  )}
                </>
              ) : rateQuery.isError ? (
                <p className="text-danger">
                  <Trans>Greška pri učitavanju kursa. Pokušajte ponovo.</Trans>
                </p>
              ) : rateQuery.data ? (
                <>
                  <p className="text-muted">
                    <Trans>
                      1 {selectedCurrency} = {formattedExchangeMiddle} (paritet{' '}
                      {parity})
                    </Trans>
                    <span className="ml-1">· {formattedDateFrom}</span>
                  </p>
                  {rsdPreview !== null && (
                    <p>
                      {formatCurrency(parseFloat(foreignAmount))}{' '}
                      {selectedCurrency} ={' '}
                      <span className="font-semibold">
                        {formatFullCurrency(rsdPreview)}
                      </span>
                    </p>
                  )}
                </>
              ) : null}
            </div>

            <Alert status="warning">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>
                  <Trans>
                    Beta funkcija. Kursevi se preuzimaju sa{' '}
                    <Link
                      href={KURS_RESENJE_ORG_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      kurs.resenje.org
                      <Link.Icon />
                    </Link>
                    . Molimo vas da proverite zvanični kurs na sajtu{' '}
                    <Link
                      href={NBS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      NBS
                      <Link.Icon />
                    </Link>{' '}
                    pre primene.
                  </Trans>
                </Alert.Description>
              </Alert.Content>
            </Alert>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onPress={onClose}>
              <Trans>Otkaži</Trans>
            </Button>
            <Button type="submit" form={formId} isDisabled={rateQuery.isError}>
              <Trans>Primeni</Trans>
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
