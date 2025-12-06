/**
 * Example usage of the refactored codebase
 * 
 * This demonstrates how to use the UserService with dependency injection
 * and how the caching layer works automatically through the repository.
 */

import { UserService } from "./services/user-service.js";
import { UserRepository } from "./repositories/user-repository.js";
import { ClientRepository } from "./repositories/client-repository.js";

// Create repository instances
const userRepository = new UserRepository();
const clientRepository = new ClientRepository();

// Create UserService with dependency injection (SOLID - Dependency Inversion Principle)
const userService = new UserService(userRepository, clientRepository);

// Example: Add a new user
// The cache is automatically updated by the repository
async function exampleAddUser() {
  const result = await userService.addUser(
    "Alice",
    "Smith",
    "alice@example.com",
    new Date("1990-01-01"),
    "client-id-here"
  );

  if (result.success) {
    console.log("User added:", result.user);
  } else {
    console.error("Error:", result.error);
  }
}

// Example: Get all users
// First call hits the database, subsequent calls use cache
async function exampleGetAllUsers() {
  const users = await userService.getAllUsers();
  console.log("All users:", users);
}

// Example: Update a user
// Cache is automatically updated with the new data
async function exampleUpdateUser(user: any) {
  const updatedUser = { ...user, firstname: "Alice Updated" };
  const result = await userService.updateUser(updatedUser);
  
  if (result.success) {
    console.log("User updated successfully");
    // Next call to getUserById or getAllUsers will return cached data
  }
}

// Example: Get user by email
// First call hits the database, subsequent calls use cache
async function exampleGetUserByEmail() {
  const user = await userService.getUserByEmail("alice@example.com");
  console.log("User found:", user);
}

