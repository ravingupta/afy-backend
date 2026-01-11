import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/jwt.service';
import { verifySupabaseToken } from '../services/supabase.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    supabaseId: string;
  };
}

/**
 * Authentication middleware - verifies JWT and Supabase token
 */
export const auth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'No authorization header provided' });
    return;
  }

  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Invalid authorization format. Use: Bearer <token>' });
    return;
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  // Verify JWT structure and signature
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // Verify Supabase token is still valid (real-time revocation check)
  const supabaseUser = await verifySupabaseToken(decoded.supabaseToken);

  if (!supabaseUser) {
    res.status(401).json({ error: 'Session expired or revoked' });
    return;
  }

  // Attach user info to request
  req.user = {
    id: decoded.userId,
    email: decoded.email,
    supabaseId: decoded.supabaseId
  };

  next();
};

/**
 * Optional auth middleware - continues even if no token provided
 */
export const optionalAuth = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (decoded) {
      // Verify Supabase token
      const supabaseUser = await verifySupabaseToken(decoded.supabaseToken);

      if (supabaseUser) {
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          supabaseId: decoded.supabaseId
        };
      }
    }
  }

  next();
};
