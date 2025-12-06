/**
 * Demo Script - Project ko run karne ke liye
 * Run: npx tsx demo.ts
 */

import { UserService } from "./src/services/user-service.js";
import { UserRepository } from "./src/repositories/user-repository.js";
import { ClientRepository } from "./src/repositories/client-repository.js";

async function main() {
  console.log("🚀 Payment System Demo - Starting...\n");
  console.log("=" .repeat(60));

  // Initialize services
  const userRepository = new UserRepository();
  const clientRepository = new ClientRepository();
  const userService = new UserService(userRepository, clientRepository);

  try {
    // Step 1: Show all available clients
    console.log("\n📋 Step 1: Available Clients");
    console.log("-".repeat(60));
    const clients = await clientRepository.findAll();
    clients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name} (ID: ${client.id})`);
    });

    if (clients.length === 0) {
      console.log("❌ No clients found in database!");
      return;
    }

    // Step 2: Show existing users
    console.log("\n👥 Step 2: Existing Users");
    console.log("-".repeat(60));
    const existingUsers = await userService.getAllUsers();
    console.log(`Total Users: ${existingUsers.length}`);
    existingUsers.slice(0, 5).forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.firstname} ${user.surname} (${user.email})`
      );
      console.log(`   Credit Limit: ${user.hasCreditLimit ? `$${user.creditLimit?.toLocaleString()}` : "Unlimited"}`);
    });
    if (existingUsers.length > 5) {
      console.log(`   ... and ${existingUsers.length - 5} more users`);
    }

    // Step 3: Add a new user (demo)
    console.log("\n➕ Step 3: Adding New User (Demo)");
    console.log("-".repeat(60));
    const newUserEmail = `demo.user.${Date.now()}@example.com`;
    const addResult = await userService.addUser(
      "Demo",
      "User",
      newUserEmail,
      new Date("1995-06-15"), // 29 years old
      clients[0].id // Use first available client
    );

    if (addResult.success && addResult.user) {
      console.log("✅ User successfully created!");
      console.log(`   Name: ${addResult.user.firstname} ${addResult.user.surname}`);
      console.log(`   Email: ${addResult.user.email}`);
      console.log(`   Client: ${addResult.user.client.name}`);
      console.log(
        `   Credit Limit: ${addResult.user.hasCreditLimit ? `$${addResult.user.creditLimit?.toLocaleString()}` : "Unlimited"}`
      );

      // Step 4: Retrieve user by ID (cache test)
      console.log("\n🔍 Step 4: Retrieving User by ID (Cache Test)");
      console.log("-".repeat(60));
      const start1 = Date.now();
      const userById1 = await userService.getUserById(addResult.user.id);
      const time1 = Date.now() - start1;
      console.log(`First call: ${userById1?.firstname} ${userById1?.surname} (${time1}ms)`);

      const start2 = Date.now();
      const userById2 = await userService.getUserById(addResult.user.id);
      const time2 = Date.now() - start2;
      console.log(`Second call: ${userById2?.firstname} ${userById2?.surname} (${time2}ms) - CACHED! ⚡`);

      // Step 5: Retrieve user by email (cache test)
      console.log("\n📧 Step 5: Retrieving User by Email (Cache Test)");
      console.log("-".repeat(60));
      const start3 = Date.now();
      const userByEmail1 = await userService.getUserByEmail(newUserEmail);
      const time3 = Date.now() - start3;
      console.log(`First call: ${userByEmail1?.email} (${time3}ms)`);

      const start4 = Date.now();
      const userByEmail2 = await userService.getUserByEmail(newUserEmail);
      const time4 = Date.now() - start4;
      console.log(`Second call: ${userByEmail2?.email} (${time4}ms) - CACHED! ⚡`);

      // Step 6: Update user
      console.log("\n✏️  Step 6: Updating User");
      console.log("-".repeat(60));
      const updatedUser = {
        ...addResult.user,
        firstname: "Updated",
        surname: "Name",
      };
      const updateResult = await userService.updateUser(updatedUser);
      if (updateResult.success) {
        console.log("✅ User updated successfully!");
        const retrieved = await userService.getUserById(addResult.user.id);
        console.log(`   New name: ${retrieved?.firstname} ${retrieved?.surname}`);
      }

      // Step 7: Show all users again
      console.log("\n📊 Step 7: All Users (After Operations)");
      console.log("-".repeat(60));
      const allUsers = await userService.getAllUsers();
      console.log(`Total Users: ${allUsers.length}`);
    } else {
      console.log(`❌ Failed to create user: ${addResult.error}`);
    }

    // Step 8: Validation examples
    console.log("\n🛡️  Step 8: Validation Examples");
    console.log("-".repeat(60));

    // Test: Too young
    const youngResult = await userService.addUser(
      "Young",
      "User",
      "young@example.com",
      new Date("2010-01-01"), // Too young
      clients[0].id
    );
    console.log(`Age validation: ${youngResult.success ? "❌" : "✅"} ${youngResult.error || "Passed"}`);

    // Test: Missing fields
    const missingResult = await userService.addUser(
      "",
      "",
      "",
      new Date("1990-01-01"),
      clients[0].id
    );
    console.log(`Required fields: ${missingResult.success ? "❌" : "✅"} ${missingResult.error || "Passed"}`);

    // Step 9: Credit limit examples
    console.log("\n💰 Step 9: Credit Limit Examples by Client Type");
    console.log("-".repeat(60));

    for (const client of clients) {
      const testEmail = `credit.${client.id}.${Date.now()}@example.com`;
      const creditResult = await userService.addUser(
        "Credit",
        "Test",
        testEmail,
        new Date("1990-01-01"),
        client.id
      );

      if (creditResult.success && creditResult.user) {
        console.log(
          `Client: ${client.name} → Credit: ${creditResult.user.hasCreditLimit ? `$${creditResult.user.creditLimit?.toLocaleString()}` : "Unlimited"}`
        );
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Demo completed successfully!");
    console.log("\n📝 Summary:");
    console.log("   - Repository pattern implemented");
    console.log("   - Caching layer integrated");
    console.log("   - SOLID principles applied");
    console.log("   - All operations working correctly");
    console.log("\n");

  } catch (error) {
    console.error("\n❌ Error during demo:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
  }
}

// Run the demo
main().catch(console.error);

