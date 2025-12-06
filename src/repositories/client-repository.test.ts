import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ClientRepository } from "./client-repository.js";
import { writeFileSync, readFileSync, existsSync } from "fs";

const TEST_DB_PATH = "test-db-client.json";
const ORIGINAL_DB_PATH = "db.json";

// Helper to create a clean test database
function createTestDb() {
  const originalDb = existsSync(ORIGINAL_DB_PATH)
    ? JSON.parse(readFileSync(ORIGINAL_DB_PATH, "utf-8"))
    : { clients: [], users: [] };
  writeFileSync(TEST_DB_PATH, JSON.stringify(originalDb, null, 2));
}

describe("ClientRepository", () => {
  let clientRepository: ClientRepository;

  beforeEach(() => {
    createTestDb();
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

  it("should find all clients", async () => {
    const clients = await clientRepository.findAll();
    expect(Array.isArray(clients)).toBe(true);
    expect(clients.length).toBeGreaterThan(0);
  });

  it("should find client by id", async () => {
    const allClients = await clientRepository.findAll();
    expect(allClients.length).toBeGreaterThan(0);

    const clientId = allClients[0].id;
    const client = await clientRepository.findById(clientId);

    expect(client).toBeDefined();
    expect(client?.id).toBe(clientId);
  });

  it("should return null for non-existent client id", async () => {
    const client = await clientRepository.findById("non-existent-id");
    expect(client).toBeNull();
  });

  it("should find VeryImportantClient", async () => {
    const clients = await clientRepository.findAll();
    const veryImportantClient = clients.find(
      (c) => c.name === "VeryImportantClient"
    );
    expect(veryImportantClient).toBeDefined();

    if (veryImportantClient) {
      const found = await clientRepository.findById(veryImportantClient.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe("VeryImportantClient");
    }
  });

  it("should find ImportantClient", async () => {
    const clients = await clientRepository.findAll();
    const importantClient = clients.find((c) => c.name === "ImportantClient");
    expect(importantClient).toBeDefined();

    if (importantClient) {
      const found = await clientRepository.findById(importantClient.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe("ImportantClient");
    }
  });
});

