import { describe, expect, it } from 'vitest';

import { DISPOSABLE_EMAIL_DOMAINS } from '../disposable-email-blocklist';

describe('DISPOSABLE_EMAIL_DOMAINS', () => {
  it('blocks known disposable email domains', () => {
    expect(DISPOSABLE_EMAIL_DOMAINS.has('mailinator.com')).toBe(true);
    expect(DISPOSABLE_EMAIL_DOMAINS.has('guerrillamail.com')).toBe(true);
    expect(DISPOSABLE_EMAIL_DOMAINS.has('10minutemail.com')).toBe(true);
    expect(DISPOSABLE_EMAIL_DOMAINS.has('dispostable.com')).toBe(true);
  });

  it('does not block legitimate email domains', () => {
    expect(DISPOSABLE_EMAIL_DOMAINS.has('gmail.com')).toBe(false);
    expect(DISPOSABLE_EMAIL_DOMAINS.has('outlook.com')).toBe(false);
    expect(DISPOSABLE_EMAIL_DOMAINS.has('yahoo.com')).toBe(false);
    expect(DISPOSABLE_EMAIL_DOMAINS.has('example.com')).toBe(false);
  });

  it('contains a substantial number of domains', () => {
    expect(DISPOSABLE_EMAIL_DOMAINS.size).toBeGreaterThan(5000);
  });
});
