import { nanoid } from "nanoid";
import { IUserRepository } from "../repositories/user-repository.js";
import { IClientRepository } from "../repositories/client-repository.js";
import { IUser, IClient, UserValidationResult, UserCreationResult } from "../types/user.interface.js";

const CLIENT_TYPES = {
  VERY_IMPORTANT: "VeryImportantClient",
  IMPORTANT: "ImportantClient",
} as const;

const CREDIT_LIMITS = {
  DEFAULT: 10000,
  IMPORTANT_MULTIPLIER: 2,
} as const;

const MINIMUM_AGE = 21;

export class UserService {
  constructor(
    private userRepository: IUserRepository,
    private clientRepository: IClientRepository
  ) {}

  private validateUserInput(
    firstname: string,
    surname: string,
    email: string,
    dateOfBirth: Date
  ): UserValidationResult {
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

  private calculateAge(dateOfBirth: Date): number {
    const now = new Date();
    let age = now.getFullYear() - dateOfBirth.getFullYear();

    const hasBirthdayPassed =
      now.getMonth() > dateOfBirth.getMonth() ||
      (now.getMonth() === dateOfBirth.getMonth() &&
        now.getDate() >= dateOfBirth.getDate());

    return hasBirthdayPassed ? age : age - 1;
  }

  private getCreditDetails(
    client: IClient
  ): { hasCreditLimit: boolean; creditLimit?: number } {
    if (client.name === CLIENT_TYPES.VERY_IMPORTANT) {
      return { hasCreditLimit: false };
    }

    if (client.name === CLIENT_TYPES.IMPORTANT) {
      return {
        hasCreditLimit: true,
        creditLimit: CREDIT_LIMITS.DEFAULT * CREDIT_LIMITS.IMPORTANT_MULTIPLIER,
      };
    }

    return {
      hasCreditLimit: true,
      creditLimit: CREDIT_LIMITS.DEFAULT,
    };
  }

  private normalizeDateOfBirth(dateOfBirth: Date | string): Date | null {
    if (dateOfBirth instanceof Date) {
      return dateOfBirth;
    }

    const dob = new Date(dateOfBirth);
    return !isNaN(dob.getTime()) ? dob : null;
  }

  public async addUser(
    firstname: string,
    surname: string,
    email: string,
    dateOfBirth: Date | string,
    clientId: string
  ): Promise<UserCreationResult> {
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

    // Check duplicate email
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      return { success: false, error: "Email already exists" };
    }

    // Validate client exists
    const client = await this.clientRepository.findById(clientId);
    if (!client) {
      return { success: false, error: "Client not found" };
    }

    // Create new user
    const creditDetails = this.getCreditDetails(client);
    const newUser: IUser = {
      id: nanoid(),
      firstname: firstname.trim(),
      surname: surname.trim(),
      email: email.trim().toLowerCase(),
      dateOfBirth: dob,
      client,
      hasCreditLimit: creditDetails.hasCreditLimit,
      creditLimit: creditDetails.creditLimit,
    };

    // Save to database (cache is handled by repository)
    const savedUser = await this.userRepository.create(newUser);

    return { success: true, user: savedUser };
  }

  public async updateUser(
    user: IUser
  ): Promise<{ success: boolean; error?: string }> {
    if (!user?.id) {
      return { success: false, error: "Invalid user data" };
    }

    const updatedUser = await this.userRepository.update(user);
    if (!updatedUser) {
      return { success: false, error: "User not found" };
    }

    return { success: true };
  }

  public async getAllUsers(): Promise<IUser[]> {
    return this.userRepository.findAll();
  }

  public async getUserByEmail(email: string): Promise<IUser | null> {
    if (!email?.trim()) {
      return null;
    }

    return this.userRepository.findByEmail(email);
  }

  public async getUserById(id: string): Promise<IUser | null> {
    if (!id) {
      return null;
    }

    return this.userRepository.findById(id);
  }
}

