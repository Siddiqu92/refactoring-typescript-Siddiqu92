// user-repository.ts
import { Low, JSONFile } from "lowdb/node";
import { User } from "./user.js";

type Schema = {
  clients: any[]; // Define properly
  users: User[];
};

export class UserRepository {
  private db?: Low<Schema>;

  private async init(): Promise<Low<Schema>> {
    if (this.db) return this.db;
    
    const adapter = new JSONFile<Schema>("db.json");
    this.db = new Low<Schema>(adapter, { users: [], clients: [] });
    await this.db.read();
    this.db.data ||= { users: [], clients: [] };
    
    return this.db;
  }

  public async create(user: User): Promise<User> {
    const db = await this.init();
    db.data!.users.push(user);
    await db.write();
    return user;
  }

  public async update(user: User): Promise<User | null> {
    const db = await this.init();
    const index = db.data!.users.findIndex(u => u.id === user.id);
    
    if (index === -1) return null;
    
    db.data!.users[index] = user;
    await db.write();
    return user;
  }

  public async findAll(): Promise<User[]> {
    const db = await this.init();
    return db.data!.users;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const db = await this.init();
    const user = db.data!.users.find(u => 
      u.email.toLowerCase() === email.toLowerCase()
    );
    return user || null;
  }

  public async findById(id: string): Promise<User | null> {
    const db = await this.init();
    const user = db.data!.users.find(u => u.id === id);
    return user || null;
  }
}