import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { getFileUrl } from '../middleware/upload';

interface SubscriptionRequest {
  planId: string;
  timeSlot?: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'ALL';
  startDate: string;
}

// Helper function to calculate end date based on plan timeUnit and duration
const calculateEndDate = (startDate: Date, timeUnit: string, duration: number): Date => {
  const endDate = new Date(startDate);
  
  switch (timeUnit) {
    case 'MINUTES':
      endDate.setMinutes(endDate.getMinutes() + duration);
      break;
    case 'HOURS':
      endDate.setHours(endDate.getHours() + duration);
      break;
    case 'DAYS':
      endDate.setDate(endDate.getDate() + duration);
      break;
    case 'WEEK':
      endDate.setDate(endDate.getDate() + (duration * 7));
      break;
    case 'MONTH':
      endDate.setMonth(endDate.getMonth() + duration);
      break;
    case 'YEAR':
      endDate.setFullYear(endDate.getFullYear() + duration);
      break;
    default:
      throw new Error(`Invalid time unit: ${timeUnit}`);
  }
  
  return endDate;
};

// Helper function to generate 6-digit access code
const generateAccessCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const applyForSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    const { planId, timeSlot, startDate }: SubscriptionRequest = req.body;

    // Validate required fields
    if (!planId || !startDate) {
      res.status(400).json({
        success: false,
        message: 'Plan ID and start date are required',
        error: 'Missing required fields'
      } as ApiResponse);
      return;
    }

    // Validate start date
    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid start date format',
        error: 'Please provide a valid date'
      } as ApiResponse);
      return;
    }

    // Check if start date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedStartDate < today) {
      res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past',
        error: 'Please select a current or future date'
      } as ApiResponse);
      return;
    }

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId, isActive: true }
    });

    if (!plan) {
      res.status(404).json({
        success: false,
        message: 'Plan not found',
        error: 'The selected plan does not exist or is inactive'
      } as ApiResponse);
      return;
    }

    // Validate time slot for monthly plans
    if (plan.timeUnit === 'MONTH' && plan.name.includes('Standard') && !timeSlot) {
      res.status(400).json({
        success: false,
        message: 'Time slot is required for Standard Monthly plan',
        error: 'Please select a time slot (MORNING, AFTERNOON, or NIGHT)'
      } as ApiResponse);
      return;
    }

    // Check for existing active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.id,
        status: {
          in: ['PENDING', 'ACTIVE', 'IN_GRACE_PERIOD']
        }
      }
    });

    if (existingSubscription) {
      const now = new Date();
      
      // For PENDING subscriptions, always block
      if (existingSubscription.status === 'PENDING') {
        res.status(409).json({
          success: false,
          message: 'Pending subscription exists',
          error: 'You already have a pending subscription awaiting payment approval'
        } as ApiResponse);
        return;
      }
      
      // For ACTIVE or IN_GRACE_PERIOD subscriptions, check if they're actually expired
      const endDate = new Date(existingSubscription.endDate);
      
      // Check if subscription is still valid (within end date)
      const isStillValid = now <= endDate;
      
      if (isStillValid) {
        res.status(409).json({
          success: false,
          message: 'Active subscription exists',
          error: 'You already have an active subscription that has not expired'
        } as ApiResponse);
        return;
      }
      
      // If we reach here, the subscription is expired - update its status
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: { status: 'EXPIRED' }
      });
    }

    // Calculate end date based on plan's timeUnit and duration
    const endDate = calculateEndDate(parsedStartDate, plan.timeUnit, plan.duration);

    // Generate unique 6-digit access code
    let accessCode = generateAccessCode();
    // Ensure uniqueness
    let existingCode = await prisma.subscription.findUnique({ where: { accessCode } });
    while (existingCode) {
      accessCode = generateAccessCode();
      existingCode = await prisma.subscription.findUnique({ where: { accessCode } });
    }

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: req.user.id,
        planId: plan.id,
        timeSlot: timeSlot || (plan.timeUnit === 'MONTH' && plan.name.includes('Premium') ? 'ALL' : timeSlot),
        startDate: parsedStartDate,
        endDate: endDate,
        accessCode: accessCode,
        status: 'PENDING'
      },
      include: {
        plan: {
          select: {
            name: true,
            price: true,
            timeUnit: true,
            duration: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Subscription application submitted successfully',
      data: {
        subscription: {
          id: subscription.id,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          timeSlot: subscription.timeSlot,
          plan: subscription.plan
        },
        nextStep: 'Please upload your payment receipt to complete the subscription process'
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Apply subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to create subscription application'
    } as ApiResponse);
  }
};

