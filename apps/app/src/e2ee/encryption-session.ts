import {
  clearLocalEncryptionUnlockMaterial,
  LOCAL_ENCRYPTION_UNLOCK_KEY,
} from './cleanup';

export type EncryptionSessionStatus =
  | 'uninitialized'
  | 'locked'
  | 'unlocked'
  | 'setup-submitting'
  | 'unlock-submitting'
  | 'error';

export type EncryptionSessionState = {
  status: EncryptionSessionStatus;
  hasProfile: boolean;
  error?: 'setup' | 'unlock';
};

type PlaceholderEncryptionProfile = {
  version: 1;
  verifier: string;
};

type LocalEncryptionUnlockMaterial = {
  version: 1;
  userId: string;
  unlockedAt: string;
};

const PROFILE_KEY_PREFIX = 'autokpo:e2ee:profile:';

function profileKey(userId: string): string {
  return `${PROFILE_KEY_PREFIX}${userId}`;
}

function parseProfile(raw: string | null): PlaceholderEncryptionProfile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PlaceholderEncryptionProfile>;
    if (parsed.version === 1 && typeof parsed.verifier === 'string') {
      return { version: 1, verifier: parsed.verifier };
    }
  } catch {
    return null;
  }
  return null;
}

function readLocalEncryptionUnlockMaterial(): LocalEncryptionUnlockMaterial | null {
  const raw = sessionStorage.getItem(LOCAL_ENCRYPTION_UNLOCK_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LocalEncryptionUnlockMaterial>;
    if (
      parsed.version === 1 &&
      typeof parsed.userId === 'string' &&
      typeof parsed.unlockedAt === 'string'
    ) {
      return {
        version: 1,
        userId: parsed.userId,
        unlockedAt: parsed.unlockedAt,
      };
    }
  } catch {
    clearLocalEncryptionUnlockMaterial();
  }
  return null;
}

export function hasEncryptionProfile(userId: string): boolean {
  return parseProfile(localStorage.getItem(profileKey(userId))) !== null;
}

export function isEncryptionSessionUnlocked(userId: string): boolean {
  return readLocalEncryptionUnlockMaterial()?.userId === userId;
}

export function getInitialEncryptionSessionState(
  userId: string,
): EncryptionSessionState {
  const hasProfile = hasEncryptionProfile(userId);
  if (!hasProfile) {
    return { status: 'uninitialized', hasProfile };
  }
  if (isEncryptionSessionUnlocked(userId)) {
    return { status: 'unlocked', hasProfile };
  }
  return { status: 'locked', hasProfile };
}

export function createPlaceholderEncryptionProfile(
  userId: string,
  password: string,
): void {
  localStorage.setItem(
    profileKey(userId),
    JSON.stringify({
      version: 1,
      verifier: password,
    } satisfies PlaceholderEncryptionProfile),
  );
  unlockEncryptionSession(userId);
}

export function verifyPlaceholderEncryptionPassword(
  userId: string,
  password: string,
): boolean {
  return (
    parseProfile(localStorage.getItem(profileKey(userId)))?.verifier ===
    password
  );
}

export function unlockEncryptionSession(userId: string): void {
  sessionStorage.setItem(
    LOCAL_ENCRYPTION_UNLOCK_KEY,
    JSON.stringify({
      version: 1,
      userId,
      unlockedAt: new Date().toISOString(),
    } satisfies LocalEncryptionUnlockMaterial),
  );
}
