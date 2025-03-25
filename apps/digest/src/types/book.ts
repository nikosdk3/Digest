export type BookFormat = 'EPUB' | 'PDF' | 'MOBI' | 'CBZ' | 'FB2' | 'FBZ';

export interface Book {
  hash: string;
  format: BookFormat;
  title: string;
  author: string;
  group?: string;
  tags?: string[];
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
  name: string;
  books: Book[];
  lastUpdated: number;
}
