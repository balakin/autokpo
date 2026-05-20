import { render, screen, act } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { BOOK_ID_1 } from 'tests/fixtures/book';
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
import { BookScope } from '../book-scope';

const KNOWN_ID = BOOK_ID_1;

function renderBookScope(route: string) {
  const doc = getTestDoc();
  const router = createMemoryRouter(
    [
      { path: '/dashboard', element: <LocationDisplay /> },
      { path: '/books/:bookId', element: <BookScope /> },
    ],
    { initialEntries: [route] },
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

describe('BookScope', () => {
  it('redirects to /dashboard when bookId is unknown', () => {
    renderBookScope('/books/unknown-id');
    expect(screen.getByLabelText('current-location')).toHaveTextContent(
      '/dashboard',
    );
  });

  it('renders SetupWizard (start step) when book has no profile', () => {
    seedBook(KNOWN_ID);
    renderBookScope(`/books/${KNOWN_ID}`);
    expect(
      screen.getByRole('heading', { name: /podešavanje knjige/i }),
    ).toBeInTheDocument();
  });

  it('renders SetupWizard (signature step) when book has profile but no signature', () => {
    seedBook(KNOWN_ID, { profile: VALID_PROFILE });
    renderBookScope(`/books/${KNOWN_ID}`);
    expect(screen.getByRole('heading', { name: 'Potpis' })).toBeInTheDocument();
  });

  it('renders WorkingLayout when book has both profile and signature', async () => {
    seedBook(KNOWN_ID, { profile: VALID_PROFILE, signature: VALID_SIGNATURE });
    // HeroUI's Tabs.Indicator (SharedElement) fires a deferred state update;
    // await act(async) flushes it before assertions run.
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      renderBookScope(`/books/${KNOWN_ID}`);
      await Promise.resolve();
    });
    expect(
      screen.getByRole('heading', { name: 'KPO unosi' }),
    ).toBeInTheDocument();
  });
});
