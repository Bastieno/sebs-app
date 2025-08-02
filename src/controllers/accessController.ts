import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../types';

// Helper to check time validity
const isTimeWithinPlan = (plan: any, currentTime: Date): boolean => {
  if (!plan.timeStart || !plan.timeEnd) return true; // No time restriction

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = (timeStr || '').split(':').map(Number);
    const date = new Date();
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date;
  };

  const startTime = formatTime(plan.timeStart);
  let endTime = formatTime(plan.timeEnd);

  // Handle overnight plans
  if (endTime <= startTime) {
    endTime.setDate(endTime.getDate() + 1);
    if (currentTime < startTime) {
      currentTime.setDate(currentTime.getDate() + 1);
    }
  }

  return currentTime >= startTime && currentTime <= endTime;
};

export const validateQrCode = async (req: Request, res: Response): Promise<any> => {
  const { qrToken, action = 'ENTRY' } = req.body;

  if (!qrToken) {
    return res.status(400).json({ success: false, message: 'QR token is required' });
  }

  let validationResult: any = 'DENIED';
  let subscriptionDetails: any = null;

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { qrToken },
      include: { user: true, plan: true }
    });

    if (!subscription) {
      validationResult = 'DENIED';
    } else {
      subscriptionDetails = subscription;
      const now = new Date();
      const endDate = new Date(subscription.endDate);
      const graceEndDate = subscription.graceEndDate ? new Date(subscription.graceEndDate) : null;

      if (subscription.status !== 'ACTIVE') {
        validationResult = 'DENIED';
      } else if (now > endDate && (!graceEndDate || now > graceEndDate)) {
        validationResult = 'EXPIRED';
      } else if (!isTimeWithinPlan(subscription.plan, now)) {
        validationResult = 'INVALID_TIME';
      } else if (
        subscription.plan.maxCapacity &&
        subscription.plan.currentCapacity >= subscription.plan.maxCapacity
      ) {
        validationResult = 'CAPACITY_FULL';
      } else {
        validationResult = 'SUCCESS';
      }
    }

    // Log the access attempt and update capacity
    if (subscriptionDetails) {
      const logPromise = prisma.accessLog.create({
        data: {
          userId: subscriptionDetails.userId,
          subscriptionId: subscriptionDetails.id,
          action,
          validationResult,
          scannerLocation: 'main_entrance'
        }
      });

      let capacityPromise;
      if (validationResult === 'SUCCESS') {
        if (action === 'ENTRY') {
          capacityPromise = prisma.plan.update({
            where: { id: subscriptionDetails.planId },
            data: { currentCapacity: { increment: 1 } }
          });
        } else if (action === 'EXIT') {
          capacityPromise = prisma.plan.update({
            where: { id: subscriptionDetails.planId },
            data: { currentCapacity: { decrement: 1 } }
          });
        }
      }

      await Promise.all([logPromise, capacityPromise]);
    }

    return res.status(200).json({
      success: true,
      validationResult,
      user: subscriptionDetails ? {
        name: subscriptionDetails.user.name,
        plan: subscriptionDetails.plan.name
      } : null
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error validating QR code' });
  }
};

export const getAccessLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.accessLog.findMany({
      include: {
        user: { select: { name: true, email: true } },
        subscription: { select: { plan: { select: { name: true } } } }
      },
      orderBy: { timestamp: 'desc' },
      take: 100 // Limit to recent 100 logs for performance
    });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching access logs' });
  }
};
