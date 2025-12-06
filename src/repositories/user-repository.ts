import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { IUser } from "../types/user.interface.js";
import { createLRUCacheProvider } from "../lru-cache.js";

type DatabaseSchema = {
  users: IUser[];
  clients: IClient[];
};

interface IClient {
  id: string;
  name: string;
}

export interface IUserRepository {
  create(user: IUser): Promise<IUser>;
  update(user: IUser): Promise<IUser | null>;
  findAll(): Promise<IUser[]>;
  findByEmail(email: string): Promise<IUser | null>;
  findById(id: string): Promise<IUser | null>;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_ITEM_LIMIT = 100;

export class UserRepository implements IUserRepository {
  private db: Low<DatabaseSchema> | null = null;
  private userCache = createLRUCacheProvider<IUser>({
    ttl: CACHE_TTL,
    itemLimit: CACHE_ITEM_LIMIT,
  });
  private usersArrayCache = createLRUCacheProvider<IUser[]>({
    ttl: CACHE_TTL,
    itemLimit: 10, // Fewer array entries
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
    return `user_${id}`;
  }

  private getEmailCacheKey(email: string): string {
    return `user_email_${email.toLowerCase()}`;
  }

  private getAllUsersCacheKey(): string {
    return "all_users";
  }

  private invalidateUserCache(user: IUser): void {
    this.userCache.set(this.getCacheKey(user.id), user);
    this.userCache.set(this.getEmailCacheKey(user.email), user);
    // Note: all_users cache will be naturally invalidated on next read (cache miss)
  }

  public async create(user: IUser): Promise<IUser> {
    const db = await this.initialize();
    db.data!.users.push(user);
    await db.write();

    // Update cache
    this.invalidateUserCache(user);
    
    // Update all_users cache if it exists
    const allUsersCacheKey = this.getAllUsersCacheKey();
    const cachedAllUsers = this.usersArrayCache.get(allUsersCacheKey);
    if (cachedAllUsers) {
      this.usersArrayCache.set(allUsersCacheKey, [...cachedAllUsers, user]);
    }

    return user;
  }

  public async update(user: IUser): Promise<IUser | null> {
    const db = await this.initialize();
    const index = db.data!.users.findIndex((u: IUser) => u.id === user.id);

    if (index === -1) return null;

    db.data!.users[index] = user;
    await db.write();

    // Update cache
    this.invalidateUserCache(user);
    
    // Update all_users cache if it exists
    const allUsersCacheKey = this.getAllUsersCacheKey();
    const cachedAllUsers = this.usersArrayCache.get(allUsersCacheKey);
    if (cachedAllUsers) {
      const updatedAllUsers = cachedAllUsers.map((u: IUser) =>
        u.id === user.id ? user : u
      );
      this.usersArrayCache.set(allUsersCacheKey, updatedAllUsers);
    }

    return user;
  }

  public async findAll(): Promise<IUser[]> {
    // Check cache first
    const cacheKey = this.getAllUsersCacheKey();
    const cached = this.usersArrayCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const db = await this.initialize();
    const users = db.data!.users;

    // Cache the result
    this.usersArrayCache.set(cacheKey, users);

    return users;
  }

  public async findByEmail(email: string): Promise<IUser | null> {
    const normalizedEmail = email.toLowerCase();
    const cacheKey = this.getEmailCacheKey(normalizedEmail);

    // Check cache first
    const cached = this.userCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const db = await this.initialize();
    const user =
      db.data!.users.find(
        (u: IUser) => u.email.toLowerCase() === normalizedEmail
      ) || null;

    // Cache the result if found
    if (user) {
      this.userCache.set(cacheKey, user);
      this.userCache.set(this.getCacheKey(user.id), user);
    }

    return user;
  }

  public async findById(id: string): Promise<IUser | null> {
    const cacheKey = this.getCacheKey(id);

    // Check cache first
    const cached = this.userCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const db = await this.initialize();
    const user = db.data!.users.find((u: IUser) => u.id === id) || null;

    // Cache the result if found
    if (user) {
      this.userCache.set(cacheKey, user);
      this.userCache.set(this.getEmailCacheKey(user.email), user);
    }

    return user;
  }
}

