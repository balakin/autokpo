import { use } from 'react';

import { AuthContext } from './auth-context';
import { ProfilePopover } from './profile-popover';

export function UserProfileButton() {
  const auth = use(AuthContext);
  if (auth === null) {
    return null;
  }
  return <ProfilePopover />;
}
