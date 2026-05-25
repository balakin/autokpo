import { InputOTP, REGEXP_ONLY_DIGITS } from '@heroui/react';

import styles from './pin-input.module.css';

type PinInputProps = {
  'aria-describedby'?: string;
  'aria-label': string;
  autoFocus?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
};

export function PinInput({
  'aria-describedby': ariaDescribedby,
  'aria-label': ariaLabel,
  autoFocus,
  isDisabled,
  isInvalid,
  value,
  onChange,
  onComplete,
}: PinInputProps) {
  return (
    <InputOTP
      aria-describedby={ariaDescribedby}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      className={styles.pinInput}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      maxLength={6}
      pattern={REGEXP_ONLY_DIGITS}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
    >
      <InputOTP.Group>
        <InputOTP.Slot index={0} />
        <InputOTP.Slot index={1} />
        <InputOTP.Slot index={2} />
      </InputOTP.Group>
      <InputOTP.Separator />
      <InputOTP.Group>
        <InputOTP.Slot index={3} />
        <InputOTP.Slot index={4} />
        <InputOTP.Slot index={5} />
      </InputOTP.Group>
    </InputOTP>
  );
}
