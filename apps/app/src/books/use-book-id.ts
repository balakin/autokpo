import { useParams } from 'react-router';

export function useBookId(): string {
  const { bookId } = useParams<{ bookId: string }>();
  if (!bookId) {
    throw new Error('Book route is missing bookId');
  }
  return bookId;
}
