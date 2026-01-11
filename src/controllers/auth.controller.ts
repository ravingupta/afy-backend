import { Request, Response } from 'express';
import { verifySupabaseToken } from '../services/supabase.service';
import {
  generateTokenPair,
  generateSessionId,
  verifyRefreshToken
} from '../services/jwt.service';
import { UserModel, User } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Exchange Supabase token for our session tokens
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

    // Generate session tokens
    const sessionId = generateSessionId();
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      supabaseId: supabaseUser.id,
      sessionId
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Refresh access token using refresh token
 * POST /auth/refresh
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'refreshToken is required' });
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    // Get user from database
    const user = await UserModel.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Generate new token pair with same session ID
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      supabaseId: '', // We don't store this, but it's in the session
      sessionId: decoded.sessionId
    });

    res.json(tokens);
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

/**
 * Logout - invalidate session (client should discard tokens)
 * POST /auth/logout
 */
export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // In a production app, you might want to:
  // - Add the token to a blacklist
  // - Store sessions in DB and invalidate them
  // - Use Redis for session management

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
