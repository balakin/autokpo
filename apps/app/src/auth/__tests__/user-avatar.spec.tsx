import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import { i18n } from 'src/i18n/i18n';
import { describe, expect, it } from 'vitest';

import { UserAvatar } from '../user-avatar';
import { getAvatarColorClass } from '../user-avatar-color';

describe('UserAvatar', () => {
  it('shows fallback safely when image url exists in test env', () => {
    render(
      <I18nProvider i18n={i18n}>
        <UserAvatar
          userId="u1"
          email="user@example.com"
          image="https://img.example.com/u1.png"
        />
      </I18nProvider>,
    );

    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('falls back to initial when image is absent', () => {
    render(
      <I18nProvider i18n={i18n}>
        <UserAvatar userId="u1" email="user@example.com" image={null} />
      </I18nProvider>,
    );

    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('derives deterministic color from userId', () => {
    expect(getAvatarColorClass('same-user')).toBe(
      getAvatarColorClass('same-user'),
    );
    expect(getAvatarColorClass('same-user')).not.toBe(
      getAvatarColorClass('different-user'),
    );
  });
});
