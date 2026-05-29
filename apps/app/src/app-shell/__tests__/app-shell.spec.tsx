import { Toast } from '@heroui/react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { I18nWrapper } from 'tests/render-helpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from '../../auth/auth-context';
import { DocContext } from '../../crdt/doc-context';
import { SyncMetadataProvider } from '../../crdt/sync-metadata-provider';
import { YDoc } from '../../crdt/y';
import { AppShell } from '../app-shell';
import { TopBarActionsSlot } from '../top-bar-actions';

function ActionsPage() {
  return (
    <>
      <TopBarActionsSlot>
        <button type="button">Action</button>
      </TopBarActionsSlot>
      <div>Actions</div>
    </>
  );
}

function renderAppShell(initialPath = '/dashboard') {
  const router = createMemoryRouter(
    [
      {
        element: <AppShell />,
        children: [
          { path: 'dashboard', element: <div>Dashboard</div> },
          { path: 'books', element: <div>Books</div> },
          { path: 'actions', element: <ActionsPage /> },
          { path: 'settings/general', element: <div>Settings</div> },
          { path: 'settings/account', element: <div>Account Settings</div> },
          { path: 'help', element: <div>Help</div> },
        ],
      },
    ],
    { initialEntries: [`/${initialPath.replace(/^\//, '')}`] },
  );
  return render(
    <DocContext value={new YDoc()}>
      <AuthContext
        value={{
          user: { id: 'test-user', email: 'test@example.com' },
          refresh: () => Promise.resolve('test-user'),
          logout: () => Promise.resolve(),
        }}
      >
        <SyncMetadataProvider userId="test-user">
          <I18nWrapper>
            <Toast.Provider />
            <RouterProvider router={router} />
          </I18nWrapper>
        </SyncMetadataProvider>
      </AuthContext>
    </DocContext>,
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('autokpo:locale', 'sr-Latn');
});

