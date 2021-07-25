class LruCache<T> {
  private values: Map<string, T> = new Map<string, T>();

  private maxEntries = 20;

  public get(key: string): T | undefined {
    const hasKey = this.values.has(key);
    let entry: T | undefined;

    if (hasKey) {
      // peek the entry, re-insert for LRU strategy
      entry = this.values.get(key);
      this.values.delete(key);
      if (typeof entry !== "undefined") {
        this.values.set(key, entry);
      }
    }

    return entry;
  }

  public set(key: string, value: T): void {
    if (this.values.size >= this.maxEntries) {
      // least-recently used cache eviction strategy
      const keyToDelete = this.values.keys().next().value;

      this.values.delete(keyToDelete);
    }

    this.values.set(key, value);
  }

  public delete(key: string): void {
    this.values.delete(key);
  }
}

export { LruCache };
