import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as any);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const extractTokenFromHeader = (authHeader: string | undefined): string => {
  if (!authHeader) {
    throw new Error('Authorization header is required');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header must start with Bearer');
  }

  return authHeader.substring(7);
};
