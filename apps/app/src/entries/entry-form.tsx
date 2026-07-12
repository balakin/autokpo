import {
  Button,
  Calendar,
  DateField,
  DatePicker,
  FieldError,
  Form,
  Input,
  InputGroup,
  Label,
  TextField,
  toast,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDate, parseDate } from '@internationalized/date';
import { useLingui } from '@lingui/react/macro';
import { useId, useState } from 'react';
import CurrencyInput from 'react-currency-input-field';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { LuArrowLeftRight } from 'react-icons/lu';

import { useYDoc } from '../crdt';
import { CurrencyConvertModal } from '../currency/currency-convert-modal';
import { belgradeToday } from '../utils/belgrade-date';

import {
  type KpoEntry,
  type EntryFormData,
  type EntryModelData,
  createEntryFormSchema,
} from './entries-schema';
import { entrySelectors } from './entry-selectors';
import { filterSuggestions } from './entry-suggestions';

const DEFAULT_VALUES: EntryFormData = {
  datumPrometa: '',
  opisPrometa: '',
  odProdajeProizvoda: '',
  odIzvrsenihUsluga: '',
};

interface EntryFormProps {
  formId: string;
  entry?: KpoEntry;
  year: number;
  onSuccess: (data: EntryModelData) => void;
}

type AmountField = 'odProdajeProizvoda' | 'odIzvrsenihUsluga';

export function EntryForm({ formId, entry, year, onSuccess }: EntryFormProps) {
  const [today] = useState(() => belgradeToday());
  const startOfYear = new CalendarDate(year, 1, 1);
  const endOfYear = new CalendarDate(year, 12, 31);
  const { control, handleSubmit, setValue, trigger, setFocus } = useForm({
    resolver: zodResolver(createEntryFormSchema(year)),
    mode: 'onChange',
    defaultValues: entry
      ? {
          datumPrometa: entry.datumPrometa,
          opisPrometa: entry.opisPrometa,
          odProdajeProizvoda: entry.odProdajeProizvoda.toString(),
          odIzvrsenihUsluga: entry.odIzvrsenihUsluga.toString(),
        }
      : DEFAULT_VALUES,
  });
  const { t } = useLingui();

  const [activeConverterField, setActiveConverterField] =
    useState<AmountField | null>(null);
  const datumPrometa = useWatch({ control, name: 'datumPrometa' });

  const descriptionListId = useId();
  const descriptionCorpus = useYDoc(entrySelectors.descriptionSuggestions());
  const opisPrometa = useWatch({ control, name: 'opisPrometa' });
  const descriptionSuggestions = filterSuggestions(
    descriptionCorpus,
    opisPrometa,
  );

  function onSubmit(data: EntryFormData) {
    onSuccess({
      datumPrometa: data.datumPrometa,
      opisPrometa: data.opisPrometa,
      odProdajeProizvoda:
        Math.round(
          parseFloat(data.odProdajeProizvoda.replace(',', '.')) * 100,
        ) / 100,
      odIzvrsenihUsluga:
        Math.round(parseFloat(data.odIzvrsenihUsluga.replace(',', '.')) * 100) /
        100,
    });
  }

  async function handleConverterTrigger(field: AmountField) {
    const isValid = await trigger('datumPrometa');
    if (!isValid) {
      setFocus('datumPrometa');
      toast.danger(t`Unesite ispravan datum pre konverzije`);
      return;
    }
    setActiveConverterField(field);
  }

  return (
    <>
      <Form
        id={formId}
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e);
        }}
      >
        <Controller
          name="datumPrometa"
          control={control}
          render={({ field, fieldState }) => (
            <DatePicker
              className="w-full"
              isInvalid={!!fieldState.error}
              value={field.value ? parseDate(field.value) : null}
              onChange={(v) => field.onChange(v ? v.toString() : '')}
            >
              <Label>{t`Datum prometa`}</Label>
              <DateField.Group fullWidth>
                <DateField.Input>
                  {(segment) => <DateField.Segment segment={segment} />}
                </DateField.Input>
                <DateField.Suffix>
                  <DatePicker.Trigger>
                    <DatePicker.TriggerIndicator />
                  </DatePicker.Trigger>
                </DateField.Suffix>
              </DateField.Group>
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
              <DatePicker.Popover>
                <Calendar
                  aria-label={t`Datum prometa`}
                  minValue={startOfYear}
                  maxValue={today.compare(endOfYear) <= 0 ? today : endOfYear}
                >
                  <Calendar.Header>
                    <Calendar.Heading />
                    <Calendar.NavButton slot="previous" />
                    <Calendar.NavButton slot="next" />
                  </Calendar.Header>
                  <Calendar.Grid>
                    <Calendar.GridHeader>
                      {(day) => (
                        <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                      )}
                    </Calendar.GridHeader>
                    <Calendar.GridBody>
                      {(date) => <Calendar.Cell date={date} />}
                    </Calendar.GridBody>
                  </Calendar.Grid>
                </Calendar>
              </DatePicker.Popover>
            </DatePicker>
          )}
        />

        <Controller
          name="opisPrometa"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              className="w-full"
              isInvalid={!!fieldState.error}
              value={field.value}
              onChange={field.onChange}
            >
              <Label>{t`Opis prometa`}</Label>
              <Input
                ref={field.ref}
                onBlur={field.onBlur}
                list={descriptionListId}
              />
              <datalist id={descriptionListId}>
                {descriptionSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />

        <Controller
          name="odProdajeProizvoda"
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>{t`Od prodaje proizvoda`}</Label>
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
                <InputGroup.Suffix className="space-x-1.5">
                  <span className="text-sm text-muted">RSD</span>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={t`Konvertuj valutu`}
                    onPress={() =>
                      void handleConverterTrigger('odProdajeProizvoda')
                    }
                  >
                    <LuArrowLeftRight />
                  </Button>
                </InputGroup.Suffix>
              </InputGroup>
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />

        <Controller
          name="odIzvrsenihUsluga"
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>{t`Od izvršenih usluga`}</Label>
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
                <InputGroup.Suffix className="space-x-1.5">
                  <span className="text-sm text-muted">RSD</span>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={t`Konvertuj valutu`}
                    onPress={() =>
                      void handleConverterTrigger('odIzvrsenihUsluga')
                    }
                  >
                    <LuArrowLeftRight />
                  </Button>
                </InputGroup.Suffix>
              </InputGroup>
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />
      </Form>

      {activeConverterField && (
        <CurrencyConvertModal
          isOpen
          onClose={() => setActiveConverterField(null)}
          onApply={(rsdValue) => {
            setValue(activeConverterField, rsdValue);
            void trigger(activeConverterField);
            setActiveConverterField(null);
          }}
          datumPrometa={datumPrometa}
          fieldLabel={
            activeConverterField === 'odProdajeProizvoda'
              ? t`Od prodaje proizvoda`
              : t`Od izvršenih usluga`
          }
        />
      )}
    </>
  );
}
