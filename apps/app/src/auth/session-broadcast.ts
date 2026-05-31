import type { SessionData } from './use-session-query';

const CHANNEL_NAME = 'autokpo-auth';

type SessionChangeMessage = {
  type: 'session-change';
  session: SessionData | null;
};

function isSessionChangeMessage(v: unknown): v is SessionChangeMessage {
  return (
    typeof v === 'object' &&
    v !== null &&
    'type' in v &&
    (v as Record<string, unknown>).type === 'session-change' &&
    'session' in v
  );
}

const channel = new BroadcastChannel(CHANNEL_NAME);

export function broadcastSessionChange(session: SessionData | null): void {
  channel.postMessage({
    type: 'session-change',
    session,
  } satisfies SessionChangeMessage);
}

export function subscribeToSessionChanges(
  handler: (session: SessionData | null) => void,
): () => void {
  const listener = (event: MessageEvent<unknown>) => {
    if (isSessionChangeMessage(event.data)) {
      handler(event.data.session);
    }
  };
  channel.addEventListener('message', listener);
  return () => {
    channel.removeEventListener('message', listener);
  };
}
