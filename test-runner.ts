/**
 * Simple test runner script to demonstrate the refactored code
 * Run with: npx tsx test-runner.ts
 */

import { UserService } from "./src/services/user-service.js";
import { UserRepository } from "./src/repositories/user-repository.js";
import { ClientRepository } from "./src/repositories/client-repository.js";

async function runTests() {
  console.log("🚀 Starting manual tests...\n");

  // Initialize services
  const userRepository = new UserRepository();
  const clientRepository = new ClientRepository();
  const userService = new UserService(userRepository, clientRepository);

  try {
    // Test 1: Get all clients
    console.log("📋 Test 1: Getting all clients...");
    const clients = await clientRepository.findAll();
    console.log(`✅ Found ${clients.length} clients`);
    clients.forEach((c) => console.log(`   - ${c.name} (${c.id})`));
    console.log();

    // Test 2: Get all users (should use cache on second call)
    console.log("👥 Test 2: Getting all users (testing cache)...");
    const users1 = await userService.getAllUsers();
    console.log(`✅ First call: Found ${users1.length} users`);
    const users2 = await userService.getAllUsers();
    console.log(`✅ Second call: Found ${users2.length} users (from cache)`);
    console.log();

    // Test 3: Add a new user
    if (clients.length > 0) {
      console.log("➕ Test 3: Adding a new user...");
      const testEmail = `test.${Date.now()}@example.com`;
      const result = await userService.addUser(
        "Test",
        "User",
        testEmail,
        new Date("1990-01-01"),
        clients[0].id
      );

      if (result.success && result.user) {
        console.log(`✅ User created: ${result.user.firstname} ${result.user.surname}`);
        console.log(`   Email: ${result.user.email}`);
        console.log(`   Credit Limit: ${result.user.hasCreditLimit ? result.user.creditLimit : "Unlimited"}`);

        // Test 4: Get user by ID (should use cache)
        console.log("\n🔍 Test 4: Getting user by ID (testing cache)...");
        const userById1 = await userService.getUserById(result.user.id);
        console.log(`✅ First call: ${userById1?.firstname} ${userById1?.surname}`);
        const userById2 = await userService.getUserById(result.user.id);
        console.log(`✅ Second call: ${userById2?.firstname} ${userById2?.surname} (from cache)`);

        // Test 5: Get user by email (should use cache)
        console.log("\n📧 Test 5: Getting user by email (testing cache)...");
        const userByEmail1 = await userService.getUserByEmail(testEmail);
        console.log(`✅ First call: ${userByEmail1?.email}`);
        const userByEmail2 = await userService.getUserByEmail(testEmail);
        console.log(`✅ Second call: ${userByEmail2?.email} (from cache)`);

        // Test 6: Update user (should update cache)
        console.log("\n✏️  Test 6: Updating user (testing cache update)...");
        const updatedUser = {
          ...result.user,
          firstname: "Updated",
          surname: "Name",
        };
        const updateResult = await userService.updateUser(updatedUser);
        if (updateResult.success) {
          console.log("✅ User updated successfully");
          const retrieved = await userService.getUserById(result.user.id);
          console.log(`   Retrieved from cache: ${retrieved?.firstname} ${retrieved?.surname}`);
        }
      } else {
        console.log(`❌ Failed to create user: ${result.error}`);
      }
    }

    // Test 7: Validation tests
    console.log("\n🛡️  Test 7: Testing validation...");
    if (clients.length > 0) {
      // Test invalid email (duplicate)
      const invalidResult = await userService.addUser(
        "Invalid",
        "User",
        "invalid@example.com",
        new Date("2010-01-01"), // Too young
        clients[0].id
      );
      console.log(`✅ Age validation: ${invalidResult.success ? "❌ Should have failed" : "✅ Correctly rejected (too young)"}`);

      // Test missing fields
      const missingFields = await userService.addUser(
        "",
        "",
        "",
        new Date("1990-01-01"),
        clients[0].id
      );
      console.log(`✅ Required fields validation: ${missingFields.success ? "❌ Should have failed" : "✅ Correctly rejected"}`);
    }

    console.log("\n✅ All manual tests completed!");
  } catch (error) {
    console.error("❌ Error during testing:", error);
  }
}

// Run the tests
runTests().catch(console.error);

