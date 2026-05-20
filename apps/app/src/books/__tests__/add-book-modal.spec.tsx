import { Button } from '@heroui/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import {
  getTestDoc,
  I18nWrapper,
  LocationDisplay,
  resetTestDoc,
  seedBook,
} from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import { KPO_FIRST_YEAR } from '../../constants';
import { DocContext } from '../../crdt/doc-context';
import { AddBookModal } from '../add-book-modal';

const CURRENT_YEAR = new Date().getFullYear();

function renderModal() {
  const doc = getTestDoc();
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <>
            <AddBookModal>
              <Button>Otvori modal</Button>
            </AddBookModal>
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

async function openModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Otvori modal' }));
  await screen.findByRole('dialog');
}

async function openSelectPopover(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole('button', {
    name: /Izaberite godinu|[0-9]{4}/,
  });
  await user.click(trigger);
  await screen.findByRole('listbox');
}

beforeEach(() => {
  resetTestDoc();
});

describe('AddBookModal', () => {
  it('renders year options from currentYear down to KPO_FIRST_YEAR', async () => {
    const user = userEvent.setup();
    renderModal();
    await openModal(user);
    await openSelectPopover(user);

    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');

    expect(options[0]).toHaveTextContent(String(CURRENT_YEAR));
    expect(options[options.length - 1]).toHaveTextContent(
      String(KPO_FIRST_YEAR),
    );
    expect(options).toHaveLength(CURRENT_YEAR - KPO_FIRST_YEAR + 1);
  });

  it('shows "(zauzeto)" suffix for occupied years and they are disabled', async () => {
    seedBook('occupied-year', { year: CURRENT_YEAR });
    const user = userEvent.setup();
    renderModal();
    await openModal(user);
    await openSelectPopover(user);

    const listbox = screen.getByRole('listbox');
    const occupiedOption = within(listbox).getByText(
      `${CURRENT_YEAR} (zauzeto)`,
    );
    expect(occupiedOption).toBeInTheDocument();

    const optionElement = within(listbox).getByRole('option', {
      name: `${CURRENT_YEAR} (zauzeto)`,
    });
    expect(optionElement).toHaveAttribute('aria-disabled', 'true');
  });

  it('pre-selects current year when it is not occupied', async () => {
    const user = userEvent.setup();
    renderModal();
    await openModal(user);

    const trigger = screen.getByRole('button', {
      name: /Izaberite godinu|[0-9]{4}/,
    });
    expect(trigger).toHaveTextContent(String(CURRENT_YEAR));
  });

  it('leaves year unselected when current year is occupied', async () => {
    seedBook('occupied-year', { year: CURRENT_YEAR });
    const user = userEvent.setup();
    renderModal();
    await openModal(user);

    const trigger = screen.getByRole('button', {
      name: /Izaberite godinu/,
    });
    expect(trigger).toHaveTextContent('Izaberite godinu');
  });

  it('shows "Polje je obavezno" error when submitting without selection', async () => {
    seedBook('occupied-year', { year: CURRENT_YEAR });
    const user = userEvent.setup();
    renderModal();
    await openModal(user);

    await user.click(screen.getByRole('button', { name: 'Dodaj' }));

    expect(screen.getByText('Polje je obavezno')).toBeInTheDocument();
  });

  it('creates book and navigates to /books/<id> on valid submit', async () => {
    const user = userEvent.setup();
    renderModal();
    await openModal(user);
    await openSelectPopover(user);

    const listbox = screen.getByRole('listbox');
    await user.click(
      within(listbox).getByRole('option', {
        name: String(CURRENT_YEAR),
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Dodaj' }));

    await waitFor(() => {
      expect(screen.getByLabelText('current-location')).toHaveTextContent(
        /^\/books\//,
      );
    });
  });
});
