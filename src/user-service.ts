import { Low, JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";
import { ClientRepository } from "./client-repository.js";
import { Client } from "./client.js";
import { User } from "./user.js";

type Schema = {
  clients: Client[];
  users: User[];
};

export class UserService {
  private db?: Low<Schema>;

  private async init() {
    if (this.db) return;
    const adapter = new JSONFile<Schema>("db.json");
    this.db = new Low<Schema>(adapter);
    await this.db.read();
    this.db.data ||= { clients: [], users: [] };
  }

  public async addUser(
    firstname: string,
    surname: string,
    email: string,
    dateOfBirth: Date,
    clientId: string
  ): Promise<boolean> {
    if (!firstname || !surname || !email || !dateOfBirth) {
      return false;
    }

    await this.init();
    const users = this.db!.data!.users;

    // Check duplicate email
    if (users.some((u) => u.email === email)) {
      return false;
    }

    // Normalize dateOfBirth to a Date in case a string was passed
    const dob = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return false;

    // Calculate age
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    if (
      now.getMonth() < dob.getMonth() ||
      (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())
    ) {
      age--;
    }
    if (age < 21) return false;

    // Validate client
    const clientRepository = new ClientRepository();
    const client = await clientRepository.getById(clientId);
    if (!client) {
      console.error("Client not found");
      return false;
    }

    const newUser: Partial<User> = {
      id: nanoid(),
      firstname,
      surname,
      email,
      dateOfBirth: dob,
      client,
    };

    if (client.name === "VeryImportantClient") {
      newUser.hasCreditLimit = false;
    } else if (client.name === "ImportantClient") {
      newUser.hasCreditLimit = true;
      newUser.creditLimit = 10000 * 2;
    } else {
      newUser.hasCreditLimit = true;
      newUser.creditLimit = 10000;
    }

    users.push(newUser as User);
    await this.db!.write();
    return true;
  }

  public async updateUser(user: User): Promise<boolean> {
    if (!user) return false;

    await this.init();
    const users = this.db!.data!.users;
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return false;

    users[idx] = user;
    await this.db!.write();
    return true;
  }

  public async getAllUsers(): Promise<User[]> {
    await this.init();
    return this.db!.data!.users;
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    await this.init();
    const users = this.db!.data!.users;
    const found = users.find((u) => u.email === email) ?? null;
    return found;
  }
}