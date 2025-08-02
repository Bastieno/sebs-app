import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

export const logAccess = async (req: Request, res: Response) => {
  try {
    const { subscriptionId, action, validationResult, scannerLocation } = req.body;
    const user = (req as AuthenticatedRequest).user;

    if (!subscriptionId || !action || !validationResult) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.userId !== user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const accessLog = await prisma.accessLog.create({
      data: {
        userId: user.id,
        subscriptionId,
        action,
        validationResult,
        scannerLocation,
      },
    });

    return res.status(201).json(accessLog);
  } catch (error) {
    return res.status(500).json({ message: 'Error logging access', error });
  }
};
