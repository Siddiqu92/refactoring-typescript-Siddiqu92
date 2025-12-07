import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { IClient } from "../types/user.interface.js";
import { DatabaseSchema } from "../types/database.interface.js";
import { createLRUCacheProvider } from "../lru-cache.js";
import {
  CACHE_TTL,
  CACHE_ITEM_LIMIT,
  CACHE_ARRAY_ITEM_LIMIT,
} from "../constants/cache.constants.js";

export interface IClientRepository {
  findById(id: string): Promise<IClient | null>;
  findAll(): Promise<IClient[]>;
}

export class ClientRepository implements IClientRepository {
  private db: Low<DatabaseSchema> | null = null;
  private clientCache = createLRUCacheProvider<IClient>({
    ttl: CACHE_TTL,
    itemLimit: CACHE_ITEM_LIMIT,
  });
  private clientsArrayCache = createLRUCacheProvider<IClient[]>({
    ttl: CACHE_TTL,
    itemLimit: CACHE_ARRAY_ITEM_LIMIT,
  });
  private dbPath: string;

  constructor(dbPath: string = "db.json") {
    this.dbPath = dbPath;
  }

  private async initialize(): Promise<Low<DatabaseSchema>> {
    if (this.db) return this.db;

    const adapter = new JSONFile<DatabaseSchema>(this.dbPath);
    this.db = new Low<DatabaseSchema>(adapter, { users: [], clients: [] });
    await this.db.read();
    this.db.data ||= { users: [], clients: [] };

    return this.db;
  }

  private getCacheKey(id: string): string {
    return `client_${id}`;
  }

  private getAllClientsCacheKey(): string {
    return "all_clients";
  }

  public async findById(id: string): Promise<IClient | null> {
    const cacheKey = this.getCacheKey(id);

    // Check cache first
    const cached = this.clientCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const db = await this.initialize();
    const client = db.data!.clients.find((c: IClient) => c.id === id) || null;

    // Cache the result if found
    if (client) {
      this.clientCache.set(cacheKey, client);
    }

    return client;
  }

  public async findAll(): Promise<IClient[]> {
    // Check cache first
    const cacheKey = this.getAllClientsCacheKey();
    const cached = this.clientsArrayCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const db = await this.initialize();
    const clients = db.data!.clients;

    // Cache the result
    this.clientsArrayCache.set(cacheKey, clients);

    return clients;
  }
}

