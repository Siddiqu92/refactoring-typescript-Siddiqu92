import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { IClient } from "../types/user.interface.js";

type DatabaseSchema = {
  users: IUser[];
  clients: IClient[];
};

interface IUser {
  id: string;
  firstname: string;
  surname: string;
  email: string;
  dateOfBirth: Date;
  client: IClient;
  hasCreditLimit: boolean;
  creditLimit?: number;
}

export interface IClientRepository {
  findById(id: string): Promise<IClient | null>;
  findAll(): Promise<IClient[]>;
}

export class ClientRepository implements IClientRepository {
  private db: Low<DatabaseSchema> | null = null;
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

  public async findById(id: string): Promise<IClient | null> {
    const db = await this.initialize();
    const client = db.data!.clients.find((c: IClient) => c.id === id) || null;
    return client;
  }

  public async findAll(): Promise<IClient[]> {
    const db = await this.initialize();
    return db.data!.clients;
  }
}

