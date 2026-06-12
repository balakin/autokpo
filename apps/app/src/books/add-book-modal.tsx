import {
  Button,
  FieldError,
  Form,
  Label,
  ListBox,
  Modal,
  Select,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { usePostHog } from '@posthog/react';
import { useId, useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { KPO_FIRST_YEAR } from '../constants';
import { useDoc, useYDoc } from '../crdt';

import { bookMutations } from './book-mutations';
import { bookSelectors } from './book-selectors';

function createAddBookFormSchema() {
  return z.object({
    year: z.string().min(1, t`Polje je obavezno`),
  });
}

type AddBookFormData = z.infer<ReturnType<typeof createAddBookFormSchema>>;

export function AddBookModal({ children }: { children: ReactNode }) {
  const doc = useDoc();
  const occupiedYears = useYDoc(bookSelectors.occupiedYears());
  const navigate = useNavigate();

  const [currentYear] = useState(() => new Date().getFullYear());
  const years = Array.from(
    { length: currentYear - KPO_FIRST_YEAR + 1 },
    (_, i) => currentYear - i,
  );
  const occupied = new Set(occupiedYears);
  const defaultYear = occupied.has(currentYear) ? '' : String(currentYear);

  return (
    <Modal>
      {children}
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            {({ close }) => (
              <AddBookDialog
                close={close}
                years={years}
                occupied={occupied}
                defaultYear={defaultYear}
                createBook={(year) => bookMutations.create(doc, year)}
                onCreated={(id) => void navigate(`/books/${id}`)}
              />
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function AddBookDialog({
  close,
  years,
  occupied,
  defaultYear,
  createBook,
  onCreated,
}: {
  close: () => void;
  years: number[];
  occupied: Set<number>;
  defaultYear: string;
  createBook: (year: number) => { id: string };
  onCreated: (id: string) => void;
}) {
  const formId = useId();
  const posthog = usePostHog();
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(createAddBookFormSchema()),
    defaultValues: { year: defaultYear },
  });

  function onSubmit(data: AddBookFormData) {
    const year = Number(data.year);
    const book = createBook(year);
    posthog.capture('book_created', { year });
    close();
    onCreated(book.id);
  }

  const disabledKeys = Array.from(occupied).map(String);

  return (
    <>
      <Modal.Header>
        <Modal.Heading>
          <Trans>Nova knjiga</Trans>
        </Modal.Heading>
        <p className="mt-1.5 text-sm/5  text-muted">
          <Trans>Izaberite godinu za novu knjigu.</Trans>
        </p>
      </Modal.Header>
      <Modal.Body className="p-6">
        <Form
          id={formId}
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e);
          }}
        >
          <Controller
            name="year"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                className="w-full"
                placeholder={t`Izaberite godinu`}
                isInvalid={!!fieldState.error}
                disabledKeys={disabledKeys}
                value={field.value || null}
                onChange={(value) => {
                  field.onChange(value === null ? '' : String(value));
                }}
              >
                <Label>{t`Godina`}</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {years.map((year) => {
                      const isOccupied = occupied.has(year);
                      const label = isOccupied
                        ? t`${year} (zauzeto)`
                        : String(year);
                      return (
                        <ListBox.Item
                          key={year}
                          id={String(year)}
                          textValue={label}
                        >
                          {label}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      );
                    })}
                  </ListBox>
                </Select.Popover>
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Select>
            )}
          />
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button slot="close" variant="secondary">
          <Trans>Otkaži</Trans>
        </Button>
        <Button type="submit" form={formId}>
          <Trans>Dodaj</Trans>
        </Button>
      </Modal.Footer>
    </>
  );
}
