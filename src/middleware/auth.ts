import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../utils/jwt';
import { prisma } from '../config/database';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const payload: JWTPayload = verifyToken(token);

    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ error: 'Account is deactivated' });
      return;
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    res.status(401).json({ error: message });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role 
      });
      return;
    }

    next();
  };
};

// Middleware for admin-only routes
export const requireAdmin = authorize('ADMIN', 'SUPER_ADMIN');

// Middleware for super admin-only routes
export const requireSuperAdmin = authorize('SUPER_ADMIN');

// Middleware for user routes (any authenticated user)
export const requireAuth = authenticate;
