import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigate } from 'react-router';
import { LocationDisplay, renderWithProviders } from 'tests/render-helpers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountSettingsPage } from '../account-settings-page';
import { GeneralSettingsPage } from '../general-settings-page';
import { SettingsPage } from '../settings-page';

vi.mock('react-easy-crop', () => ({
  default: ({
    image,
    onCropComplete,
  }: {
    image: string;
    onCropComplete?: (croppedArea: unknown, croppedAreaPixels: unknown) => void;
  }) => {
    return (
      <button
        type="button"
        data-testid="mock-cropper"
        data-image={image}
        onClick={() =>
          onCropComplete?.(
            { x: 0, y: 0, width: 512, height: 512 },
            { x: 10, y: 20, width: 120, height: 120 },
          )
        }
      >
        crop
      </button>
    );
  },
}));

const mockDeleteAccount = vi.fn<() => Promise<void>>();
const mockFetchAccountProfile = vi.fn<
  () => Promise<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  }>
>();
const mockFetchAccountSessions = vi.fn<
  () => Promise<
    Array<{
      id: string;
      token: string;
      ipAddress: string | null;
      userAgent: string | null;
      createdAt: number | null;
      expiresAt: number | null;
      isCurrent: boolean;
    }>
  >
>();
const mockRevokeAccountSession = vi.fn<(token: string) => Promise<void>>();
const mockRevokeOtherAccountSessions = vi.fn<() => Promise<void>>();
const mockUseOnline = vi.fn(() => true);
const mockTriggerSync = vi.fn();
const mockUseSyncMetadata = vi.fn<
  (selector: unknown, isEqual?: unknown) => number | null
>(() => null);
const mockUploadProfileImage = vi.fn<(blob: Blob) => Promise<unknown>>();
const mockRemoveProfileImage = vi.fn<() => Promise<unknown>>();
const mockCreateObjectURL = vi.fn(() => 'blob:avatar-image');
const mockRevokeObjectURL = vi.fn();

vi.mock('../account-settings-api', () => ({
  buildAccountExport: vi.fn().mockResolvedValue({}),
  deleteAccount: () => mockDeleteAccount(),
  fetchAccountProfile: () => mockFetchAccountProfile(),
  fetchAccountSessions: () => mockFetchAccountSessions(),
  uploadProfileImage: (blob: Blob) => mockUploadProfileImage(blob),
  removeProfileImage: () => mockRemoveProfileImage(),
  revokeAccountSession: (token: string) => mockRevokeAccountSession(token),
  revokeOtherAccountSessions: () => mockRevokeOtherAccountSessions(),
}));

vi.mock('../export', () => ({
  buildStateExport: vi.fn().mockReturnValue({}),
  buildAccountExport: vi.fn().mockResolvedValue({}),
  downloadJson: vi.fn(),
  exportFilename: vi.fn().mockReturnValue('autokpo-state-2026-05-18.json'),
}));

vi.mock('../../auth/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com', image: null },
    logout: vi.fn(),
  }),
}));

vi.mock('../../hooks/use-online', () => ({
  useOnline: () => mockUseOnline(),
}));

vi.mock('../../crdt', async (importOriginal: () => Promise<object>) => {
  const actual = await importOriginal();
  return {
    ...actual,
    triggerSync: (queryClient: unknown) => {
      mockTriggerSync(queryClient);
    },
    useSyncMetadata: (selector: unknown, isEqual?: unknown) =>
      mockUseSyncMetadata(selector, isEqual),
  };
});

const mockSetTheme = vi.fn();
vi.mock('../use-theme', () => ({
  useTheme: () => ({ theme: 'system', setTheme: mockSetTheme }),
}));

const mockSetLocale = vi.fn();
vi.mock('../../i18n/use-locale', () => ({
  useLocale: () => ({ locale: 'en', setLocale: mockSetLocale }),
}));

