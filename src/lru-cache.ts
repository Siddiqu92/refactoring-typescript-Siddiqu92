/**
 * A Least Recently Used (LRU) cache with Time-to-Live (TTL) support. Items are kept in the cache until they either
 * reach their TTL or the cache reaches its size and/or item limit. When the limit is exceeded, the cache evicts the
 * item that was least recently accessed (based on the timestamp of access). Items are also automatically evicted if they
 * are expired, as determined by the TTL.
 * An item is considered accessed, and its last accessed timestamp is updated, whenever `has`, `get`, or `set` is called with its key.
 */

type LRUCacheProviderOptions = {
  ttl: number; // Time to live in milliseconds
  itemLimit: number;
};

type LRUCacheProvider<T> = {
  has: (key: string) => boolean;
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => void;
};

interface CacheItem<T> {
  value: T;
  lastAccessed: number;
  createdAt: number;
}

export function createLRUCacheProvider<T>({
  ttl,
  itemLimit,
}: LRUCacheProviderOptions): LRUCacheProvider<T> {
  const cache = new Map<string, CacheItem<T>>();

  const isExpired = (item: CacheItem<T>): boolean => {
    const now = Date.now();
    return now - item.createdAt >= ttl;
  };

  const evictLeastRecentlyUsed = (): void => {
    if (cache.size < itemLimit) return;

    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, item] of cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      cache.delete(oldestKey);
    }
  };

  const updateAccessTime = (key: string): void => {
    const item = cache.get(key);
    if (item) {
      item.lastAccessed = Date.now();
    }
  };

  return {
    has: (key: string): boolean => {
      const item = cache.get(key);
      if (!item) return false;

      if (isExpired(item)) {
        cache.delete(key);
        return false;
      }

      updateAccessTime(key);
      return true;
    },

    get: (key: string): T | undefined => {
      const item = cache.get(key);
      if (!item) return undefined;

      if (isExpired(item)) {
        cache.delete(key);
        return undefined;
      }

      updateAccessTime(key);
      return item.value;
    },

    set: (key: string, value: T): void => {
      const now = Date.now();
      const existingItem = cache.get(key);

      if (existingItem) {
        existingItem.value = value;
        existingItem.lastAccessed = now;
        existingItem.createdAt = now;
        return;
      }

      if (cache.size >= itemLimit) {
        evictLeastRecentlyUsed();
      }

      cache.set(key, {
        value,
        lastAccessed: now,
        createdAt: now,
      });
    },
  };
}
