import { Avatar } from '@heroui/react';
import { useLingui } from '@lingui/react/macro';

import { getAvatarColorClass } from './user-avatar-color';

function getEmailInitial(email: string | null): string {
  if (!email) {
    return '?';
  }
  return email.trim().charAt(0).toUpperCase() || '?';
}

interface UserAvatarProps {
  userId: string;
  email: string | null;
  image: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

export function UserAvatar({
  userId,
  email,
  image,
  size = 'sm',
  className,
}: UserAvatarProps) {
  const fallbackSizeClass = size === 'md' ? 'text-base' : 'text-sm';
  const { t } = useLingui();

  return (
    <Avatar
      size={size}
      className={`overflow-hidden rounded-full ${className ?? ''}`}
    >
      <Avatar.Image src={image ?? undefined} alt={t`Korisnički avatar`} />
      <Avatar.Fallback
        className={`${fallbackSizeClass} ${getAvatarColorClass(userId)} font-semibold text-white`}
      >
        {getEmailInitial(email)}
      </Avatar.Fallback>
    </Avatar>
  );
}
