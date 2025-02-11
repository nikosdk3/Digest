import {
  BaseDirectory,
  exists,
  mkdir,
  readDir,
  readFile,
  readTextFile,
  remove,
  writeFile,
  writeTextFile,
} from '@tauri-apps/plugin-fs';
import { AppService, BaseDir, ToastType } from '../types/system';
import { appCacheDir, appConfigDir, appDataDir, appLogDir } from '@tauri-apps/api/path';
import { SystemSettings } from '../types/settings';
import { message, open } from '@tauri-apps/plugin-dialog';
import { Book } from '../types/book';
import { convertFileSrc } from '@tauri-apps/api/core';

let BOOKS_DIR: string;

function resolvePath(
  fp: string,
  base: BaseDir,
): { baseDir: number; base: BaseDir; fp: string; dir: () => Promise<string> } {
  switch (base) {
    case 'Settings':
      return { baseDir: BaseDirectory.AppConfig, fp, base, dir: appConfigDir };
    case 'Data':
      return { baseDir: BaseDirectory.AppData, fp, base, dir: appDataDir };
    case 'Cache':
      return { baseDir: BaseDirectory.AppCache, fp, base, dir: appCacheDir };
    case 'Log':
      return { baseDir: BaseDirectory.AppLog, fp, base, dir: appLogDir };
    case 'Books':
      return {
        baseDir: BaseDirectory.Document,
        fp: `${BOOKS_DIR}/${fp}`,
        base,
        dir: () => new Promise((r) => r('')),
      };
    default:
      return { baseDir: BaseDirectory.Temp, fp, base, dir: () => new Promise((r) => r('')) };
  }
}

const SETTINGS_PATH = resolvePath('settings.json', 'Settings');

export const appService: AppService = {
  fs: {
    async readFile(path: string, base: BaseDir, mode: 'text' | 'binary') {
      const { fp, baseDir } = resolvePath(path, base);

      return mode === 'text'
        ? (readTextFile(fp, base && { baseDir }) as Promise<string>)
        : ((await readFile(fp, base && { baseDir })).buffer as ArrayBuffer);
    },
    async writeFile(path: string, base: BaseDir, content: string | ArrayBuffer) {
      const { fp, baseDir } = resolvePath(path, base);

      return typeof content === 'string'
        ? writeTextFile(fp, content, base && { baseDir })
        : await writeFile(fp, new Uint8Array(content), base && { baseDir });
    },
    async removeFile(path: string, base: BaseDir) {
      const { fp, baseDir } = resolvePath(path, base);

      return remove(fp, base && { baseDir });
    },
    async createDir(path: string, base: BaseDir, recursive = false) {
      const { fp, baseDir } = resolvePath(path, base);

      await mkdir(fp, base && { baseDir, recursive });
    },
    async removeDir(path: string, base: BaseDir, recursive?: boolean) {
      const { fp, baseDir } = resolvePath(path, base);

      await remove(fp, base && { baseDir, recursive });
    },
    async readDir(path: string, base: BaseDir) {
      const { fp, baseDir } = resolvePath(path, base);

      const list = await readDir(fp, base && { baseDir });
      return list.map((entity) => {
        return {
          path: entity.name,
          isDir: entity.isDirectory,
        };
      });
    },
    async exists(path: string, base: BaseDir) {
      const { fp, baseDir } = resolvePath(path, base);

      try {
        const res = await exists(fp, base && { baseDir });
        return res;
      } catch {
        return false;
      }
    },
  },
  loadSettings: async () => {
    let settings: SystemSettings;
    const { fp, base } = SETTINGS_PATH;

    try {
      await appService.fs.exists(fp, base);
      const txt = await appService.fs.readFile(fp, base, 'text');
      settings = JSON.parse(txt as string);
    } catch {
      settings = {
        localBooksDir: '',
        globalReadSettings: {
          themeType: 'auto',
          fontFamily: '',
          fontSize: 1.0,
          wordSpacing: 0.16,
          lineSpacing: 1.5,
        },
      };
      await appService.fs.createDir(fp, base, true);
      await appService.fs.writeFile(fp, base, JSON.stringify(settings));
    }

    BOOKS_DIR = settings.localBooksDir;
    return settings;
  },
  saveSettings: async (settings: SystemSettings) => {
    const { fp, base } = SETTINGS_PATH;
    await appService.fs.createDir(fp, base, true);
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
  getCoverUrl: (book: Book) => {
    return convertFileSrc(`${BOOKS_DIR}/${book.id}/cover.png`);
  },
};
