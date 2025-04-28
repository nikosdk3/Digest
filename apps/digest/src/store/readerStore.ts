import { create } from 'zustand';

import { Book, BookConfig, BookContent, BookNote } from '@/types/book';
import { AppService } from '@/types/system';

interface BookState {
  loading?: boolean;
  error?: string | null;
  book?: Book | null;
  file?: File | null;
  config?: BookConfig | null;
  fraction?: number;
}

interface ReaderStore {
  library: Book[];
  books: Record<string, BookState>;

  setLibrary: (books: Book[]) => void;
  fetchBook: (appService: AppService, id: string) => Promise<Book | null>;
  setProgress: (id: string, progress: number, location: string, pageinfo: {}) => void;
  addBookmark: (id: string, bookmark: BookNote) => void;
}

export const useReaderStore = create<ReaderStore>((set) => ({
  library: [],
  books: {},

  setLibrary: (books: Book[]) => set({ library: books }),
  fetchBook: async (appService: AppService, id: string) => {
    set((state) => ({
      books: {
        ...state.books,
        [id]: { loading: true, file: null, book: null, config: null, error: null, notes: [] },
      },
    }));

    try {
      const library = await appService.loadLibraryBooks();
      const book = library.find((b) => b.hash === id);
      if (!book) {
        throw new Error('Book not found');
      }
      const content = (await appService.loadBookContent(book)) as BookContent;
      const { file, config } = content;

      set((state) => ({
        books: {
          ...state.books,
          [id]: { ...state.books[id], loading: false, book, file, config },
        },
      }));
      return book;
    } catch (error) {
      console.error(error);
      set((state) => ({
        books: {
          ...state.books,
          [id]: { ...state.books[id], loading: false, error: 'Failed to load book.' },
        },
      }));
      return null;
    }
  },

  setProgress: (id: string, progress: number, location: string, pageinfo: {}) =>
    set((state) => {
      const book = state.books[id];
      if (!book) return state;
      return {
        books: {
          ...state.books,
          [id]: {
            ...book,
            config: {
              ...book.config,
              lastUpdated: Date.now(),
              progress,
              location,
              pageinfo,
            },
          },
        },
      };
    }),

  addBookmark: (id: string, bookmark: BookNote) =>
    set((state) => {
      const book = state.books[id];
      if (!book) return state;
      return {
        books: {
          ...state.books,
          [id]: {
            ...book,
            config: {
              ...book.config,
              lastUpdated: Date.now(),
              bookmarks: [...(book.config?.bookmarks || []), bookmark],
            },
          },
        },
      };
    }),
}));
