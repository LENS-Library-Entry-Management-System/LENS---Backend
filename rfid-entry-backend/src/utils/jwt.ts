import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

// Secrets are strings, not undefined
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Check if secrets are defined
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets are not defined in environment variables!');
}

// Store for refresh tokens (in production, use Redis/database)
const refreshTokenStore = new Map<string, { payload: JWTPayload; expires: number }>();

export interface JWTPayload {
  adminId: number;
  username: string;
  role: 'super_admin' | 'staff';
  sessionId?: string; // Add session ID for better tracking
}

export const generateAccessToken = (payload: JWTPayload): string => {
  const tokenPayload = {
    ...payload,
    sessionId: payload.sessionId || crypto.randomUUID(),
  };

  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as SignOptions);
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  const sessionId = payload.sessionId || crypto.randomUUID();
  const tokenPayload = {
    ...payload,
    sessionId,
  };

  const token = jwt.sign(tokenPayload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN
  } as SignOptions);

  // Store refresh token with expiration
  const expires = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
  refreshTokenStore.set(token, { payload: tokenPayload, expires });

  return token;
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    const stored = refreshTokenStore.get(token);

    if (!stored || Date.now() > stored.expires) {
      if (stored) refreshTokenStore.delete(token);
      throw new Error('Refresh token expired or invalid');
    }

    return decoded;
  } catch (error) {
    // Clean up expired tokens
    refreshTokenStore.delete(token);
    throw error;
  }
};

// Revoke refresh token (for logout)
export const revokeRefreshToken = (token: string): void => {
  refreshTokenStore.delete(token);
};

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of refreshTokenStore.entries()) {
    if (now > data.expires) {
      refreshTokenStore.delete(token);
    }
  }
}, 60 * 60 * 1000); // Clean every hour
