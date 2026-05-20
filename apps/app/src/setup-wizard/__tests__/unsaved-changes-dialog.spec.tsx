import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nWrapper } from 'tests/render-helpers';
import { describe, expect, it, vi } from 'vitest';

import { DocContext } from '../../crdt/doc-context';
import { YDoc } from '../../crdt/y';
import { UnsavedChangesDialog } from '../unsaved-changes-dialog';

function renderDialog(props: {
  isOpen: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  return render(
    <DocContext value={new YDoc()}>
      <I18nWrapper>
        <UnsavedChangesDialog
          isOpen={props.isOpen}
          onConfirm={props.onConfirm ?? vi.fn()}
          onCancel={props.onCancel ?? vi.fn()}
        />
      </I18nWrapper>
    </DocContext>,
  );
}

describe('UnsavedChangesDialog', () => {
  it('renders nothing visible when closed', () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByText('Napustiti stranicu?')).not.toBeInTheDocument();
  });

  it('renders heading and body when open', () => {
    renderDialog({ isOpen: true });
    expect(screen.getByText('Napustiti stranicu?')).toBeInTheDocument();
    expect(screen.getByText(/nesačuvane izmene/i)).toBeInTheDocument();
  });

  it('calls onConfirm when "Napustite" is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderDialog({ isOpen: true, onConfirm });
    await user.click(screen.getByRole('button', { name: 'Napustite' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when "Ostanite" is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderDialog({ isOpen: true, onCancel });
    await user.click(screen.getByRole('button', { name: 'Ostanite' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
