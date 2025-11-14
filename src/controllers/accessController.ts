import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../types';

// Global hub capacity limit
const GLOBAL_HUB_CAPACITY = 40;

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

      // Get current total occupancy for global capacity check
      const plans = await prisma.plan.findMany({
        where: { isActive: true },
        select: { currentCapacity: true },
      });
      const totalCurrentOccupancy = plans.reduce((acc, plan) => acc + plan.currentCapacity, 0);

      if (subscription.status !== 'ACTIVE') {
        validationResult = 'DENIED';
      } else if (now > endDate && (!graceEndDate || now > graceEndDate)) {
        validationResult = 'EXPIRED';
      } else if (!isTimeWithinPlan(subscription.plan, now)) {
        validationResult = 'INVALID_TIME';
      } else if (action === 'ENTRY' && totalCurrentOccupancy >= GLOBAL_HUB_CAPACITY) {
        // Check global hub capacity first
        validationResult = 'CAPACITY_FULL';
      } else if (
        subscription.plan.maxCapacity &&
        subscription.plan.currentCapacity >= subscription.plan.maxCapacity
      ) {
        // Then check plan-specific capacity
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

    // Generate appropriate message based on action and result
    let message = '';
    if (validationResult === 'SUCCESS') {
      message = action === 'EXIT' 
        ? `Exit recorded - Goodbye!`
        : `Access granted - Welcome!`;
    } else if (validationResult === 'DENIED') {
      message = action === 'EXIT'
        ? 'Exit denied - Invalid QR code'
        : 'Access denied - Invalid QR code';
    } else if (validationResult === 'EXPIRED') {
      message = 'Subscription expired';
    } else if (validationResult === 'INVALID_TIME') {
      message = 'Access not allowed at this time';
    } else if (validationResult === 'CAPACITY_FULL') {
      message = 'Hub at full capacity';
    }

    return res.status(200).json({
      success: true,
      validationResult,
      message,
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

export const getCurrentCapacity = async (req: Request, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        maxCapacity: true,
        currentCapacity: true,
      },
    });

    const planBasedCapacity = plans.reduce((acc, plan) => acc + (plan.maxCapacity || 0), 0);
    const totalCurrentOccupancy = plans.reduce((acc, plan) => acc + plan.currentCapacity, 0);

    res.status(200).json({
      success: true,
      data: {
        totalCapacity: GLOBAL_HUB_CAPACITY,
        totalCurrentOccupancy,
        planBasedCapacity,
        breakdown: plans,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching capacity data' });
  }
};
