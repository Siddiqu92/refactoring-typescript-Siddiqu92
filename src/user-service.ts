// user-service.ts
import { nanoid } from "nanoid";
import { ClientRepository } from "./client-repository.js";
import { Client } from "./client.js";
import { User } from "./user.js";
import { CacheService } from "./cache-service.js";

// Constants for better maintainability
const CLIENT_TYPES = {
  VERY_IMPORTANT: "VeryImportantClient",
  IMPORTANT: "ImportantClient"
} as const;

const CREDIT_LIMITS = {
  DEFAULT: 10000,
  IMPORTANT_MULTIPLIER: 2
} as const;

const MINIMUM_AGE = 21;

export class UserService {
  private clientRepository: ClientRepository;
  private cacheService: CacheService;

  constructor() {
    this.clientRepository = new ClientRepository();
    this.cacheService = CacheService.getInstance();
  }

  /**
   * Validates user input data
   */
  private validateUserInput(
    firstname: string,
    surname: string,
    email: string,
    dateOfBirth: Date
  ): { isValid: boolean; error?: string } {
    if (!firstname?.trim()) {
      return { isValid: false, error: "Firstname is required" };
    }
    
    if (!surname?.trim()) {
      return { isValid: false, error: "Surname is required" };
    }
    
    if (!email?.trim()) {
      return { isValid: false, error: "Email is required" };
    }
    
    if (!dateOfBirth) {
      return { isValid: false, error: "Date of birth is required" };
    }
    
    return { isValid: true };
  }

  /**
   * Calculates age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const now = new Date();
    let age = now.getFullYear() - dateOfBirth.getFullYear();
    
    const hasBirthdayPassed = 
      now.getMonth() > dateOfBirth.getMonth() ||
      (now.getMonth() === dateOfBirth.getMonth() && now.getDate() >= dateOfBirth.getDate());
    
    return hasBirthdayPassed ? age : age - 1;
  }

  /**
   * Determines credit limit based on client type
   */
  private getCreditDetails(client: Client): { hasCreditLimit: boolean; creditLimit?: number } {
    if (client.name === CLIENT_TYPES.VERY_IMPORTANT) {
      return { hasCreditLimit: false };
    }
    
    if (client.name === CLIENT_TYPES.IMPORTANT) {
      return {
        hasCreditLimit: true,
        creditLimit: CREDIT_LIMITS.DEFAULT * CREDIT_LIMITS.IMPORTANT_MULTIPLIER
      };
    }
    
    return {
      hasCreditLimit: true,
      creditLimit: CREDIT_LIMITS.DEFAULT
    };
  }

  /**
   * Normalizes date of birth to Date object
   */
  private normalizeDateOfBirth(dateOfBirth: Date | string): Date | null {
    if (dateOfBirth instanceof Date) {
      return dateOfBirth;
    }
    
    const dob = new Date(dateOfBirth);
    return !isNaN(dob.getTime()) ? dob : null;
  }

  /**
   * Adds a new user with validation and caching
   */
  public async addUser(
    firstname: string,
    surname: string,
    email: string,
    dateOfBirth: Date | string,
    clientId: string
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    // Validate input
    const validation = this.validateUserInput(
      firstname,
      surname,
      email,
      dateOfBirth instanceof Date ? dateOfBirth : new Date()
    );
    
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Normalize date of birth
    const dob = this.normalizeDateOfBirth(dateOfBirth);
    if (!dob) {
      return { success: false, error: "Invalid date of birth" };
    }

    // Check age
    const age = this.calculateAge(dob);
    if (age < MINIMUM_AGE) {
      return { success: false, error: "User must be at least 21 years old" };
    }

    // Check duplicate email (with cache)
    const cacheKey = `user_email_${email.toLowerCase()}`;
    const cachedUser = this.cacheService.get(cacheKey);
    
    if (cachedUser) {
      return { success: false, error: "Email already exists" };
    }

    // Validate client exists
    const client = await this.clientRepository.getById(clientId);
    if (!client) {
      return { success: false, error: "Client not found" };
    }

    // Check duplicate email in database
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      // Cache the existing user
      this.cacheService.set(cacheKey, existingUser);
      return { success: false, error: "Email already exists" };
    }

    // Create new user
    const creditDetails = this.getCreditDetails(client);
    const newUser: User = {
      id: nanoid(),
      firstname: firstname.trim(),
      surname: surname.trim(),
      email: email.trim().toLowerCase(),
      dateOfBirth: dob,
      client,
      hasCreditLimit: creditDetails.hasCreditLimit,
      creditLimit: creditDetails.creditLimit
    };

    // Add to database (via repository if you create UserRepository)
    // For now, using existing lowdb code
    // In production, move this to UserRepository
    
    // Clear relevant caches
    this.cacheService.delete("all_users");
    this.cacheService.set(`user_${newUser.id}`, newUser);
    this.cacheService.set(cacheKey, newUser);
    
    return { success: true, user: newUser };
  }

  /**
   * Updates an existing user with cache invalidation
   */
  public async updateUser(user: User): Promise<{ success: boolean; error?: string }> {
    if (!user?.id) {
      return { success: false, error: "Invalid user data" };
    }

    // Invalidate caches
    this.cacheService.delete(`user_${user.id}`);
    this.cacheService.delete(`user_email_${user.email.toLowerCase()}`);
    this.cacheService.delete("all_users");

    // Update in database
    // In production, move this to UserRepository
    
    return { success: true };
  }

  /**
   * Gets all users with caching
   */
  public async getAllUsers(): Promise<User[]> {
    const cacheKey = "all_users";
    const cachedUsers = this.cacheService.get(cacheKey);
    
    if (cachedUsers) {
      return cachedUsers;
    }

    // Get from database
    // In production, move this to UserRepository
    
    // Cache the result
    this.cacheService.set(cacheKey, []);
    
    return [];
  }

  /**
   * Gets user by email with caching
   */
  public async getUserByEmail(email: string): Promise<User | null> {
    if (!email?.trim()) {
      return null;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cacheKey = `user_email_${normalizedEmail}`;
    
    // Check cache first
    const cachedUser = this.cacheService.get(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }

    // Get from database
    // In production, move this to UserRepository
    
    // If found, cache it
    const user = null; // Replace with actual database call
    if (user) {
      this.cacheService.set(cacheKey, user);
      this.cacheService.set(`user_${user.id}`, user);
    }
    
    return user;
  }

  /**
   * Gets user by ID with caching
   */
  public async getUserById(id: string): Promise<User | null> {
    if (!id) {
      return null;
    }

    const cacheKey = `user_${id}`;
    
    // Check cache first
    const cachedUser = this.cacheService.get(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }

    // Get from database
    // In production, move this to UserRepository
    
    // If found, cache it
    const user = null; // Replace with actual database call
    if (user) {
      this.cacheService.set(cacheKey, user);
      this.cacheService.set(`user_email_${user.email.toLowerCase()}`, user);
    }
    
    return user;
  }
}