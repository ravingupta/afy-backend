import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/jwt.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    supabaseId: string;
    sessionId: string;
  };
}

/**
 * Authentication middleware - verifies JWT access token
 */
export const auth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // Attach user info to request
  req.user = {
    id: decoded.userId,
    email: decoded.email,
    supabaseId: decoded.supabaseId,
    sessionId: decoded.sessionId
  };

  next();
};

/**
 * Optional auth middleware - continues even if no token provided
 */
export const optionalAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (decoded) {
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        supabaseId: decoded.supabaseId,
        sessionId: decoded.sessionId
      };
    }
  }

  next();
};
