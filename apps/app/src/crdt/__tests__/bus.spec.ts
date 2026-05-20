import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BusMessage } from '../bus';
import { close, post, subscribe } from '../bus';

interface MockChannel {
  name: string;
  onmessage: ((ev: MessageEvent) => void) | null;
  postMessage: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

let instance: MockChannel | null = null;

function createMockChannel(name: string): BroadcastChannel {
  const mock: MockChannel = {
    name,
    onmessage: null,
    postMessage: vi.fn(),
    close: vi.fn(),
  };
  instance = mock;
  return mock as unknown as BroadcastChannel;
}

vi.stubGlobal('BroadcastChannel', createMockChannel);

describe('bus', () => {
  afterEach(() => {
    instance = null;
    close();
  });

  describe('post', () => {
    it('calls channel.postMessage with the message', () => {
      const msg: BusMessage = {
        type: 'local-update',
        bytes: new Uint8Array([1]),
      };
      post(msg);
      expect(instance!.postMessage).toHaveBeenCalledWith(msg);
    });

    it('posts a request-sync message', () => {
      const msg: BusMessage = { type: 'request-sync' };
      post(msg);
      expect(instance!.postMessage).toHaveBeenCalledWith(msg);
    });
  });

  describe('subscribe', () => {
    it('dispatches incoming onmessage events to subscribers', () => {
      const listener = vi.fn();
      subscribe(listener);

      const msg: BusMessage = {
        type: 'remote-update',
        bytes: new Uint8Array([5, 6]),
      };
      instance!.onmessage!(new MessageEvent('message', { data: msg }));

      expect(listener).toHaveBeenCalledWith(msg);
    });

    it('stops calling listener after unsubscribe', () => {
      const listener = vi.fn();
      const unsub = subscribe(listener);
      unsub();

      const msg: BusMessage = { type: 'request-sync' };
      instance!.onmessage!(new MessageEvent('message', { data: msg }));

      expect(listener).not.toHaveBeenCalled();
    });

    it('delivers messages to multiple subscribers', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      subscribe(listener1);
      subscribe(listener2);

      const msg: BusMessage = {
        type: 'local-update',
        bytes: new Uint8Array([1]),
      };
      instance!.onmessage!(new MessageEvent('message', { data: msg }));

      expect(listener1).toHaveBeenCalledWith(msg);
      expect(listener2).toHaveBeenCalledWith(msg);
    });

    it('clears listeners and closes channel on close()', () => {
      const listener = vi.fn();
      subscribe(listener);
      close();
      const msg: BusMessage = { type: 'request-sync' };
      instance!.onmessage!(new MessageEvent('message', { data: msg }));
      expect(listener).not.toHaveBeenCalled();
      expect(instance!.close).toHaveBeenCalled();
    });
  });
});
