import {
  Alert,
  AlertDialog,
  Button,
  Card,
  Chip,
  buttonVariants,
} from '@heroui/react';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { LuBook, LuPlus, LuStar, LuTrash } from 'react-icons/lu';
import { Link } from 'react-router';
import { tv } from 'tailwind-variants';

import { TopBarActionsSlot } from '../app-shell/top-bar-actions';
import { ANNUAL_LIMIT } from '../constants';
import { useDoc, useYDoc } from '../crdt';
import { formatFullCurrency } from '../formatters';
import { thresholdColor } from '../stats/threshold';

import { AddBookModal } from './add-book-modal';
import { bookMutations } from './book-mutations';
import { bookSelectors, type BookLibraryRow } from './book-selectors';

export function BookLibrary() {
  const rows = useYDoc(bookSelectors.libraryRows());
  const duplicateYearSummary = useYDoc(bookSelectors.duplicateYearSummary());

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <TopBarActionsSlot>
        <AddBookModal>
          <Button>
            <LuPlus />
            <Trans>Nova knjiga</Trans>
          </Button>
        </AddBookModal>
      </TopBarActionsSlot>
      <h1 className="sr-only">
        <Trans>Knjige</Trans>
      </h1>

      {duplicateYearSummary.length > 0 && (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>
              <Trans>Otkriveni duplikati knjiga</Trans>
            </Alert.Title>
            <Alert.Description>
              <p>
                <Trans>
                  Za svaku godinu zadržite jednu knjigu, a ostale obrišite.
                </Trans>
              </p>
              <ul className="mt-2 list-disc ps-5">
                {duplicateYearSummary.map((item) => (
                  <li key={item.year} className="font-mono">
                    {item.year} -{' '}
                    <Plural
                      value={item.count}
                      one="# knjiga"
                      few="# knjige"
                      many="# knjiga"
                      other="# knjiga"
                    />
                  </li>
                ))}
              </ul>
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {rows.length === 0 ? (
        <Card>
          <Card.Content>
            <p className="py-8 text-center text-muted">
              <Trans>
                Još nemate nijednu knjigu. Dodajte prvu da započnete.
              </Trans>
            </p>
          </Card.Content>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((book) => (
            <BookRow key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}

const incomeColor = tv({
  base: 'font-mono text-sm font-medium',
  variants: {
    color: {
      success: 'text-success',
      warning: 'text-warning',
      danger: 'text-danger',
    },
  },
});

function BookRow({ book }: { book: BookLibraryRow }) {
  const doc = useDoc();
  const { t } = useLingui();
  const { year } = book;
  const color = thresholdColor(book.income, ANNUAL_LIMIT);

  return (
    <Card>
      <Card.Header className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <LuBook className="size-4 text-muted" aria-hidden="true" />
          <Card.Title className="font-mono text-xl">{year}</Card.Title>
          {book.isDuplicateYear && (
            <Chip color="warning" variant="soft" size="sm">
              <Trans>Duplikat</Trans>
            </Chip>
          )}
          {book.incomplete && (
            <Chip color="warning" variant="soft" size="sm">
              <Trans>Nezavršeno</Trans>
            </Chip>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className={incomeColor({ color })}>
            {formatFullCurrency(book.income)}
          </span>
          <span className="text-sm text-muted">
            <Plural
              value={book.entryCount}
              one="# unos"
              few="# unosa"
              many="# unosa"
              other="# unosa"
            />
          </span>
        </div>
      </Card.Header>
      <Card.Footer className="flex-row justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            className={buttonVariants({ variant: 'secondary' })}
            to={`/books/${book.id}`}
          >
            <Trans>Otvori</Trans>
          </Link>
          <Button
            isIconOnly
            variant="tertiary"
            aria-label={
              book.favorite
                ? t`Ukloni iz omiljenih za ${year}`
                : t`Dodaj u omiljene za ${year}`
            }
            onPress={() =>
              bookMutations.update(doc, book.id, { favorite: !book.favorite })
            }
          >
            <LuStar
              className={
                book.favorite ? 'fill-warning text-warning' : undefined
              }
            />
          </Button>
        </div>
        <AlertDialog>
          <Button
            isIconOnly
            variant="danger-soft"
            aria-label={t`Obriši knjigu za ${year}`}
          >
            <LuTrash />
          </Button>
          <AlertDialog.Backdrop>
            <AlertDialog.Container>
              <AlertDialog.Dialog className="sm:max-w-100">
                <AlertDialog.Header>
                  <AlertDialog.Icon status="danger" />
                  <AlertDialog.Heading>
                    <Trans>Obrisati knjigu za {year}?</Trans>
                  </AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>
                  <p>
                    <Plural
                      value={book.entryCount}
                      one="Knjiga sadrži # unos. Ovu radnju nije moguće poništiti."
                      few="Knjiga sadrži # unosa. Ovu radnju nije moguće poništiti."
                      many="Knjiga sadrži # unosa. Ovu radnju nije moguće poništiti."
                      other="Knjiga sadrži # unosa. Ovu radnju nije moguće poništiti."
                    />
                  </p>
                </AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button slot="close" variant="tertiary">
                    <Trans>Otkaži</Trans>
                  </Button>
                  <Button
                    slot="close"
                    variant="danger"
                    onPress={() => bookMutations.remove(doc, book.id)}
                  >
                    <Trans>Obriši</Trans>
                  </Button>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      </Card.Footer>
    </Card>
  );
}
