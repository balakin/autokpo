import { bodyLimit } from 'hono/body-limit';

const payloadTooLarge = () =>
  Response.json({ code: 'payload_too_large' }, { status: 413 });

export function payloadLimit(maxSize: number) {
  return bodyLimit({ maxSize, onError: payloadTooLarge });
}
