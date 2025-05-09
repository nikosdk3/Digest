import { BookFormat } from '@/types/book';

Object.groupBy = (iterable, callbackfn) => {
  const obj = Object.create(null);
  let i = 0;
  for (const value of iterable) {
    const key = callbackfn(value, i++);
    if (key in obj) {
      obj[key].push(value);
    } else {
      obj[key] = [value];
    }
  }
  return obj;
};

Map.groupBy = (iterable, callbackfn) => {
  const map = new Map();
  let i = 0;
  for (const value of iterable) {
    const key = callbackfn(value, i++),
      list = map.get(key);
    if (list) {
      list.push(value);
    } else {
      map.set(key, [value]);
    }
  }
  return map;
};

export type DocumentFile = File;

export interface BookDoc {
  metadata: {
    title: string;
    author: string;
    editor?: string;
    publisher?: string;
  };
  getCover(): Promise<Blob | null>;
}

export const EXTS: Record<BookFormat, string> = {
  EPUB: 'epub',
  PDF: 'pdf',
  MOBI: 'mobi',
  CBZ: 'cbz',
  FB2: 'fb2',
  FBZ: 'fbz',
};

export class DocumentLoader {
  private file: File;

  constructor(file: File) {
    this.file = file;
  }

  private async isZip(): Promise<boolean> {
    const arr = new Uint8Array(await this.file.slice(0, 4).arrayBuffer());
    console.log(arr[0], arr[1], arr[2], arr[3]);
    return arr[0] === 0x50 && arr[1] === 0x4b && arr[2] === 0x03 && arr[3] === 0x04;
  }

  private async isPDF(): Promise<boolean> {
    const arr = new Uint8Array(await this.file.slice(0, 5).arrayBuffer());
    return (
      arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46 && arr[4] === 0x2d
    );
  }

  private async makeZipLoader() {
    const { configure, ZipReader, BlobReader, TextWriter, BlobWriter } = await import(
      '@zip.js/zip.js'
    );
    type Entry = import('@zip.js/zip.js').Entry;
    configure({ useWebWorkers: false });
    const reader = new ZipReader(new BlobReader(this.file));
    const entries = await reader.getEntries();
    const map = new Map(entries.map((entry) => [entry.filename, entry]));
    const load =
      (f: (entry: Entry, type?: string) => Promise<string | Blob> | null) =>
      (name: string, ...args: [string?]) =>
        map.has(name) ? f(map.get(name)!, ...args) : null;

    const loadText = load((entry: Entry) =>
      entry.getData ? entry.getData(new TextWriter()) : null,
    );
    const loadBlob = load((entry: Entry, type?: string) =>
      entry.getData ? entry.getData(new BlobWriter(type!)) : null,
    );

    const getSize = (name: string) => map.get(name)?.uncompressedSize ?? 0;

    return { entries, loadText, loadBlob, getSize, sha1: undefined };
  }

  private isCBZ(): boolean {
    return (
      this.file.type === 'application/vnd.comicbook+zip' || this.file.name.endsWith(`.${EXTS.CBZ}`)
    );
  }

  private isFB2(): boolean {
    return (
      this.file.type === 'application/x-fictionbook+xml' || this.file.name.endsWith(`.${EXTS.FB2}`)
    );
  }

  private isFBZ(): boolean {
    return (
      this.file.type === 'application/x-zip-compressed-fb2' ||
      this.file.name.endsWith('.fb2.zip') ||
      this.file.name.endsWith(`.${EXTS.FBZ}`)
    );
  }

  public async open(): Promise<{ book: BookDoc; format: BookFormat }> {
    let book = null;
    let format: BookFormat = 'EPUB';
    if (!this.file.size) {
      throw new Error('File is empty');
    }
    if (await this.isZip()) {
      const loader = await this.makeZipLoader();
      const { entries } = loader;

      if (this.isCBZ()) {
        const { makeComicBook } = await import('foliate-js/comic-book.js');
        book = makeComicBook(loader, this.file);
        format = 'CBZ';
      } else if (this.isFBZ()) {
        const entry = entries.find((entry) => entry.filename.endsWith(`.${EXTS.FBZ}`));
        const blob = await loader.loadBlob((entry ?? entries[0]!).filename);
        const { makeFB2 } = await import('foliate-js/fb2.js');
        book = await makeFB2(blob);
        format = 'FB2';
      } else {
        const { EPUB } = await import('foliate-js/epub.js');
        book = await new EPUB(loader).init();
        format = 'EPUB';
      }
    } else if (await this.isPDF()) {
      const { makePDF } = await import('foliate-js/pdf.js');
      book = await makePDF(this.file);
      format = 'PDF';
    } else if (await (await import('foliate-js/mobi.js')).isMOBI(this.file)) {
      const fflate = await import('foliate-js/vendor/fflate.js');
      const { MOBI } = await import('foliate-js/mobi.js');
      book = await new MOBI({ unzlib: fflate.unzlibSync }).open(this.file);
      format = 'MOBI';
    } else if (this.isFB2()) {
      const { makeFB2 } = await import('foliate-js/fb2.js');
      book = await makeFB2(this.file);
      format = 'FB2';
    }
    if (!book) throw new Error('File type not supported');
    return { book, format } as { book: BookDoc; format: BookFormat };
  }
}
