// Main exports for the refactored codebase
export { UserService } from "./services/user-service.js";
export { UserRepository, IUserRepository } from "./repositories/user-repository.js";
export { ClientRepository, IClientRepository } from "./repositories/client-repository.js";
export type {
  IUser,
  IClient,
  User,
  Client,
  UserValidationResult,
  UserCreationResult,
} from "./types/user.interface.js";
export type { DatabaseSchema } from "./types/database.interface.js";

