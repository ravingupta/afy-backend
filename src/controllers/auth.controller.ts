import { Request, Response } from 'express';
import { verifySupabaseToken, createSupabaseUser } from '../services/supabase.service';
import { generateAccessToken } from '../services/jwt.service';
import { UserModel, User } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Exchange Supabase token for our access token
 * POST /auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supabaseToken } = req.body;

    if (!supabaseToken) {
      res.status(400).json({ error: 'supabaseToken is required' });
      return;
    }

    // Verify the Supabase token
    const supabaseUser = await verifySupabaseToken(supabaseToken);

    if (!supabaseUser) {
      res.status(401).json({ error: 'Invalid Supabase token' });
      return;
    }

    // Find or create user in our database
    let user: User | null = await UserModel.findUnique({
      where: { email: supabaseUser.email }
    });

    if (!user) {
      user = await UserModel.create({
        data: {
          email: supabaseUser.email,
          name: null
        }
      });
    }

    // Generate access token with embedded Supabase token
    const tokenResponse = generateAccessToken({
      userId: user.id,
      email: user.email,
      supabaseId: supabaseUser.id,
      supabaseToken: supabaseToken
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      ...tokenResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Logout - client should discard tokens
 * POST /auth/logout
 */
export const logout = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Client should discard the token
  // Supabase token revocation happens on Supabase side
  res.json({ message: 'Logged out successfully' });
};

/**
 * Get current user info
 * GET /auth/me
 */
export const me = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await UserModel.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
};

/**
 * Create a new user account
 * POST /auth/signup
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Create user in Supabase
    const result = await createSupabaseUser(email, password);

    if (!result.success) {
      const statusCode = result.error.code === 'USER_EXISTS' ? 409 : 400;
      res.status(statusCode).json({ error: result.error.message });
      return;
    }

    // Create user in our database
    const user = await UserModel.create({
      data: {
        email: result.data.user.email,
        name: name || null
      }
    });

    // Generate access token with embedded Supabase token
    const tokenResponse = generateAccessToken({
      userId: user.id,
      email: user.email,
      supabaseId: result.data.user.id,
      supabaseToken: result.data.accessToken
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      ...tokenResponse
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
};
