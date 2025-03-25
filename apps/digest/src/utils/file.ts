export class RemoteFile extends File {
  url: string;
  #name: string;
  #lastModified: number;
  #size: number = -1;
  #type: string = '';
  #cache: Map<number, ArrayBuffer> = new Map(); // LRU cache
  #order: number[] = [];

  static MAX_CACHE_CHUNK_SIZE = 1024 * 128;
  static MAX_CACHE_ITEM_SIZE: number = 10;

  constructor(url: string, name = 'remote-file', type = '', lastModified = Date.now()) {
    super([], name, { type, lastModified });
    this.url = url;
    this.#name = name;
    this.#type = type;
    this.#lastModified = lastModified;
  }

  override get name() {
    return this.#name;
  }

  override get type() {
    return this.#type;
  }

  override get size() {
    return this.#size;
  }

  override get lastModified() {
    return this.#lastModified;
  }

  async open() {
    const response = await fetch(this.url, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error(`Failed to fetch file size: ${response.status}`);
    }
    this.#size = Number(response.headers.get('content-length'));
    this.#type = response.headers.get('content-type') || '';
    return this;
  }

  async fetchRangePart(start: number, end: number) {
    start = Math.max(0, start);
    end = Math.min(this.size - 1, end);

    const response = await fetch(this.url, { headers: { Range: `bytes=${start}-${end}` } });
    if (!response.ok) {
      throw new Error(`Failed to fetch range: ${response.status}`);
    }
    return response.arrayBuffer();
  }

  async fetchRange(start: number, end: number): Promise<ArrayBuffer>;

  async #fetchAndCacheChunk(start: number, end: number): Promise<number> {
    const chunkStart = Math.max(0, start - 1024);
    const chunkEnd = Math.max(end, start + RemoteFile.MAX_CACHE_CHUNK_SIZE - 1024 - 1);
    this.#cache.set(chunkStart, await this.fetchRangePart(chunkStart, chunkEnd));
    this.#updateAccessOrder(chunkStart);
    this.#ensureCacheSize();
    return chunkStart;
  }

  #updateAccessOrder(chunkStart: number) {
    const index = this.#order.indexOf(chunkStart);
    if (index > -1) {
      this.#order.splice(index, 1);
    }
    this.#order.unshift(chunkStart);
  }

  #ensureCacheSize() {
    while (this.#cache.size > RemoteFile.MAX_CACHE_ITEM_SIZE) {
      const oldestKey = this.#order.pop();
      if (oldestKey !== undefined) {
        this.#cache.delete(oldestKey);
      }
    }
  }
}
