import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../types';

// Global hub capacity limit
const GLOBAL_HUB_CAPACITY = 40;

// Helper to check time validity based on timeSlot
const isTimeWithinPlan = (plan: any, currentTime: Date): boolean => {
  // If no timeSlot restriction, allow access 24/7
  if (!plan.timeSlot || plan.timeSlot === 'ALL') return true;

  const currentHour = currentTime.getHours();

  // Check based on timeSlot enum values
  switch (plan.timeSlot) {
    case 'MORNING':
      return currentHour >= 8 && currentHour < 12;
    case 'AFTERNOON':
      return currentHour >= 12 && currentHour < 17;
    case 'NIGHT':
      return currentHour >= 18 || currentHour < 6;
    default:
      return true;
  }
};

export const validateQrCode = async (req: Request, res: Response): Promise<any> => {
  const { accessCode, action = 'ENTRY' } = req.body;

  if (!accessCode) {
    return res.status(400).json({ success: false, message: 'Access code is required' });
  }

  let validationResult: any = 'DENIED';
  let subscriptionDetails: any = null;

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { accessCode },
      include: { user: true, plan: true }
    });

    if (!subscription) {
      validationResult = 'DENIED';
    } else {
      subscriptionDetails = subscription;
      const now = new Date();
      
      // Check if subscription has expired
      const endDate = new Date(subscription.endDate);
      const isExpired = now > endDate;

      // Get current total occupancy for global capacity check
      const plans = await prisma.plan.findMany({
        where: { isActive: true },
        select: { currentCapacity: true },
      });
      const totalCurrentOccupancy = plans.reduce((acc, plan) => acc + plan.currentCapacity, 0);

      if (subscription.status !== 'ACTIVE') {
        validationResult = 'DENIED';
      } else if (isExpired) {
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
        ? 'Exit denied - Invalid access code'
        : 'Access denied - Invalid access code';
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
    return res.status(500).json({ success: false, message: 'Error validating access code' });
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
