import { AppService, ToastType } from '../types/system';
import { documentDir, join } from '@tauri-apps/api/path';
import { SystemSettings } from '../types/settings';
import { message, open } from '@tauri-apps/plugin-dialog';
import { Book, BookConfig, BookFormat } from '../types/book';
import { convertFileSrc } from '@tauri-apps/api/core';
import { LOCAL_BOOKS_SUBDIR } from './constants';
import { resolvePath, fileSystem } from './fileSystem';
import { BookDoc, DocumentLoader } from '@/libs/document';
import { RemoteFile } from '@/utils/file';
import {
  getBaseFilename,
  getConfigFilename,
  getCoverFilename,
  getDir,
  getFilename,
  getLibraryFilename,
  INIT_BOOK_CONFIG,
} from '@/utils/book';
import { partialMD5 } from '@/utils/md5';

let BOOKS_DIR = '';

const SETTINGS_PATH = resolvePath('settings.json', 'Settings');

export const appService: AppService = {
  fs: fileSystem,
  loadSettings: async () => {
    let settings: SystemSettings;
    const { fp, base } = SETTINGS_PATH;

    try {
      await appService.fs.exists(fp, base);
      const txt = await appService.fs.readFile(fp, base, 'text');
      settings = JSON.parse(txt as string);
    } catch {
      const INIT_BOOKS_DIR = await join(await documentDir(), LOCAL_BOOKS_SUBDIR);
      await appService.fs.createDir('', 'Books', true);
      settings = {
        localBooksDir: INIT_BOOKS_DIR,
        globalReadSettings: {
          themeType: 'auto',
          fontFamily: '',
          fontSize: 1.0,
          wordSpacing: 0.16,
          lineSpacing: 1.5,
        },
      } as SystemSettings;
      await appService.fs.createDir('', base, true);
      await appService.fs.writeFile(fp, base, JSON.stringify(settings));
    }

    BOOKS_DIR = settings.localBooksDir;
    return settings;
  },
  saveSettings: async (settings: SystemSettings) => {
    const { fp, base } = SETTINGS_PATH;
    await appService.fs.createDir('', base, true);
    await appService.fs.writeFile(fp, base, JSON.stringify(settings));
    BOOKS_DIR = settings.localBooksDir;
  },
  selectDirectory: async (title: string) => {
    const selected = await open({
      title,
      directory: true,
    });

    return selected as string;
  },
  selectFiles: async (name: string, extensions: string[]) => {
    const selected = await open({
      multiple: true,
      filters: [{ name, extensions }],
    });
    return Array.isArray(selected) ? selected : selected ? [selected] : [];
  },
  showMessage: async (msg: string, kind: ToastType = 'info', title?: string, okLabel?: string) => {
    await message(msg, { kind, title, okLabel });
  },
  importBook: async (
    file: string | File,
    books: Book[],
    overwrite: boolean = false,
  ): Promise<Book[]> => {
    try {
      let loadedBook: BookDoc;
      let format: BookFormat;
      let filename: string;
      let fileobj: File;

      try {
        if (typeof file === 'string') {
          filename = file;
          fileobj = await new RemoteFile(appService.fs.getURL(file), file).open();
        } else {
          filename = file.name;
          fileobj = file;
        }
        ({ book: loadedBook, format } = await new DocumentLoader(fileobj).open());
        if (!loadedBook.metadata.title) {
          loadedBook.metadata.title = getBaseFilename(filename);
        }
      } catch (error) {
        console.error(error);
        throw new Error(`Failed to open the book: ${(error as Error).message || error}`);
      }

      const hash = await partialMD5(fileobj);
      const existingBook = books.find((book) => book.hash === hash);
      if (existingBook) {
        if (existingBook.isRemoved) {
          delete existingBook.isRemoved;
        }
        existingBook.lastUpdated = Date.now();
      }

      const book: Book = {
        hash,
        format,
        title: loadedBook.metadata.title,
        author: loadedBook.metadata.author,
        lastUpdated: Date.now(),
      };
      book.coverImageUrl = appService.getCoverImageURL(book);

      if (!(await appService.fs.exists(getDir(book), 'Books'))) {
        await appService.fs.createDir(getDir(book), 'Books');
      }
      if (!(await appService.fs.exists(getFilename(book), 'Books')) || overwrite) {
        const cover = await loadedBook.getCover();
        if (cover) {
          await appService.fs.writeFile(getCoverFilename(book), 'Books', await cover.arrayBuffer());
        }
      }

      if (!existingBook) {
        await appService.saveBookConfig(book, INIT_BOOK_CONFIG);
        books.splice(0, 0, book);
      }
    } catch (error) {
      throw error;
    }
    return books;
  },
  loadBookConfig: async (book: Book): Promise<BookConfig> => {
    try {
      const str = await appService.fs.readFile(getConfigFilename(book), 'Books', 'text');
      return JSON.parse(str as string);
    } catch {
      return INIT_BOOK_CONFIG;
    }
  },
  saveBookConfig: async (book: Book, config: BookConfig) => {
    await appService.fs.writeFile(getConfigFilename(book), 'Books', JSON.stringify(config));
  },
  loadLibraryBooks: async () => {
    let books: Book[] = [];
    const libraryFilename = getLibraryFilename();
    try {
      const txt = await appService.fs.readFile(libraryFilename, 'Books', 'text');
      books = JSON.parse(txt as string);
    } catch {
      await appService.fs.writeFile(libraryFilename, 'Books', '[]');
    }

    books.forEach((book) => {
      book.coverImageUrl = appService.getCoverImageURL(book);
    });

    return books;
  },
  saveLibraryBooks: async (books: Book[]) => {
    await appService.fs.writeFile(getLibraryFilename(), 'Books', JSON.stringify(books));
  },
  getCoverImageURL: (book: Book) => {
    return convertFileSrc(`${BOOKS_DIR}/${book.hash}/cover.png`);
  },
};
