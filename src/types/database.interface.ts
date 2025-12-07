import { IUser, IClient } from "./user.interface.js";

export type DatabaseSchema = {
  users: IUser[];
  clients: IClient[];
};