beforeEach(() => {
  mockDeleteAccount.mockReset();
  mockSetTheme.mockClear();
  mockSetLocale.mockClear();
  mockTriggerSync.mockClear();
  mockUseSyncMetadata.mockReset();
  mockUseSyncMetadata.mockReturnValue(null);
  mockUseOnline.mockReturnValue(true);
  mockFetchAccountProfile.mockReset();
  mockFetchAccountProfile.mockResolvedValue({
    id: 'test-user',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
  });
  mockFetchAccountSessions.mockReset();
  mockFetchAccountSessions.mockResolvedValue([
    {
      id: 'current-session',
      token: 'current-token-secret',
      ipAddress: '203.0.113.10',
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
      createdAt: Date.parse('2026-04-30T10:00:00.000Z'),
      expiresAt: Date.parse('2026-06-01T10:00:00.000Z'),
      isCurrent: true,
    },
    {
      id: 'other-session',
      token: 'other-token-secret',
      ipAddress: '198.51.100.24',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      createdAt: Date.parse('2026-04-29T10:00:00.000Z'),
      expiresAt: Date.parse('2026-06-01T09:00:00.000Z'),
      isCurrent: false,
    },
  ]);
  mockRevokeAccountSession.mockReset();
  mockRevokeAccountSession.mockResolvedValue(undefined);
  mockRevokeOtherAccountSessions.mockReset();
  mockRevokeOtherAccountSessions.mockResolvedValue(undefined);
  mockUploadProfileImage.mockReset();
  mockUploadProfileImage.mockResolvedValue(undefined);
  mockRemoveProfileImage.mockReset();
  mockRemoveProfileImage.mockResolvedValue(undefined);
  mockCreateObjectURL.mockClear();
  mockRevokeObjectURL.mockClear();
  vi.spyOn(URL, 'createObjectURL').mockImplementation(mockCreateObjectURL);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(mockRevokeObjectURL);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function renderSettings(route = '/settings/general') {
  return renderWithProviders(null, {
    route,
    routes: [
      {
        path: '/settings',
        element: (
          <>
            <LocationDisplay />
            <SettingsPage />
          </>
        ),
        children: [
          { index: true, element: <Navigate to="/settings/general" replace /> },
          { path: 'general', element: <GeneralSettingsPage /> },
          { path: 'account', element: <AccountSettingsPage /> },
        ],
      },
    ],
  });
}

describe('SettingsPage', () => {
  it('shows empty sync state when no successful sync exists', async () => {
    await renderSettings();

    expect(
      screen.getByText('Još nema uspešne sinhronizacije na ovom uređaju.'),
    ).toBeInTheDocument();
  });

  it('renders the Podešavanja heading', async () => {
    await renderSettings();
    expect(
      screen.getByRole('heading', { name: 'Podešavanja' }),
    ).toBeInTheDocument();
  });

  it('renders the General tab selected with Tema, Jezik, Podaci sections', async () => {
    await renderSettings();
    expect(screen.getByRole('tab', { name: 'Opšte' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getAllByText('Tema').length).toBeGreaterThan(0);
    expect(screen.getByText('Jezik')).toBeInTheDocument();
    expect(screen.getByText('Podaci')).toBeInTheDocument();
  });

  it('renders the language section description', async () => {
    await renderSettings();
    expect(screen.getByText('Trenutni jezik: English')).toBeInTheDocument();
  });

  it('renders the theme Select with Sistemska selected by default', async () => {
    await renderSettings();
    expect(screen.getAllByText('Sistemska').length).toBeGreaterThan(0);
  });

  it('calls setTheme when a theme option is selected', async () => {
    const user = userEvent.setup();
    await renderSettings();

    const trigger = screen.getByRole('button', { name: /tema/i });
    await user.click(trigger);

    const lightOption = await screen.findByRole('option', { name: 'Svetla' });
    await user.click(lightOption);

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('shows the current locale name in the language select trigger', async () => {
    await renderSettings();
    expect(screen.getAllByText('English').length).toBeGreaterThan(0);
  });

  it('renders all locale options when the language select is opened', async () => {
    const user = userEvent.setup();
    await renderSettings();

    const trigger = screen.getByRole('button', { name: /jezik/i });
    await user.click(trigger);

    expect(
      await screen.findByRole('option', { name: 'Srpski' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Русский' })).toBeInTheDocument();
  });

  it('calls setLocale when a locale option is selected', async () => {
    const user = userEvent.setup();
    await renderSettings();

    const trigger = screen.getByRole('button', { name: /jezik/i });
    await user.click(trigger);

    const srOption = await screen.findByRole('option', { name: 'Srpski' });
    await user.click(srOption);

    expect(mockSetLocale).toHaveBeenCalledWith('sr-Latn');
  });

  it('calls triggerSync when sync button is pressed', async () => {
    const user = userEvent.setup();
    await renderSettings();

    const syncButton = screen.getByRole('button', { name: /sinhronizuj/i });
    await user.click(syncButton);

    expect(mockTriggerSync).toHaveBeenCalledTimes(1);
    expect(mockTriggerSync).toHaveBeenCalledWith(expect.any(Object));
  });

  it('shows relative last successful sync time when available', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T12:00:00.000Z'));
    mockUseSyncMetadata.mockReturnValue(Date.parse('2026-05-01T11:55:00.000Z'));

    await renderSettings();

    expect(
      screen.getByText(/Poslednja uspešna sinhronizacija:/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Poslednja uspešna sinhronizacija:/),
    ).toHaveTextContent(
      new Intl.RelativeTimeFormat('en', {
        numeric: 'always',
        style: 'long',
      }).format(-5, 'minute'),
    );

    vi.useRealTimers();
  });

  it('shows current-minute phrasing for sync younger than one minute', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T12:00:00.000Z'));
    mockUseSyncMetadata.mockReturnValue(Date.parse('2026-05-01T11:59:40.000Z'));

    await renderSettings();

    expect(
      screen.getByText(/Poslednja uspešna sinhronizacija:/),
    ).toHaveTextContent('upravo sada');

    vi.useRealTimers();
  });

  it('shows exact date and time for sync older than one day', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T12:00:00.000Z'));

    const lastSyncAt = Date.parse('2026-04-30T10:00:00.000Z');
    mockUseSyncMetadata.mockReturnValue(lastSyncAt);

    await renderSettings();

    expect(
      screen.getByText(/Poslednja uspešna sinhronizacija:/),
    ).toHaveTextContent(
      new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(lastSyncAt),
    );

    vi.useRealTimers();
  });

  it('redirects /settings to /settings/general', async () => {
    await renderSettings('/settings');

    expect(screen.getByLabelText('current-location')).toHaveTextContent(
      '/settings',
    );
  });

  it('shows the account tab without general sections', async () => {
    await renderSettings('/settings/account');

    expect(screen.getByRole('tab', { name: 'Nalog' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Podešavanja naloga')).toBeInTheDocument();
    expect(screen.queryByText('Tema')).not.toBeInTheDocument();
  });

  it('does not query account profile while offline', async () => {
    mockUseOnline.mockReturnValue(false);

    await renderSettings('/settings/account');

    expect(
      screen.getByText('Podešavanja naloga nisu dostupna offline'),
    ).toBeInTheDocument();
    expect(mockFetchAccountProfile).not.toHaveBeenCalled();
    expect(mockFetchAccountSessions).not.toHaveBeenCalled();
  });

  it('queries and shows account profile while online', async () => {
    await renderSettings('/settings/account');

    expect(await screen.findByText('test@example.com')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Uredi profilnu sliku' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Obriši nalog' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    expect(mockFetchAccountProfile).toHaveBeenCalledTimes(1);
  });

  it('opens the file picker when the avatar button is pressed', async () => {
    const user = userEvent.setup();
    await renderSettings('/settings/account');
    await screen.findByText('test@example.com');

    const fileInput = screen.getByTestId('profile-image-input');
    const clickSpy = vi.spyOn(fileInput, 'click');

    await user.click(
      screen.getByRole('button', { name: 'Uredi profilnu sliku' }),
    );
    await user.click(await screen.findByText('Promeni profilnu sliku'));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('opens crop modal for selected image and cancels without changing avatar', async () => {
    const user = userEvent.setup();
    mockFetchAccountProfile.mockResolvedValue({
      id: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.png',
    });

    await renderSettings('/settings/account');
    await screen.findByText('test@example.com');

    const fileInput = screen.getByTestId('profile-image-input');
    const file = new File(['fake'], 'avatar.png', { type: 'image/png' });
    await user.upload(fileInput, file);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('mock-cropper')).toHaveAttribute(
      'data-image',
      'blob:avatar-image',
    );

    await user.click(screen.getByRole('button', { name: 'Otkaži' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Uredi profilnu sliku' }),
    ).toBeInTheDocument();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:avatar-image');
  });

  it('revokes object url on unmount when crop modal is open', async () => {
    const user = userEvent.setup();
    const { unmount } = await renderSettings('/settings/account');
    await screen.findByText('test@example.com');

    const fileInput = screen.getByTestId('profile-image-input');
    await user.upload(
      fileInput,
      new File(['fake'], 'avatar.png', { type: 'image/png' }),
    );
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    mockRevokeObjectURL.mockClear();
    unmount();

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:avatar-image');
  });

  it('uploads cropped avatar on success and shows validation error for oversized export', async () => {
    const user = userEvent.setup();
    class MockImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      addEventListener() {}
      removeEventListener() {}
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', MockImage);
    const toBlob = vi.fn((cb: (blob: Blob | null) => void) => {
      cb(new Blob(['avatar'], { type: 'image/webp' }));
    });
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(
      (tagName: string) => {
        if (tagName === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: () => ({ drawImage: vi.fn() }),
            toBlob,
          } as unknown as HTMLCanvasElement;
        }
        return createElement(tagName);
      },
    );

    await renderSettings('/settings/account');
    await screen.findByText('test@example.com');

    const fileInput = screen.getByTestId('profile-image-input');
    await user.upload(
      fileInput,
      new File(['fake'], 'avatar.png', { type: 'image/png' }),
    );
    await waitFor(() => expect(mockCreateObjectURL).toHaveBeenCalledTimes(1));
    await user.click(screen.getByTestId('mock-cropper'));

    await user.click(screen.getByRole('button', { name: 'Sačuvaj sliku' }));

    await waitFor(() =>
      expect(mockUploadProfileImage).toHaveBeenCalledWith(expect.any(Blob)),
    );

    mockUploadProfileImage.mockReset();
    mockUploadProfileImage.mockResolvedValue(undefined);
    toBlob.mockImplementation((cb: (blob: Blob | null) => void) => {
      cb(new Blob([new Uint8Array(300 * 1024)], { type: 'image/webp' }));
    });

    await user.upload(
      fileInput,
      new File(['fake2'], 'avatar2.png', { type: 'image/png' }),
    );
    await user.click(screen.getByTestId('mock-cropper'));
    await user.click(screen.getByRole('button', { name: 'Sačuvaj sliku' }));

    expect(mockUploadProfileImage).not.toHaveBeenCalled();
    expect(
      await screen.findByText('Profilna slika mora biti manja od 256 KB.'),
    ).toBeInTheDocument();
  });

  it('removes avatar from account controls', async () => {
    const user = userEvent.setup();
    mockFetchAccountProfile.mockResolvedValue({
      id: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.png',
    });

    await renderSettings('/settings/account');
    await screen.findByText('test@example.com');

    await user.click(
      screen.getByRole('button', { name: 'Uredi profilnu sliku' }),
    );
    await user.click(await screen.findByText('Ukloni profilnu sliku'));

    expect(mockRemoveProfileImage).toHaveBeenCalledTimes(1);
  });

  it('shows account sessions with metadata and without raw tokens', async () => {
    await renderSettings('/settings/account');

    expect(await screen.findByText('Sesije')).toBeInTheDocument();
    expect(screen.getByText('203.0.113.10')).toBeInTheDocument();
    expect(screen.getByText('Chrome 150.0 on Linux')).toBeInTheDocument();
    expect(screen.getByText('198.51.100.24')).toBeInTheDocument();
    expect(screen.getByText('Safari 18.0 on iOS')).toBeInTheDocument();
    expect(screen.getByText(/Apr 30, 2026/)).toBeInTheDocument();
    expect(screen.getAllByText(/Jun 1, 2026/)).toHaveLength(2);
    expect(screen.queryByText('current-token-secret')).not.toBeInTheDocument();
    expect(screen.queryByText('other-token-secret')).not.toBeInTheDocument();
    expect(mockFetchAccountSessions).toHaveBeenCalledTimes(1);
  });

  it('shows fallback text for unavailable session metadata', async () => {
    mockFetchAccountSessions.mockResolvedValue([
      {
        id: 'current-session',
        token: 'current-token-secret',
        ipAddress: null,
        userAgent: null,
        createdAt: null,
        expiresAt: null,
        isCurrent: true,
      },
    ]);

    await renderSettings('/settings/account');

    expect(
      await screen.findByText('IP adresa nije dostupna'),
    ).toBeInTheDocument();
    expect(screen.getByText('Uređaj nije poznat')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) => element?.textContent === 'Kreirana: nije dostupna',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) => element?.textContent === 'Ističe: nije dostupna',
      ),
    ).toBeInTheDocument();
  });

  it('marks the current session and does not allow revoking it', async () => {
    mockFetchAccountSessions.mockResolvedValue([
      {
        id: 'other-session',
        token: 'other-token-secret',
        ipAddress: '198.51.100.24',
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        createdAt: Date.parse('2026-04-29T10:00:00.000Z'),
        expiresAt: Date.parse('2026-06-01T09:00:00.000Z'),
        isCurrent: false,
      },
      {
        id: 'current-session',
        token: 'current-token-secret',
        ipAddress: '203.0.113.10',
        userAgent:
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
        createdAt: Date.parse('2026-04-30T10:00:00.000Z'),
        expiresAt: Date.parse('2026-06-01T10:00:00.000Z'),
        isCurrent: true,
      },
    ]);

    await renderSettings('/settings/account');

    expect(await screen.findAllByText('Trenutna sesija')).toHaveLength(2);
    expect(
      screen
        .getAllByText('Trenutna sesija')[0]
        .compareDocumentPosition(screen.getByText('Druga sesija')),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      screen.getByRole('button', { name: 'Odjavi ovu sesiju' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Odjavi ovu sesiju' }),
    ).toHaveLength(1);
  });

  it('revokes one non-current session and refreshes sessions', async () => {
    const user = userEvent.setup();
    await renderSettings('/settings/account');
    await screen.findByText('Safari 18.0 on iOS');

    await user.click(screen.getByRole('button', { name: 'Odjavi ovu sesiju' }));

    expect(mockRevokeAccountSession).toHaveBeenCalledWith('other-token-secret');
    expect(
      await screen.findByText('Sesija je odjavljena.'),
    ).toBeInTheDocument();
    expect(mockFetchAccountSessions).toHaveBeenCalledTimes(2);
  });

  it('shows an error when individual session revocation fails', async () => {
    const user = userEvent.setup();
    mockRevokeAccountSession.mockRejectedValue(new Error('Nope'));

    await renderSettings('/settings/account');
    await screen.findByText('Safari 18.0 on iOS');

    await user.click(screen.getByRole('button', { name: 'Odjavi ovu sesiju' }));

    expect(mockRevokeAccountSession).toHaveBeenCalledWith('other-token-secret');
    expect(
      await screen.findByText('Nije moguće odjaviti sesiju. Pokušajte ponovo.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Safari 18.0 on iOS')).toBeInTheDocument();
  });

  it('revokes all other sessions and refreshes sessions', async () => {
    const user = userEvent.setup();
    await renderSettings('/settings/account');
    await screen.findByText('Safari 18.0 on iOS');

    await user.click(
      screen.getByRole('button', { name: 'Odjavi sve ostale sesije' }),
    );

    expect(mockRevokeOtherAccountSessions).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText('Sve ostale sesije su odjavljene.'),
    ).toBeInTheDocument();
    expect(mockFetchAccountSessions).toHaveBeenCalledTimes(2);
  });

  it('hides revoke-all when no other sessions exist', async () => {
    mockFetchAccountSessions.mockResolvedValue([
      {
        id: 'current-session',
        token: 'current-token-secret',
        ipAddress: '203.0.113.10',
        userAgent:
          'Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0',
        createdAt: null,
        expiresAt: null,
        isCurrent: true,
      },
    ]);

    await renderSettings('/settings/account');

    expect(
      await screen.findByText('Nema drugih aktivnih sesija.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Odjavi sve ostale sesije' }),
    ).not.toBeInTheDocument();
  });

  it('shows an error when revoking all other sessions fails', async () => {
    const user = userEvent.setup();
    mockRevokeOtherAccountSessions.mockRejectedValue(new Error('Nope'));

    await renderSettings('/settings/account');
    await screen.findByText('Safari 18.0 on iOS');

    await user.click(
      screen.getByRole('button', { name: 'Odjavi sve ostale sesije' }),
    );

    expect(mockRevokeOtherAccountSessions).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(
        'Nije moguće odjaviti ostale sesije. Pokušajte ponovo.',
      ),
    ).toBeInTheDocument();
  });

  it('keeps account controls visible when sessions fail to load', async () => {
    mockFetchAccountSessions.mockRejectedValue(new Error('Nope'));

    await renderSettings('/settings/account');

    expect(await screen.findByText('test@example.com')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Obriši nalog' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Nije moguće učitati sesije')).toBeInTheDocument();
  });

  it('opens delete modal and enables submit after typed email matches', async () => {
    const user = userEvent.setup();
    await renderSettings('/settings/account');
    await screen.findByText('test@example.com');

    await user.click(screen.getByRole('button', { name: /obriši nalog/i }));

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Obriši nalog?' }),
    ).toBeInTheDocument();
    const confirm = within(dialog).getByLabelText('Email adresa');
    expect(
      within(dialog).getByRole('button', { name: 'Obriši nalog' }),
    ).toBeDisabled();

    await user.type(confirm, 'test@example.com');

    expect(
      within(dialog).getByRole('button', { name: 'Obriši nalog' }),
    ).toBeEnabled();
  });

  it('submits delete account flow', async () => {
    const user = userEvent.setup();
    mockDeleteAccount.mockResolvedValue(undefined);

    await renderSettings('/settings/account');
    await screen.findByText('test@example.com');

    await user.click(screen.getByRole('button', { name: /obriši nalog/i }));
    const dialog = await screen.findByRole('dialog');
    await user.type(
      within(dialog).getByLabelText('Email adresa'),
      'test@example.com',
    );
    await user.click(
      within(dialog).getByRole('button', { name: /obriši nalog/i }),
    );

    expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
  });
});
