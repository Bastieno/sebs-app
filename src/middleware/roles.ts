import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).user;

  if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admins only' });
  }
};

export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).user;

  if (user && user.role === 'SUPER_ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Super Admins only' });
  }
};
