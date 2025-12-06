import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { UserRepository } from "./user-repository.js";
import { IUser } from "../types/user.interface.js";
import { ClientRepository } from "./client-repository.js";
import { writeFileSync, readFileSync, existsSync } from "fs";

const TEST_DB_PATH = "test-db-repo.json";
const ORIGINAL_DB_PATH = "db.json";

// Helper to create a clean test database
function createTestDb() {
  const originalDb = existsSync(ORIGINAL_DB_PATH)
    ? JSON.parse(readFileSync(ORIGINAL_DB_PATH, "utf-8"))
    : { clients: [], users: [] };
  writeFileSync(TEST_DB_PATH, JSON.stringify(originalDb, null, 2));
}

describe("UserRepository with Caching", () => {
  let userRepository: UserRepository;
  let clientRepository: ClientRepository;

  beforeEach(async () => {
    createTestDb();
    userRepository = new UserRepository(TEST_DB_PATH);
    clientRepository = new ClientRepository(TEST_DB_PATH);
  });

  afterEach(() => {
    // Clean up test database
    if (existsSync(TEST_DB_PATH)) {
      try {
        require("fs").unlinkSync(TEST_DB_PATH);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  describe("Cache Integration", () => {
    it("should cache user after findById", async () => {
      // Get existing users or create one
      const clients = await clientRepository.findAll();
      expect(clients.length).toBeGreaterThan(0);

      const testUser: IUser = {
        id: "test-cache-id-1",
        firstname: "Cache",
        surname: "Test",
        email: "cache.test1@example.com",
        dateOfBirth: new Date("1990-01-01"),
        client: clients[0],
        hasCreditLimit: true,
        creditLimit: 10000,
      };

      // Create user
      await userRepository.create(testUser);

      // First call - should hit database
      const user1 = await userRepository.findById(testUser.id);
      expect(user1).toBeDefined();
      expect(user1?.id).toBe(testUser.id);

      // Second call - should hit cache (we can't directly verify this,
      // but if caching works, subsequent calls should be faster)
      const user2 = await userRepository.findById(testUser.id);
      expect(user2).toBeDefined();
      expect(user2?.id).toBe(testUser.id);
    });

    it("should cache user after findByEmail", async () => {
      const clients = await clientRepository.findAll();
      const testEmail = "cache.test2@example.com";

      const testUser: IUser = {
        id: "test-cache-id-2",
        firstname: "Cache",
        surname: "Test",
        email: testEmail,
        dateOfBirth: new Date("1990-01-01"),
        client: clients[0],
        hasCreditLimit: true,
        creditLimit: 10000,
      };

      await userRepository.create(testUser);

      // First call
      const user1 = await userRepository.findByEmail(testEmail);
      expect(user1).toBeDefined();

      // Second call - should use cache
      const user2 = await userRepository.findByEmail(testEmail);
      expect(user2).toBeDefined();
      expect(user2?.email).toBe(testEmail);
    });

    it("should cache findAll results", async () => {
      // First call
      const users1 = await userRepository.findAll();
      expect(Array.isArray(users1)).toBe(true);

      // Second call - should use cache
      const users2 = await userRepository.findAll();
      expect(Array.isArray(users2)).toBe(true);
      expect(users2.length).toBe(users1.length);
    });

    it("should update cache on create", async () => {
      const clients = await clientRepository.findAll();
      const testUser: IUser = {
        id: "test-cache-id-3",
        firstname: "New",
        surname: "User",
        email: "newuser@example.com",
        dateOfBirth: new Date("1990-01-01"),
        client: clients[0],
        hasCreditLimit: true,
        creditLimit: 10000,
      };

      // Create user
      await userRepository.create(testUser);

      // Should be able to retrieve immediately (cache updated)
      const retrieved = await userRepository.findById(testUser.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(testUser.id);
    });

    it("should update cache on update", async () => {
      const clients = await clientRepository.findAll();
      const testUser: IUser = {
        id: "test-cache-id-4",
        firstname: "Original",
        surname: "Name",
        email: "original@example.com",
        dateOfBirth: new Date("1990-01-01"),
        client: clients[0],
        hasCreditLimit: true,
        creditLimit: 10000,
      };

      // Create user
      await userRepository.create(testUser);

      // Update user
      const updatedUser: IUser = {
        ...testUser,
        firstname: "Updated",
      };
      await userRepository.update(updatedUser);

      // Should retrieve updated data
      const retrieved = await userRepository.findById(testUser.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.firstname).toBe("Updated");
    });
  });

  describe("Repository Operations", () => {
    it("should create a user", async () => {
      const clients = await clientRepository.findAll();
      const testUser: IUser = {
        id: "test-create-id",
        firstname: "Create",
        surname: "Test",
        email: "create@example.com",
        dateOfBirth: new Date("1990-01-01"),
        client: clients[0],
        hasCreditLimit: true,
        creditLimit: 10000,
      };

      const created = await userRepository.create(testUser);
      expect(created.id).toBe(testUser.id);
      expect(created.email).toBe(testUser.email);
    });

    it("should find user by id", async () => {
      const clients = await clientRepository.findAll();
      const testUser: IUser = {
        id: "test-find-id",
        firstname: "Find",
        surname: "Test",
        email: "find@example.com",
        dateOfBirth: new Date("1990-01-01"),
        client: clients[0],
        hasCreditLimit: true,
        creditLimit: 10000,
      };

      await userRepository.create(testUser);
      const found = await userRepository.findById(testUser.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(testUser.id);
    });

    it("should find user by email", async () => {
      const clients = await clientRepository.findAll();
      const testEmail = "findemail@example.com";
      const testUser: IUser = {
        id: "test-find-email-id",
        firstname: "Find",
        surname: "Email",
        email: testEmail,
        dateOfBirth: new Date("1990-01-01"),
        client: clients[0],
        hasCreditLimit: true,
        creditLimit: 10000,
      };

      await userRepository.create(testUser);
      const found = await userRepository.findByEmail(testEmail);
      expect(found).toBeDefined();
      expect(found?.email.toLowerCase()).toBe(testEmail.toLowerCase());
    });

    it("should return null for non-existent user", async () => {
      const found = await userRepository.findById("non-existent-id");
      expect(found).toBeNull();
    });

    it("should update existing user", async () => {
      const clients = await clientRepository.findAll();
      const testUser: IUser = {
        id: "test-update-id",
        firstname: "Original",
        surname: "Name",
        email: "update@example.com",
        dateOfBirth: new Date("1990-01-01"),
        client: clients[0],
        hasCreditLimit: true,
        creditLimit: 10000,
      };

      await userRepository.create(testUser);

      const updatedUser: IUser = {
        ...testUser,
        firstname: "Updated",
      };

      const result = await userRepository.update(updatedUser);
      expect(result).toBeDefined();
      expect(result?.firstname).toBe("Updated");
    });

    it("should return null when updating non-existent user", async () => {
      const clients = await clientRepository.findAll();
      const fakeUser: IUser = {
        id: "non-existent",
        firstname: "Fake",
        surname: "User",
        email: "fake@example.com",
        dateOfBirth: new Date("1990-01-01"),
        client: clients[0],
        hasCreditLimit: true,
        creditLimit: 10000,
      };

      const result = await userRepository.update(fakeUser);
      expect(result).toBeNull();
    });
  });
});