describe('AppShell', () => {
  it('renders the AutoKPO logo in the sidebar', () => {
    renderAppShell();
    // The logo lives in the <aside> (role=complementary)
    const sidebar = screen.getByRole('complementary');
    expect(within(sidebar).getByText('AutoKPO')).toBeInTheDocument();
  });

  it('renders navigation items: Panel, Knjige, Podešavanja', () => {
    renderAppShell();
    const sidebar = screen.getByRole('complementary');
    expect(
      within(sidebar).getByRole('link', { name: 'Panel' }),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByRole('link', { name: 'Knjige' }),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByRole('link', { name: 'Podešavanja' }),
    ).toBeInTheDocument();
  });

  it('renders the version badge', () => {
    renderAppShell();
    expect(screen.getByText(`v${__APP_VERSION__}`)).toBeInTheDocument();
  });

  it('shows "Panel" breadcrumb on /dashboard', () => {
    renderAppShell('/dashboard');
    // Breadcrumbs live inside the top bar <header> (role=banner)
    const header = screen.getByRole('banner');
    expect(within(header).getByText('Panel')).toBeInTheDocument();
  });

  it('shows "Knjige" breadcrumb on /books', () => {
    renderAppShell('/books');
    const header = screen.getByRole('banner');
    expect(within(header).getByText('Knjige')).toBeInTheDocument();
  });

  it('shows "Podešavanja" breadcrumb on /settings', () => {
    renderAppShell('/settings/general');
    const header = screen.getByRole('banner');
    expect(within(header).getByText('Podešavanja')).toBeInTheDocument();
  });

  it('shows "Podešavanja" breadcrumb on /settings/account', () => {
    renderAppShell('/settings/account');
    const header = screen.getByRole('banner');
    expect(within(header).getByText('Podešavanja')).toBeInTheDocument();
  });

  it('renders mobile hamburger button', () => {
    renderAppShell();
    expect(
      screen.getByRole('button', { name: 'Otvori meni' }),
    ).toBeInTheDocument();
  });

  it('keeps profile button visible in top bar', () => {
    renderAppShell();
    const header = screen.getByRole('banner');
    expect(
      within(header).getByRole('button', { name: 'Profil' }),
    ).toBeInTheDocument();
  });

  it('keeps profile button rightmost when page actions are rendered', () => {
    renderAppShell('/actions');
    const header = screen.getByRole('banner');
    const actionButton = within(header).getByRole('button', { name: 'Action' });
    const profileButton = within(header).getByRole('button', {
      name: 'Profil',
    });
    expect(actionButton.compareDocumentPosition(profileButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('mobile drawer opens when hamburger is pressed', async () => {
    const user = userEvent.setup();
    renderAppShell();

    // Drawer initially closed — no dialog present
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Otvori meni' }));

    expect(
      screen.getByRole('dialog', { name: 'Navigacija' }),
    ).toBeInTheDocument();
  });

  it('mobile drawer renders a close button when open', async () => {
    const user = userEvent.setup();
    renderAppShell();

    await user.click(screen.getByRole('button', { name: 'Otvori meni' }));

    const dialog = screen.getByRole('dialog', { name: 'Navigacija' });
    expect(
      within(dialog).getByRole('button', { name: 'Zatvori' }),
    ).toBeInTheDocument();
  });

  it('mobile drawer closes when close button is pressed', async () => {
    const user = userEvent.setup();
    renderAppShell();

    await user.click(screen.getByRole('button', { name: 'Otvori meni' }));

    const dialog = screen.getByRole('dialog', { name: 'Navigacija' });
    await user.click(within(dialog).getByRole('button', { name: 'Zatvori' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Navigacija' }),
      ).not.toBeInTheDocument();
    });
  });

  it('mobile drawer closes when a nav link is clicked', async () => {
    const user = userEvent.setup();
    renderAppShell();

    await user.click(screen.getByRole('button', { name: 'Otvori meni' }));
    expect(
      screen.getByRole('dialog', { name: 'Navigacija' }),
    ).toBeInTheDocument();

    const dialog = screen.getByRole('dialog', { name: 'Navigacija' });
    await user.click(within(dialog).getByRole('link', { name: 'Podešavanja' }));

    expect(
      within(dialog).getByRole('link', { name: 'Podešavanja' }),
    ).toHaveAttribute('href', '/settings/general');

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Navigacija' }),
      ).not.toBeInTheDocument();
    });
  });

  it('mobile drawer closes when viewport resizes to desktop width', async () => {
    const user = userEvent.setup();

    const capturedHandlers: Array<(e: MediaQueryListEvent) => void> = [];
    const mockMql = {
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (
        _: string,
        handler: (e: MediaQueryListEvent) => void,
      ) => {
        capturedHandlers.push(handler);
      },
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
    vi.stubGlobal('matchMedia', () => mockMql);

    renderAppShell();

    await user.click(screen.getByRole('button', { name: 'Otvori meni' }));
    expect(
      screen.getByRole('dialog', { name: 'Navigacija' }),
    ).toBeInTheDocument();

    act(() => {
      for (const handler of capturedHandlers) {
        handler({ matches: true } as MediaQueryListEvent);
      }
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Navigacija' }),
      ).not.toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });
});

describe('Sidebar help and footer', () => {
  it('renders the Pomoć nav link in the sidebar', () => {
    renderAppShell();
    const sidebar = screen.getByRole('complementary');
    expect(
      within(sidebar).getByRole('link', { name: 'Pomoć' }),
    ).toHaveAttribute('href', '/help');
  });

  it('renders AGPL-3.0 text in the version footer', () => {
    renderAppShell();
    const sidebar = screen.getByRole('complementary');
    expect(within(sidebar).getByText(/AGPL-3\.0/)).toBeInTheDocument();
  });

  it('renders AGPL-3.0 GitHub link in the version footer', () => {
    renderAppShell();
    const sidebar = screen.getByRole('complementary');
    const ghLink = within(sidebar).getByRole('link', { name: /AGPL-3\.0/i });
    expect(ghLink).toHaveAttribute(
      'href',
      'https://github.com/balakin/autokpo',
    );
    expect(ghLink).toHaveAttribute('target', '_blank');
  });
});
