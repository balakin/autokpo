import { describe, expect, it } from 'vitest';

import { getLegalLinks } from '../legal-links';

describe('getLegalLinks', () => {
  it('resolves Serbian Latin default routes', () => {
    expect(getLegalLinks('sr-Latn')).toEqual({
      terms: 'https://autokpo.com/terms/',
      privacy: 'https://autokpo.com/privacy/',
    });
  });

  it('resolves English prefixed routes', () => {
    expect(getLegalLinks('en')).toEqual({
      terms: 'https://autokpo.com/en/terms/',
      privacy: 'https://autokpo.com/en/privacy/',
    });
  });

  it('resolves Russian prefixed routes', () => {
    expect(getLegalLinks('ru')).toEqual({
      terms: 'https://autokpo.com/ru/terms/',
      privacy: 'https://autokpo.com/ru/privacy/',
    });
  });

  it('falls back to Serbian Latin routes for unsupported locales', () => {
    expect(getLegalLinks('de')).toEqual({
      terms: 'https://autokpo.com/terms/',
      privacy: 'https://autokpo.com/privacy/',
    });
  });
});
