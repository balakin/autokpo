export type BusMessage =
  | { type: 'local-update'; bytes: Uint8Array }
  | { type: 'remote-update'; bytes: Uint8Array }
  | { type: 'request-sync' };

type Listener = (msg: BusMessage) => void;

const CHANNEL_NAME = 'autokpo-bus';

let channel: BroadcastChannel | null = null;
const listeners = new Set<Listener>();

function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (e: MessageEvent) => {
      const msg = e.data as BusMessage;
      for (const listener of listeners) {
        listener(msg);
      }
    };
  }
  return channel;
}

export function post(msg: BusMessage): void {
  getChannel().postMessage(msg);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  getChannel();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && channel) {
      channel.close();
      channel = null;
    }
  };
}

export function close(): void {
  if (channel) {
    channel.close();
    channel = null;
  }
  listeners.clear();
}
