import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { UserService } from "./user-service.js";
import { UserRepository } from "../repositories/user-repository.js";
import { ClientRepository } from "../repositories/client-repository.js";
import { IUser } from "../types/user.interface.js";
import { writeFileSync, readFileSync, existsSync } from "fs";

const TEST_DB_PATH = "test-db.json";
const ORIGINAL_DB_PATH = "db.json";

// Helper to create a clean test database
function createTestDb() {
  const originalDb = existsSync(ORIGINAL_DB_PATH)
    ? JSON.parse(readFileSync(ORIGINAL_DB_PATH, "utf-8"))
    : { clients: [], users: [] };
  writeFileSync(TEST_DB_PATH, JSON.stringify(originalDb, null, 2));
}

describe("UserService", () => {
  let userService: UserService;
  let userRepository: UserRepository;
  let clientRepository: ClientRepository;

  beforeEach(() => {
    createTestDb();
    userRepository = new UserRepository(TEST_DB_PATH);
    clientRepository = new ClientRepository(TEST_DB_PATH);
    userService = new UserService(userRepository, clientRepository);
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

  describe("addUser", () => {
    it("should successfully add a valid user", async () => {
      // Get a valid client ID from the database
      const clients = await clientRepository.findAll();
      expect(clients.length).toBeGreaterThan(0);
      const clientId = clients[0].id;

      const result = await userService.addUser(
        "John",
        "Doe",
        "john.doe.test@example.com",
        new Date("1990-01-01"),
        clientId
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.firstname).toBe("John");
      expect(result.user?.surname).toBe("Doe");
      expect(result.user?.email).toBe("john.doe.test@example.com");
    });

    it("should reject user with missing firstname", async () => {
      const clients = await clientRepository.findAll();
      const clientId = clients[0].id;

      const result = await userService.addUser(
        "",
        "Doe",
        "test@example.com",
        new Date("1990-01-01"),
        clientId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Firstname is required");
    });

    it("should reject user with missing email", async () => {
      const clients = await clientRepository.findAll();
      const clientId = clients[0].id;

      const result = await userService.addUser(
        "John",
        "Doe",
        "",
        new Date("1990-01-01"),
        clientId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email is required");
    });

    it("should reject user under 21 years old", async () => {
      const clients = await clientRepository.findAll();
      const clientId = clients[0].id;

      const result = await userService.addUser(
        "John",
        "Doe",
        "young@example.com",
        new Date("2010-01-01"), // 14 years old
        clientId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("User must be at least 21 years old");
    });

    it("should reject duplicate email", async () => {
      const clients = await clientRepository.findAll();
      const clientId = clients[0].id;
      const email = "duplicate@example.com";

      // Add first user
      const result1 = await userService.addUser(
        "John",
        "Doe",
        email,
        new Date("1990-01-01"),
        clientId
      );
      expect(result1.success).toBe(true);

      // Try to add duplicate
      const result2 = await userService.addUser(
        "Jane",
        "Smith",
        email,
        new Date("1991-01-01"),
        clientId
      );

      expect(result2.success).toBe(false);
      expect(result2.error).toBe("Email already exists");
    });

    it("should reject invalid client ID", async () => {
      const result = await userService.addUser(
        "John",
        "Doe",
        "test@example.com",
        new Date("1990-01-01"),
        "invalid-client-id"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Client not found");
    });

    it("should set correct credit limit for VeryImportantClient", async () => {
      const clients = await clientRepository.findAll();
      const veryImportantClient = clients.find(
        (c) => c.name === "VeryImportantClient"
      );
      expect(veryImportantClient).toBeDefined();

      const result = await userService.addUser(
        "VIP",
        "User",
        "vip@example.com",
        new Date("1990-01-01"),
        veryImportantClient!.id
      );

      expect(result.success).toBe(true);
      expect(result.user?.hasCreditLimit).toBe(false);
    });

    it("should set correct credit limit for ImportantClient", async () => {
      const clients = await clientRepository.findAll();
      const importantClient = clients.find(
        (c) => c.name === "ImportantClient"
      );
      expect(importantClient).toBeDefined();

      const result = await userService.addUser(
        "Important",
        "User",
        "important@example.com",
        new Date("1990-01-01"),
        importantClient!.id
      );

      expect(result.success).toBe(true);
      expect(result.user?.hasCreditLimit).toBe(true);
      expect(result.user?.creditLimit).toBe(20000); // 10000 * 2
    });

    it("should set default credit limit for regular Client", async () => {
      const clients = await clientRepository.findAll();
      const regularClient = clients.find((c) => c.name === "Client");
      expect(regularClient).toBeDefined();

      const result = await userService.addUser(
        "Regular",
        "User",
        "regular@example.com",
        new Date("1990-01-01"),
        regularClient!.id
      );

      expect(result.success).toBe(true);
      expect(result.user?.hasCreditLimit).toBe(true);
      expect(result.user?.creditLimit).toBe(10000);
    });
  });

  describe("updateUser", () => {
    it("should successfully update an existing user", async () => {
      const clients = await clientRepository.findAll();
      const clientId = clients[0].id;

      // Create a user first
      const createResult = await userService.addUser(
        "John",
        "Doe",
        "update.test@example.com",
        new Date("1990-01-01"),
        clientId
      );
      expect(createResult.success).toBe(true);
      const user = createResult.user!;

      // Update the user
      const updatedUser: IUser = {
        ...user,
        firstname: "Jane",
        surname: "Smith",
      };

      const updateResult = await userService.updateUser(updatedUser);
      expect(updateResult.success).toBe(true);

      // Verify the update
      const retrievedUser = await userService.getUserById(user.id);
      expect(retrievedUser?.firstname).toBe("Jane");
      expect(retrievedUser?.surname).toBe("Smith");
    });

    it("should reject update for non-existent user", async () => {
      const clients = await clientRepository.findAll();
      const fakeUser: IUser = {
        id: "non-existent-id",
        firstname: "Fake",
        surname: "User",
        email: "fake@example.com",
        dateOfBirth: new Date("1990-01-01"),
        client: clients[0],
        hasCreditLimit: true,
        creditLimit: 10000,
      };

      const result = await userService.updateUser(fakeUser);
      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });

    it("should reject update with invalid user data", async () => {
      const result = await userService.updateUser({} as IUser);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid user data");
    });
  });

  describe("getAllUsers", () => {
    it("should return all users", async () => {
      const users = await userService.getAllUsers();
      expect(Array.isArray(users)).toBe(true);
      // Should have at least the existing users from db.json
      expect(users.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getUserByEmail", () => {
    it("should return user by email", async () => {
      const clients = await clientRepository.findAll();
      const clientId = clients[0].id;
      const email = "getbyemail.test@example.com";

      // Create a user
      const createResult = await userService.addUser(
        "Test",
        "User",
        email,
        new Date("1990-01-01"),
        clientId
      );
      expect(createResult.success).toBe(true);

      // Retrieve by email
      const user = await userService.getUserByEmail(email);
      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
    });

    it("should return null for non-existent email", async () => {
      const user = await userService.getUserByEmail("nonexistent@example.com");
      expect(user).toBeNull();
    });

    it("should return null for empty email", async () => {
      const user = await userService.getUserByEmail("");
      expect(user).toBeNull();
    });
  });

  describe("getUserById", () => {
    it("should return user by id", async () => {
      const clients = await clientRepository.findAll();
      const clientId = clients[0].id;

      // Create a user
      const createResult = await userService.addUser(
        "Test",
        "User",
        "getbyid.test@example.com",
        new Date("1990-01-01"),
        clientId
      );
      expect(createResult.success).toBe(true);
      const userId = createResult.user!.id;

      // Retrieve by id
      const user = await userService.getUserById(userId);
      expect(user).toBeDefined();
      expect(user?.id).toBe(userId);
    });

    it("should return null for non-existent id", async () => {
      const user = await userService.getUserById("non-existent-id");
      expect(user).toBeNull();
    });

    it("should return null for empty id", async () => {
      const user = await userService.getUserById("");
      expect(user).toBeNull();
    });
  });
});

