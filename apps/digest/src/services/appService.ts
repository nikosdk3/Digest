import { AppService, ToastType } from '../types/system';
import { documentDir, join } from '@tauri-apps/api/path';
import { SystemSettings } from '../types/settings';
import { message, open } from '@tauri-apps/plugin-dialog';
import { Book, BookFormat } from '../types/book';
import { convertFileSrc } from '@tauri-apps/api/core';
import { LOCAL_BOOKS_SUBDIR } from './constants';
import { resolvePath, fileSystem } from './fileSystem';
import { BookDoc } from '@/libs/document';

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
  importBook: async (file: string | File, books: Book[], overwrite: boolean = false): Promise<Book[]> => {
    try {
      let loadedBook: BookDoc;
      let format: BookFormat;
      let filename: string; 
      let fileobj: File;

      try {
        if (typeof file === 'string') {
          filename = file;
          fileobj = await new RemoteFile
        }
      }
    }
  }
  loadLibraryBooks: async () => {
    let books: Book[] = [];
    try {
      const txt = await appService.fs.readFile('books.json', 'Books', 'text');
      books = JSON.parse(txt as string);
    } catch {
      await appService.fs.writeFile('books.json', 'Books', '[]');
    }

    books.forEach((book) => {
      book.coverImageUrl = appService.generateCoverUrl(book);
    });

    return books;
  },
  generateCoverUrl: (book: Book) => {
    return convertFileSrc(`${BOOKS_DIR}/${book.hash}/cover.png`);
  },
};
