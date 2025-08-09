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

// Helper function to calculate end date based on plan duration
const calculateEndDate = (startDate: Date, durationType: string): Date => {
  const endDate = new Date(startDate);
  
  switch (durationType) {
    case 'DAILY':
      endDate.setDate(endDate.getDate() + 1);
      break;
    case 'WEEKLY':
      endDate.setDate(endDate.getDate() + 7);
      break;
    case 'MONTHLY':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    default:
      endDate.setDate(endDate.getDate() + 1);
  }
  
  return endDate;
};

// Helper function to calculate grace period end date (only for monthly plans)
const calculateGraceEndDate = (endDate: Date, durationType: string): Date | null => {
  if (durationType !== 'MONTHLY') {
    return null;
  }
  
  const graceEndDate = new Date(endDate);
  graceEndDate.setDate(graceEndDate.getDate() + 2); // 2 days grace period
  return graceEndDate;
};

// Helper function to generate QR code
const generateQRCode = async (qrToken: string): Promise<string> => {
  try {
    const qrData = {
      token: qrToken,
      timestamp: new Date().toISOString(),
      type: 'access'
    };
    
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: parseInt(process.env.QR_CODE_SIZE || '200', 10),
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataURL;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
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
    if (plan.durationType === 'MONTHLY' && plan.name.includes('Standard') && !timeSlot) {
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
      const graceEndDate = existingSubscription.graceEndDate ? new Date(existingSubscription.graceEndDate) : null;
      
      // Check if subscription is still valid (within end date or grace period)
      const isStillValid = now <= endDate || (graceEndDate && now <= graceEndDate);
      
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

    // Calculate dates
    const endDate = calculateEndDate(parsedStartDate, plan.durationType);
    const graceEndDate = calculateGraceEndDate(endDate, plan.durationType);

    // Generate unique QR token
    const qrToken = uuidv4();

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: req.user.id,
        planId: plan.id,
        timeSlot: timeSlot || (plan.durationType === 'MONTHLY' && plan.name.includes('Premium') ? 'ALL' : timeSlot),
        startDate: parsedStartDate,
        endDate: endDate,
        graceEndDate: graceEndDate,
        qrToken: qrToken,
        status: 'PENDING'
      },
      include: {
        plan: {
          select: {
            name: true,
            price: true,
            durationType: true,
            timeStart: true,
            timeEnd: true
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
          graceEndDate: subscription.graceEndDate,
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
            durationType: true,
            timeStart: true,
            timeEnd: true
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
            durationType: true,
            timeStart: true,
            timeEnd: true
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
    const graceEndDate = subscription.graceEndDate ? new Date(subscription.graceEndDate) : null;

    if (now > endDate && (!graceEndDate || now > graceEndDate)) {
      res.status(410).json({
        success: false,
        message: 'Subscription expired',
        error: 'This subscription has expired'
      } as ApiResponse);
      return;
    }

    // Generate QR code
    const qrCodeDataURL = await generateQRCode(subscription.qrToken);

    res.status(200).json({
      success: true,
      message: 'QR code generated successfully',
      data: {
        qrCode: qrCodeDataURL,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          graceEndDate: subscription.graceEndDate,
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
            durationType: true
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
    const newEndDate = calculateEndDate(newStartDate, existingSubscription.plan.durationType);
    const newGraceEndDate = calculateGraceEndDate(newEndDate, existingSubscription.plan.durationType);
    const newQrToken = uuidv4();

    const newSubscription = await prisma.subscription.create({
      data: {
        userId: req.user.id,
        planId: existingSubscription.planId,
        timeSlot: existingSubscription.timeSlot,
        startDate: newStartDate,
        endDate: newEndDate,
        graceEndDate: newGraceEndDate,
        qrToken: newQrToken,
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
