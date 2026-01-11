import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  supabaseId: string;
  supabaseToken: string;
  iat?: number;
  exp?: number;
}

export interface AccessTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// Access token expiry in seconds (1 hour)
const ACCESS_TOKEN_EXPIRY = 60 * 60;

const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET must be defined');
  }
  return secret;
};

/**
 * Generate access token with embedded Supabase token
 */
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): AccessTokenResponse => {
  const accessToken = jwt.sign(payload, getJWTSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'afy-backend',
    audience: 'afy-client'
  });

  return {
    accessToken,
    expiresIn: ACCESS_TOKEN_EXPIRY
  };
};

/**
 * Decode and verify JWT structure (Supabase verification happens in middleware)
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
 * Decode token without verification (for inspection)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};
