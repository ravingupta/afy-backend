import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface JWTPayload {
  userId: string;
  email: string;
  supabaseId: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Access token expiry in seconds (1 hour)
const ACCESS_TOKEN_EXPIRY = 60 * 60;
// Refresh token expiry in seconds (7 days)
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60;

const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET must be defined');
  }
  return secret;
};

const getRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET must be defined');
  }
  return secret;
};

/**
 * Generate a unique session ID
 */
export const generateSessionId = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate access and refresh token pair
 */
export const generateTokenPair = (payload: Omit<JWTPayload, 'iat' | 'exp'>): TokenPair => {
  const accessToken = jwt.sign(payload, getJWTSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'afy-backend',
    audience: 'afy-client'
  });

  const refreshToken = jwt.sign(
    { sessionId: payload.sessionId, userId: payload.userId },
    getRefreshSecret(),
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'afy-backend',
      audience: 'afy-client'
    }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY
  };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, getJWTSecret(), {
      issuer: 'afy-backend',
      audience: 'afy-client'
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('Access token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('Invalid access token:', error.message);
    }
    return null;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): { sessionId: string; userId: string } | null => {
  try {
    const decoded = jwt.verify(token, getRefreshSecret(), {
      issuer: 'afy-backend',
      audience: 'afy-client'
    }) as { sessionId: string; userId: string };

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('Invalid refresh token:', error.message);
    }
    return null;
  }
};

/**
 * Decode token without verification (for inspection)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};
