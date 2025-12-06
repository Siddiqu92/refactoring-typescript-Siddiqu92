import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UserService } from '../src/services/user-service.js';
import { UserRepository } from '../src/repositories/user-repository.js';
import { ClientRepository } from '../src/repositories/client-repository.js';
import { IUser } from '../src/types/user.interface.js';

const userRepository = new UserRepository();
const clientRepository = new ClientRepository();
const userService = new UserService(userRepository, clientRepository);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { method, query, body } = request;

  try {
    if (method === 'GET') {
      // Get all users
      if (!query.id && !query.email) {
        const users = await userService.getAllUsers();
        return response.json(users);
      }
      
      // Get user by ID
      if (query.id) {
        const user = await userService.getUserById(query.id as string);
        if (user) {
          return response.json(user);
        } else {
          return response.status(404).json({ error: 'User not found' });
        }
      }
      
      // Get user by email
      if (query.email) {
        const user = await userService.getUserByEmail(query.email as string);
        if (user) {
          return response.json(user);
        } else {
          return response.status(404).json({ error: 'User not found' });
        }
      }
    }

    if (method === 'POST') {
      const { firstname, surname, email, dateOfBirth, clientId } = body;
      
      if (!firstname || !surname || !email || !dateOfBirth || !clientId) {
        return response.status(400).json({ error: 'Missing required fields' });
      }

      const result = await userService.addUser(
        firstname,
        surname,
        email,
        new Date(dateOfBirth),
        clientId
      );

      if (result.success) {
        return response.json(result);
      } else {
        return response.status(400).json(result);
      }
    }

    if (method === 'PUT') {
      const user: IUser = body;
      const result = await userService.updateUser(user);
      
      if (result.success) {
        return response.json(result);
      } else {
        return response.status(400).json(result);
      }
    }

    response.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
}

