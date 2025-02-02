export type BaseDir = 'Books' | 'Settings' | 'Data' | 'Log' | 'Cache' | 'None';

export interface FileSystem {
  readFile(fp: string, base: BaseDir, mode: 'text' | 'binary'): Promise<string | ArrayBuffer>;
  writeFile(path: string, base: BaseDir, content: string | ArrayBuffer): Promise<void>;
  removeFile(path: string, base: BaseDir): Promise<void>;
  readDir(path: string, base: BaseDir): Promise<{ path: string; isDir: boolean }[]>;
  createDir(path: string, base: BaseDir, recursive?: boolean): Promise<void>;
  removeDir(path: string, base: BaseDir, recursive?: boolean): Promise<void>;
  exists(path: string, base: BaseDir): Promise<boolean>;
}

export interface AppService {
  fs: FileSystem;
}
