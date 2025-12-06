import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UserService } from '../../../src/services/user-service.js';
import { UserRepository } from '../../../src/repositories/user-repository.js';
import { ClientRepository } from '../../../src/repositories/client-repository.js';

const userRepository = new UserRepository();
const clientRepository = new ClientRepository();
const userService = new UserService(userRepository, clientRepository);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { method, query } = request;
  const email = decodeURIComponent(query.email as string);

  try {
    if (method === 'GET') {
      const user = await userService.getUserByEmail(email);
      if (user) {
        return response.json(user);
      } else {
        return response.status(404).json({ error: 'User not found' });
      }
    }

    response.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    response.status(500).json({ error: 'Internal server error' });
  }
}

