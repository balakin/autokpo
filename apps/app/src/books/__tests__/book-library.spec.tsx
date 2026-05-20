import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { BOOK_ID_1, BOOK_ID_2 } from 'tests/fixtures/book';
import { VALID_PROFILE } from 'tests/fixtures/entity-profile';
import { VALID_SIGNATURE } from 'tests/fixtures/signature';
import {
  getTestDoc,
  I18nWrapper,
  LocationDisplay,
  resetTestDoc,
  seedBook,
} from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import { DocContext } from '../../crdt/doc-context';
import { BookLibrary } from '../book-library';

const ID_1 = BOOK_ID_1;
const ID_2 = BOOK_ID_2;

function renderLibrary() {
  const doc = getTestDoc();
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <>
            <BookLibrary />
            <LocationDisplay />
          </>
        ),
      },
      { path: '/books/:bookId', element: <LocationDisplay /> },
    ],
    { initialEntries: ['/'] },
  );
  return render(
    <DocContext value={doc}>
      <I18nWrapper>
        <RouterProvider router={router} />
      </I18nWrapper>
    </DocContext>,
  );
}

beforeEach(() => {
  resetTestDoc();
});

describe('BookLibrary', () => {
  it('renders page heading with icon and label', () => {
    renderLibrary();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Knjige' }),
    ).toBeInTheDocument();
  });

  it('renders empty state when no books exist', () => {
    renderLibrary();
    expect(
      screen.getByText('Još nemate nijednu knjigu. Dodajte prvu da započnete.'),
    ).toBeInTheDocument();
  });

  it('renders books sorted newest-first', () => {
    seedBook(ID_1, { year: 2023 });
    seedBook(ID_2, { year: 2025 });
    renderLibrary();

    const years = screen.getAllByText(/^202[0-9]$/).map((el) => el.textContent);
    expect(years).toEqual(['2025', '2023']);
  });

  it('shows duplicate warning with bullet list for all duplicated years', () => {
    seedBook(ID_1, { year: 2026 });
    seedBook(ID_2, { year: 2026 });
    seedBook('00000000-0000-4000-8000-000000000101', { year: 2024 });
    seedBook('00000000-0000-4000-8000-000000000102', { year: 2024 });
    seedBook('00000000-0000-4000-8000-000000000103', { year: 2024 });

    renderLibrary();

    expect(screen.getByText('Otkriveni duplikati knjiga')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Za svaku godinu zadržite jednu knjigu, a ostale obrišite.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('2026 - 2 knjige')).toBeInTheDocument();
    expect(screen.getByText('2024 - 3 knjige')).toBeInTheDocument();
  });

  it('shows duplicate tag on every row in duplicated years', () => {
    seedBook(ID_1, { year: 2026 });
    seedBook(ID_2, { year: 2026 });
    renderLibrary();

    expect(screen.getAllByText('Duplikat')).toHaveLength(2);
  });

  it('hides duplicate warning and tags when all years are unique', () => {
    seedBook(ID_1, { year: 2024 });
    seedBook(ID_2, { year: 2025 });
    renderLibrary();

    expect(
      screen.queryByText('Otkriveni duplikati knjiga'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Duplikat')).not.toBeInTheDocument();
  });

  it('"Otvori" links to /books/<id>', () => {
    seedBook(ID_1);
    renderLibrary();

    expect(screen.getByRole('link', { name: 'Otvori' })).toHaveAttribute(
      'href',
      `/books/${ID_1}`,
    );
  });

  it('"Obriši" confirmation deletes the book', async () => {
    seedBook(ID_1);
    const user = userEvent.setup();
    renderLibrary();

    await user.click(
      screen.getByRole('button', { name: `Obriši knjigu za 2025` }),
    );
    await screen.findByRole('alertdialog');
    await user.click(screen.getByRole('button', { name: 'Obriši' }));

    expect(
      screen.getByText('Još nemate nijednu knjigu. Dodajte prvu da započnete.'),
    ).toBeInTheDocument();
  });

  it('"Otkaži" keeps the book without deleting', async () => {
    seedBook(ID_1);
    const user = userEvent.setup();
    renderLibrary();

    await user.click(
      screen.getByRole('button', { name: `Obriši knjigu za 2025` }),
    );
    await screen.findByRole('alertdialog');
    await user.click(screen.getByRole('button', { name: 'Otkaži' }));

    expect(screen.getByText('2025')).toBeInTheDocument();
  });

  it('shows "Nezavršeno" badge for incomplete book', () => {
    seedBook(ID_1);
    renderLibrary();
    expect(screen.getByText('Nezavršeno')).toBeInTheDocument();
  });

  it('does not show "Nezavršeno" badge for complete book', () => {
    seedBook(ID_1, { profile: VALID_PROFILE, signature: VALID_SIGNATURE });
    renderLibrary();
    expect(screen.queryByText('Nezavršeno')).not.toBeInTheDocument();
  });

  it('shows 0,00 income for book with no entries', () => {
    seedBook(ID_1);
    renderLibrary();
    expect(screen.getByText('0,00 RSD')).toBeInTheDocument();
  });

  it('shows formatted income for book with entries (success color)', () => {
    seedBook(ID_1, {
      entries: [
        {
          id: '00000000-0000-4000-8000-000000000099',
          datumPrometa: '2025-03-01',
          opisPrometa: 'Test',
          odProdajeProizvoda: 1_000_000,
          odIzvrsenihUsluga: 0,
        },
      ],
    });
    renderLibrary();
    const incomeEl = screen.getByText('1.000.000,00 RSD');
    expect(incomeEl).toBeInTheDocument();
    expect(incomeEl.className).toContain('text-success');
  });

  it('applies danger color when book income exceeds 6M limit', () => {
    seedBook(ID_1, {
      entries: [
        {
          id: '00000000-0000-4000-8000-000000000099',
          datumPrometa: '2025-03-01',
          opisPrometa: 'Test',
          odProdajeProizvoda: 7_000_000,
          odIzvrsenihUsluga: 0,
        },
      ],
    });
    renderLibrary();
    const incomeEl = screen.getByText('7.000.000,00 RSD');
    expect(incomeEl.className).toContain('text-danger');
  });

  it('renders a favorite toggle button for each book row', () => {
    seedBook(ID_1, { year: 2025 });
    renderLibrary();
    expect(
      screen.getByRole('button', { name: 'Dodaj u omiljene za 2025' }),
    ).toBeInTheDocument();
  });

  it('shows "Ukloni iz omiljenih" label for already-favorited book', () => {
    seedBook(ID_1, { year: 2025, favorite: true });
    renderLibrary();
    expect(
      screen.getByRole('button', { name: 'Ukloni iz omiljenih za 2025' }),
    ).toBeInTheDocument();
  });

  it('toggles favorite on press', async () => {
    seedBook(ID_1, { year: 2025, favorite: false });
    const user = userEvent.setup();
    renderLibrary();

    await user.click(
      screen.getByRole('button', { name: 'Dodaj u omiljene za 2025' }),
    );

    expect(
      screen.getByRole('button', { name: 'Ukloni iz omiljenih za 2025' }),
    ).toBeInTheDocument();
  });

  it('applies warning color when book income is between 90% and 100% of 6M limit', () => {
    seedBook(ID_1, {
      entries: [
        {
          id: '00000000-0000-4000-8000-000000000099',
          datumPrometa: '2025-03-01',
          opisPrometa: 'Test',
          odProdajeProizvoda: 5_500_000,
          odIzvrsenihUsluga: 0,
        },
      ],
    });
    renderLibrary();
    const incomeEl = screen.getByText('5.500.000,00 RSD');
    expect(incomeEl.className).toContain('text-warning');
  });
});
