/**
 * Vercel serverless function entry point
 * This file is used by Vercel to handle API routes
 */

import express from 'express';
import { UserService } from '../src/services/user-service.js';
import { UserRepository } from '../src/repositories/user-repository.js';
import { ClientRepository } from '../src/repositories/client-repository.js';
import { IUser } from '../src/types/user.interface.js';

const app = express();

// Middleware
app.use(express.json());

// Initialize services
const userRepository = new UserRepository();
const clientRepository = new ClientRepository();
const userService = new UserService(userRepository, clientRepository);

// API Routes

// Get all clients
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await clientRepository.findAll();
    console.log(`[API] GET /api/clients - Found ${clients.length} clients`);
    res.json(clients);
  } catch (error) {
    console.error('[API] Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user by email
app.get('/api/users/email/:email', async (req, res) => {
  try {
    const user = await userService.getUserByEmail(req.params.email);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Add user
app.post('/api/users', async (req, res) => {
  try {
    const { firstname, surname, email, dateOfBirth, clientId } = req.body;
    
    if (!firstname || !surname || !email || !dateOfBirth || !clientId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await userService.addUser(
      firstname,
      surname,
      email,
      new Date(dateOfBirth),
      clientId
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const user: IUser = req.body;
    const result = await userService.updateUser(user);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Export for Vercel
export default app;

