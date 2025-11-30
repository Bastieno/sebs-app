import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../types';
import { sendEmail, sendSms, templates } from '../services/notificationService';

// Fetch all pending payment receipts
export const getPendingPayments = async (req: Request, res: Response) => {
  try {
    const pendingPayments = await prisma.paymentReceipt.findMany({
      where: { status: 'PENDING' },
      include: {
        subscription: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            plan: {
              select: { name: true, price: true }
            }
          }
        }
      },
      orderBy: { uploadedAt: 'asc' }
    });

    res.status(200).json({
      success: true,
      message: 'Pending payments retrieved successfully',
      data: pendingPayments
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending payments',
      error
    } as ApiResponse);
  }
};

// Create user manually (Admin only)
export const createUserManually = async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (!name || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and phone are required'
    } as ApiResponse);
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      } as ApiResponse);
    }

    const bcrypt = require('bcryptjs');
    // Generate a random password if none provided (user won't need to login)
    const userPassword = password || Math.random().toString(36).slice(-12);
    const passwordHash = await bcrypt.hash(userPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: 'USER',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    } as ApiResponse);
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating user',
      error
    } as ApiResponse);
  }
};

// Create and activate subscription in one step (Admin only)
export const createAndActivateSubscription = async (req: Request, res: Response) => {
  const { userId, planId, timeSlot, startDate, paymentMethod, adminNotes } = req.body;

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (!userId || !planId || !startDate) {
    return res.status(400).json({
      success: false,
      message: 'userId, planId, and startDate are required'
    } as ApiResponse);
  }

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      } as ApiResponse);
    }

    // Verify plan exists
    const plan = await prisma.plan.findUnique({ where: { id: planId, isActive: true } });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found or inactive'
      } as ApiResponse);
    }

    // Helper functions
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

    const calculateGraceEndDate = (endDate: Date, durationType: string): Date | null => {
      if (durationType !== 'MONTHLY') return null;
      const graceEndDate = new Date(endDate);
      graceEndDate.setDate(graceEndDate.getDate() + 2);
      return graceEndDate;
    };

    const generateAccessCode = (): string => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const parsedStartDate = new Date(startDate);
    const endDate = calculateEndDate(parsedStartDate, plan.durationType);
    const graceEndDate = calculateGraceEndDate(endDate, plan.durationType);

    // Generate unique access code
    let accessCode = generateAccessCode();
    let existingCode = await prisma.subscription.findUnique({ where: { accessCode } });
    while (existingCode) {
      accessCode = generateAccessCode();
      existingCode = await prisma.subscription.findUnique({ where: { accessCode } });
    }

    // Create subscription and payment record in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          userId,
          planId,
          timeSlot: timeSlot || (plan.durationType === 'MONTHLY' && plan.name.includes('Premium') ? 'ALL' : null),
          startDate: parsedStartDate,
          endDate,
          graceEndDate,
          accessCode,
          status: 'ACTIVE',
          approvedAt: new Date(),
          approvedBy: req.user!.id,
          adminNotes: adminNotes || `Created and activated by admin. Payment method: ${paymentMethod || 'Not specified'}`
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true }
          },
          plan: true
        }
      });

      // Create payment record
      await tx.paymentReceipt.create({
        data: {
          subscriptionId: subscription.id,
          receiptUrl: 'N/A',
          amount: plan.price,
          status: 'APPROVED',
          processedAt: new Date(),
          processedBy: req.user!.id,
          adminNotes: `Direct activation by admin. Payment method: ${paymentMethod || 'Not specified'}. ${adminNotes || ''}`
        }
      });

      return subscription;
    });

    return res.status(201).json({
      success: true,
      message: 'Subscription created and activated successfully',
      data: {
        subscription: result,
        accessCode: result.accessCode
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Create subscription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating subscription',
      error
    } as ApiResponse);
  }
};

// Get user and plan info by access code
export const getUserByAccessCode = async (req: Request, res: Response) => {
  const { accessCode } = req.params;

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (!accessCode) {
    return res.status(400).json({
      success: false,
      message: 'Access code is required'
    } as ApiResponse);
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { accessCode },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true
          }
        },
        plan: true,
        paymentReceipts: {
          select: {
            amount: true,
            status: true,
            uploadedAt: true,
            processedAt: true,
            adminNotes: true
          },
          orderBy: { uploadedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found with this access code'
      } as ApiResponse);
    }

    // Check subscription status
    const now = new Date();
    
    // For custom plans, use the plan's endDateTime; for system plans, use subscription's endDate
    let isExpired: boolean;
    let daysRemaining: number;
    
    if (subscription.plan.isCustom && subscription.plan.endDateTime) {
      // Custom plan - check against plan's endDateTime
      const endDateTime = new Date(subscription.plan.endDateTime);
      isExpired = now > endDateTime;
      daysRemaining = Math.ceil((endDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      // System plan - check against subscription's endDate with grace period
      const endDate = new Date(subscription.endDate);
      const graceEndDate = subscription.graceEndDate ? new Date(subscription.graceEndDate) : null;
      isExpired = now > endDate && (!graceEndDate || now > graceEndDate);
      daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription details retrieved successfully',
      data: {
        user: subscription.user,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          graceEndDate: subscription.graceEndDate,
          timeSlot: subscription.timeSlot,
          accessCode: subscription.accessCode,
          isExpired,
          daysRemaining: isExpired ? 0 : daysRemaining,
          createdAt: subscription.createdAt
        },
        plan: subscription.plan,
        lastPayment: subscription.paymentReceipts[0] || null
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get user by access code error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving subscription details',
      error
    } as ApiResponse);
  }
};

