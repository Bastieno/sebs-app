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
