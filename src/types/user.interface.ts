export interface IUser {
  id: string;
  firstname: string;
  surname: string;
  email: string;
  dateOfBirth: Date;
  client: IClient;
  hasCreditLimit: boolean;
  creditLimit?: number;
}

export interface IClient {
  id: string;
  name: string;
}

export interface UserValidationResult {
  isValid: boolean;
  error?: string;
}

export interface UserCreationResult {
  success: boolean;
  error?: string;
  user?: IUser;
}

// Re-export for backward compatibility
export type User = IUser;
export type Client = IClient;