import { Navigate } from 'react-router';

import { useYDoc } from '../crdt';
import { SetupWizard } from '../setup-wizard/setup-wizard';
import { WorkingLayout } from '../working-layout/working-layout';

import { bookSelectors } from './book-selectors';
import { useBookId } from './use-book-id';

export function BookScope() {
  const bookId = useBookId();
  const book = useYDoc(bookSelectors.routeState(bookId));

  if (!book) {
    return <Navigate to="/dashboard" replace />;
  }

  return book.hasProfile && book.hasSignature ? (
    <WorkingLayout />
  ) : (
    <SetupWizard />
  );
}
