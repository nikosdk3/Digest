import { ToastType, AppService, BaseDir, FileSystem } from '@/types/system';
import { SystemSettings } from '@/types/settings';
import { Book, BookConfig, BookContent, BookFormat } from '@/types/book';
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

export abstract class BaseAppService implements AppService {
  localBooksDir: string = ' ';
  abstract isAppDataSandbox: boolean;
  abstract fs: FileSystem;

  abstract resolvePath(fp: string, base: BaseDir): { baseDir: number; base: BaseDir; fp: string };
  abstract getCoverImageURL(book: Book): string;
  abstract getInitBooksDir(): Promise<string>;
  abstract selectDirectory(title: string): Promise<string>;
  abstract selectFiles(name: string, extensions: string[]): Promise<string[]>;
  abstract showMessage(
    msg: string,
    kind?: ToastType,
    title?: string,
    okLabel?: string,
  ): Promise<void>;

  async loadSettings(): Promise<SystemSettings> {
    let settings: SystemSettings;
    const { fp, base } = this.resolvePath('settings.json', 'Settings');

    try {
      await this.fs.exists(fp, base);
      const txt = await this.fs.readFile(fp, base, 'text');
      settings = JSON.parse(txt as string);
      if (this.isAppDataSandbox) {
        settings.localBooksDir = await this.getInitBooksDir();
      }
    } catch {
      settings = {
        localBooksDir: await this.getInitBooksDir(),
        globalReadSettings: {
          themeType: 'auto',
          fontFamily: '',
          fontSize: 1.0,
          wordSpacing: 0.16,
          lineSpacing: 1.5,
        },
      };

      await this.fs.createDir('', 'Books', true);
      await this.fs.createDir('', base, true);
      await this.fs.writeFile(fp, base, JSON.stringify(settings));
    }

    this.localBooksDir = settings.localBooksDir;
    return settings;
  }

  async saveSettings(settings: SystemSettings): Promise<void> {
    const { fp, base } = this.resolvePath('settings.json', 'Settings');
    await this.fs.createDir('', base, true);
    await this.fs.writeFile(fp, base, JSON.stringify(settings));
  }

  async importBook(
    file: string | File,
    books: Book[],
    overwrite: boolean = false,
  ): Promise<Book[]> {
    try {
      let loadedBook: BookDoc;
      let format: BookFormat;
      let filename: string;
      let fileobj: File;

      try {
        if (typeof file === 'string') {
          filename = file;
          fileobj = await new RemoteFile(this.fs.getURL(file), file).open();
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
      book.coverImageUrl = this.getCoverImageURL(book);

      if (!(await this.fs.exists(getDir(book), 'Books'))) {
        await this.fs.createDir(getDir(book), 'Books');
      }
      if (!(await this.fs.exists(getFilename(book), 'Books')) || overwrite) {
        if (typeof file === 'string') {
          await this.fs.copyFile(file, getFilename(book), 'Books');
        } else {
          await this.fs.writeFile(getFilename(book), 'Books', await file.arrayBuffer());
        }
      }
      if (!(await this.fs.exists(getCoverFilename(book), 'Books')) || overwrite) {
        const cover = await loadedBook.getCover();
        if (cover) {
          await this.fs.writeFile(getCoverFilename(book), 'Books', await cover.arrayBuffer());
        }
      }

      if (!existingBook) {
        await this.saveBookConfig(book, INIT_BOOK_CONFIG);
        books.splice(0, 0, book);
      }
    } catch (error) {
      throw error;
    }
    return books;
  }

  async loadBookContent(book: Book): Promise<BookContent> {
    const fp = getFilename(book);
    let file: File;
    if (fp.endsWith('.pdf')) {
      const content = await this.fs.readFile(fp, 'Books', 'binary');
      file = new File([content], fp, { type: 'application/pdf' });
    } else {
      file = await new RemoteFile(this.fs.getURL(`${this.localBooksDir}/${fp}`), fp).open();
    }
    return { book, file, config: await this.loadBookConfig(book) };
  }

  async loadBookConfig(book: Book): Promise<BookConfig> {
    try {
      const str = await this.fs.readFile(getConfigFilename(book), 'Books', 'text');
      return JSON.parse(str as string);
    } catch {
      return INIT_BOOK_CONFIG;
    }
  }

  async saveBookConfig(book: Book, config: BookConfig): Promise<void> {
    await this.fs.writeFile(getConfigFilename(book), 'Books', JSON.stringify(config));
  }

  async loadLibraryBooks(): Promise<Book[]> {
    let books: Book[] = [];
    const libraryFilename = getLibraryFilename();
    try {
      const txt = await this.fs.readFile(libraryFilename, 'Books', 'text');
      books = JSON.parse(txt as string);
    } catch {
      await this.fs.writeFile(libraryFilename, 'Books', '[]');
    }

    books.forEach((book) => {
      book.coverImageUrl = this.getCoverImageURL(book);
    });

    return books;
  }
  async saveLibraryBooks(books: Book[]): Promise<void> {
    await this.fs.writeFile(getLibraryFilename(), 'Books', JSON.stringify(books));
  }

  async updateLibraryBooks(book: Book): Promise<void> {
    const library = await this.loadLibraryBooks();
    const bookIndex = library.findIndex((b) => b.hash === book.hash);
    if (bookIndex !== -1) {
      library[bookIndex] = book;
    }
    await this.saveLibraryBooks(library);
  }
}
