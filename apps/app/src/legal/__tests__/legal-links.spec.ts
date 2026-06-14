import { describe, expect, it } from 'vitest';

import { getLegalLinks } from '../legal-links';

describe('getLegalLinks', () => {
  it('resolves English default routes', () => {
    expect(getLegalLinks('en')).toEqual({
      terms: 'https://autokpo.com/terms/',
      privacy: 'https://autokpo.com/privacy/',
    });
  });

  it('resolves Serbian Latin prefixed routes', () => {
    expect(getLegalLinks('sr-Latn')).toEqual({
      terms: 'https://autokpo.com/sr-latn/terms/',
      privacy: 'https://autokpo.com/sr-latn/privacy/',
    });
  });

  it('resolves Russian prefixed routes', () => {
    expect(getLegalLinks('ru')).toEqual({
      terms: 'https://autokpo.com/ru/terms/',
      privacy: 'https://autokpo.com/ru/privacy/',
    });
  });

  it('falls back to English routes for unsupported locales', () => {
    expect(getLegalLinks('de')).toEqual({
      terms: 'https://autokpo.com/terms/',
      privacy: 'https://autokpo.com/privacy/',
    });
  });
});
