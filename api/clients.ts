import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ClientRepository } from '../src/repositories/client-repository.js';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const clientRepository = new ClientRepository();
    const clients = await clientRepository.findAll();
    response.json(clients);
  } catch (error) {
    response.status(500).json({ error: 'Failed to fetch clients' });
  }
}