// Get all notifications for admin dashboard
export const getNotifications = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const notifications = await prisma.notification.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 notifications
    });

    return res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications
    } as ApiResponse);
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving notifications',
      error
    } as ApiResponse);
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req: Request, res: Response) => {
  const { notificationId } = req.params;

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    } as ApiResponse);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error
    } as ApiResponse);
  }
};

// Approve a payment and activate the subscription
export const approvePayment = async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const { adminNotes } = req.body;

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const payment = await prisma.paymentReceipt.findUnique({
      where: { id: paymentId },
      include: { 
        subscription: {
          include: {
            plan: true
          }
        } 
      }
    });

    if (!payment || payment.status !== 'PENDING') {
      return res.status(404).json({
        success: false,
        message: 'Pending payment not found'
      } as ApiResponse);
    }

    // Use a transaction to ensure atomicity
    const [updatedPayment, updatedSubscription] = await prisma.$transaction([
      prisma.paymentReceipt.update({
        where: { id: paymentId },
        data: {
          status: 'APPROVED',
          processedAt: new Date(),
          processedBy: req.user.id,
          adminNotes
        }
      }),
      prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: 'ACTIVE',
          approvedAt: new Date(),
          approvedBy: req.user.id
        }
      })
    ]);

    // Send notification
    const user = await prisma.user.findUnique({ where: { id: updatedSubscription.userId } });
    if (user) {
      const template = templates.subscriptionApproved(user.name, payment.subscription.plan.name);
      // await sendEmail({ to: user.email, subject: template.subject, html: template.html });
      // await sendSms({ to: user.phone, body: template.sms });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment approved and subscription activated',
      data: { updatedPayment, updatedSubscription }
    } as ApiResponse);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error approving payment',
      error
    } as ApiResponse);
  }
};

// Reject a payment
export const rejectPayment = async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const { adminNotes } = req.body;

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (!adminNotes) {
    return res.status(400).json({
      success: false,
      message: 'Admin notes are required for rejection'
    } as ApiResponse);
  }

  try {
    const payment = await prisma.paymentReceipt.findUnique({
      where: { id: paymentId }
    });

    if (!payment || payment.status !== 'PENDING') {
      return res.status(404).json({
        success: false,
        message: 'Pending payment not found'
      } as ApiResponse);
    }

    const updatedPayment = await prisma.paymentReceipt.update({
      where: { id: paymentId },
      data: {
        status: 'REJECTED',
        processedAt: new Date(),
        processedBy: req.user.id,
        adminNotes
      }
    });

    // Send notification
    const subscription = await prisma.subscription.findUnique({ 
      where: { id: payment.subscriptionId },
      include: { user: true }
    });
    if (subscription) {
      const template = templates.subscriptionRejected(subscription.user.name, adminNotes || 'No reason provided.');
      await sendEmail({ to: subscription.user.email, subject: template.subject, html: template.html });
      await sendSms({ to: subscription.user.phone, body: template.sms });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment rejected successfully',
      data: updatedPayment
    } as ApiResponse);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error rejecting payment',
      error
    } as ApiResponse);
  }
};

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};

// Update user status
export const updateUserStatus = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { isActive } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive }
    });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user status' });
  }
};

// Get all subscriptions
export const getAllSubscriptions = async (req: Request, res: Response) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: { user: true, plan: true }
    });
    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subscriptions' });
  }
};

// Get access logs
export const getAccessLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.accessLog.findMany({
      include: { user: true, subscription: true },
      orderBy: { timestamp: 'desc' }
    });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching access logs' });
  }
};

// Get dashboard analytics
export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeSubscriptions = await prisma.subscription.count({ where: { status: 'ACTIVE' } });
    const totalRevenue = await prisma.paymentReceipt.aggregate({
      _sum: { amount: true },
      where: { status: 'APPROVED' }
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeSubscriptions,
        totalRevenue: totalRevenue._sum.amount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching analytics' });
  }
};

// Approve subscription directly without receipt requirement
export const approveSubscriptionDirectly = async (req: Request, res: Response) => {
  const { subscriptionId } = req.params;
  const { adminNotes, paymentMethod } = req.body;

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { 
        plan: true,
        user: true
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      } as ApiResponse);
    }

    if (subscription.status === 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is already active'
      } as ApiResponse);
    }

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update subscription to ACTIVE
      const updated = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'ACTIVE',
          approvedAt: new Date(),
          approvedBy: req.user!.id,
          adminNotes: adminNotes || `Approved directly. Payment method: ${paymentMethod || 'Not specified'}`
        }
      });

      // Create a payment record for tracking
      await tx.paymentReceipt.create({
        data: {
          subscriptionId: subscription.id,
          receiptUrl: 'N/A', // No receipt uploaded
          amount: subscription.plan.price,
          status: 'APPROVED',
          processedAt: new Date(),
          processedBy: req.user!.id,
          adminNotes: `Direct approval. Payment method: ${paymentMethod || 'Not specified'}. ${adminNotes || ''}`
        }
      });

      return updated;
    });

    // Send notification
    const template = templates.subscriptionApproved(
      subscription.user.name, 
      subscription.plan.name
    );
    // await sendEmail({ to: subscription.user.email, subject: template.subject, html: template.html });
    // await sendSms({ to: subscription.user.phone, body: template.sms });

    return res.status(200).json({
      success: true,
      message: 'Subscription activated successfully',
      data: result
    } as ApiResponse);
  } catch (error) {
    console.error('Approve subscription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error approving subscription',
      error
    } as ApiResponse);
  }
};