export const uploadPaymentReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    const { subscriptionId } = req.params;
    const { amount } = req.body;

    if (!subscriptionId) {
      res.status(400).json({
        success: false,
        message: 'Subscription ID is required',
        error: 'Missing subscription ID parameter'
      } as ApiResponse);
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Receipt file is required',
        error: 'Please upload a receipt image or PDF'
      } as ApiResponse);
      return;
    }

    if (!amount) {
      res.status(400).json({
        success: false,
        message: 'Payment amount is required',
        error: 'Please specify the payment amount'
      } as ApiResponse);
      return;
    }

    // Validate subscription exists and belongs to user
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: req.user.id,
        status: 'PENDING'
      },
      include: {
        plan: true
      }
    });

    if (!subscription) {
      res.status(404).json({
        success: false,
        message: 'Subscription not found',
        error: 'Subscription not found or not in pending status'
      } as ApiResponse);
      return;
    }

    // Create payment receipt record
    const receiptUrl = getFileUrl(req.file.filename);
    
    const paymentReceipt = await prisma.paymentReceipt.create({
      data: {
        subscriptionId: subscription.id,
        receiptUrl: receiptUrl,
        amount: parseFloat(amount),
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Payment receipt uploaded successfully',
      data: {
        receiptId: paymentReceipt.id,
        receiptUrl: paymentReceipt.receiptUrl,
        amount: paymentReceipt.amount,
        status: paymentReceipt.status,
        message: 'Your payment receipt has been submitted for admin approval'
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Upload receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to upload payment receipt'
    } as ApiResponse);
  }
};

export const getUserSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user.id },
      include: {
        plan: {
          select: {
            name: true,
            price: true,
            timeUnit: true,
            duration: true
          }
        },
        paymentReceipts: {
          select: {
            id: true,
            receiptUrl: true,
            amount: true,
            status: true,
            uploadedAt: true,
            adminNotes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      message: 'Subscriptions retrieved successfully',
      data: {
        subscriptions,
        total: subscriptions.length
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get user subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve subscriptions'
    } as ApiResponse);
  }
};

export const getSubscriptionQRCode = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    const { subscriptionId } = req.params;

    if (!subscriptionId) {
      res.status(400).json({
        success: false,
        message: 'Subscription ID is required',
        error: 'Missing subscription ID parameter'
      } as ApiResponse);
      return;
    }

    // Get active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: req.user.id,
        status: 'ACTIVE'
      },
      include: {
        plan: {
          select: {
            name: true,
            timeUnit: true,
            duration: true
          }
        }
      }
    });

    if (!subscription) {
      res.status(404).json({
        success: false,
        message: 'Active subscription not found',
        error: 'No active subscription found with the specified ID'
      } as ApiResponse);
      return;
    }

    // Check if subscription is still valid
    const now = new Date();
    const endDate = new Date(subscription.endDate);

    if (now > endDate) {
      res.status(410).json({
        success: false,
        message: 'Subscription expired',
        error: 'This subscription has expired'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Access code retrieved successfully',
      data: {
        accessCode: subscription.accessCode,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          timeSlot: subscription.timeSlot,
          plan: subscription.plan
        }
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to generate QR code'
    } as ApiResponse);
  }
};

export const getSubscriptionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    const { subscriptionId } = req.params;

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: req.user.id
      },
      include: {
        plan: {
          select: {
            name: true,
            price: true,
            timeUnit: true,
            duration: true
          }
        },
        paymentReceipts: {
          select: {
            status: true,
            adminNotes: true,
            processedAt: true
          },
          orderBy: { uploadedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!subscription) {
      res.status(404).json({
        success: false,
        message: 'Subscription not found',
        error: 'Subscription not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Subscription status retrieved successfully',
      data: subscription
    } as ApiResponse);

  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve subscription status'
    } as ApiResponse);
  }
};

export const renewSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' } as ApiResponse);
      return;
    }

    const { subscriptionId } = req.params;

    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: req.user.id,
        status: { in: ['ACTIVE', 'EXPIRED'] }
      },
      include: { plan: true }
    });

    if (!existingSubscription) {
      res.status(404).json({ success: false, message: 'Eligible subscription for renewal not found' } as ApiResponse);
      return;
    }

    // Create a new subscription based on the old one
    const newStartDate = new Date();
    const newEndDate = calculateEndDate(newStartDate, existingSubscription.plan.timeUnit, existingSubscription.plan.duration);
    
    // Generate unique 6-digit access code
    let newAccessCode = generateAccessCode();
    let existingCode = await prisma.subscription.findUnique({ where: { accessCode: newAccessCode } });
    while (existingCode) {
      newAccessCode = generateAccessCode();
      existingCode = await prisma.subscription.findUnique({ where: { accessCode: newAccessCode } });
    }

    const newSubscription = await prisma.subscription.create({
      data: {
        userId: req.user.id,
        planId: existingSubscription.planId,
        timeSlot: existingSubscription.timeSlot,
        startDate: newStartDate,
        endDate: newEndDate,
        accessCode: newAccessCode,
        status: 'PENDING'
      },
      include: { plan: true }
    });

    // Optionally, mark the old subscription as expired
    if (existingSubscription.status === 'ACTIVE') {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'EXPIRED' }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Subscription renewal initiated successfully',
      data: {
        newSubscription,
        nextStep: 'Please upload your payment receipt for the new subscription period.'
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Renew subscription error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: 'Failed to renew subscription'
    } as ApiResponse);
  }
};
