import { Book, BookConfig } from './book';
import { SystemSettings } from './settings';

export type BaseDir = 'Books' | 'Settings' | 'Data' | 'Log' | 'Cache' | 'None';
export type ToastType = 'info' | 'warning' | 'error';

export interface FileSystem {
  getURL(path: string): string;
  copyFile(srcPath: string, dstPath: string, base: BaseDir): Promise<void>;
  readFile(path: string, base: BaseDir, mode: 'text' | 'binary'): Promise<string | ArrayBuffer>;
  writeFile(path: string, base: BaseDir, content: string | ArrayBuffer): Promise<void>;
  removeFile(path: string, base: BaseDir): Promise<void>;
  readDir(path: string, base: BaseDir): Promise<{ path: string; isDir: boolean }[]>;
  createDir(path: string, base: BaseDir, recursive?: boolean): Promise<void>;
  removeDir(path: string, base: BaseDir, recursive?: boolean): Promise<void>;
  exists(path: string, base: BaseDir): Promise<boolean>;
}

export interface AppService {
  fs: FileSystem;

  loadSettings(): Promise<SystemSettings>;
  saveSettings(settings: SystemSettings): Promise<void>;
  selectDirectory(title: string): Promise<string | null>;
  selectFiles(name: string, extensions: string[]): Promise<string[]>;
  showMessage(msg: string, kind?: ToastType, title?: string, okLabel?: string): Promise<void>;

  importBook(file: string | File, books: Book[], overwrite?: boolean): Promise<Book[]>;
  loadBookConfig(book: Book): Promise<BookConfig>;
  saveBookConfig(book: Book, config: BookConfig): Promise<void>;
  loadLibraryBooks(): Promise<Book[]>;
  saveLibraryBooks(books: Book[]): Promise<void>;
  getCoverImageURL(book: Book): string;
}
