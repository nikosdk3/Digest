export type BookFormat = 'EPUB' | 'PDF';

export interface Book {
  id: string;
  format: BookFormat;
  title: string;
  author: string;
  lastUpdated: number;
  isRemoved?: boolean;
  coverImageUrl?: string | null;
}

export interface BookNote {
  cfi: string;
  start: string;
  end: string;
  page: number;
  noteText?: string;
  annotation?: string;
  lastModified: string;
  removalTimestamp?: string;
}

export interface BooksGroup {
  id: string;
  name: string;
  books: Book[];
  lastUpdated: number;
}

export type LibraryItem = Book | BooksGroup;