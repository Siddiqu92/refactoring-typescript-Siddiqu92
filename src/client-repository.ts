import { Low, JSONFile } from "lowdb/node";
import { Client } from "./client.js";

type Schema = {
  clients: Client[];
  users: unknown[];
};

export class ClientRepository {
  private db?: Low<Schema>;

  private async init() {
    if (!this.db) {
      const adapter = new JSONFile<Schema>("db.json");
      this.db = new Low<Schema>(adapter);
      await this.db.read();
      this.db.data ||= { clients: [], users: [] };
    }
  }

  public async getById(id: string): Promise<Client | null> {
    await this.init();
    const clients = this.db!.data!.clients;
    const found = clients.find((c) => c.id === id) ?? null;
    if (!found) return null;
    return { id: found.id, name: found.name };
  }

  public async getAll(): Promise<Client[]> {
    await this.init();
    return this.db!.data!.clients;
  }
}