import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    const pendingSubscriptions = await prisma.subscription.findMany({
      where: { status: 'PENDING' },
      include: { user: true, plan: true },
    });
    res.status(200).json(pendingSubscriptions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending approvals', error });
  }
};

export const approveSubscription = async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'ACTIVE' },
    });
    res.status(200).json(updatedSubscription);
  } catch (error) {
    res.status(500).json({ message: 'Error approving subscription', error });
  }
};

export const rejectSubscription = async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'SUSPENDED' },
    });
    res.status(200).json(updatedSubscription);
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting subscription', error });
  }
};
