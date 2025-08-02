import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

export const sendNotification = async (req: Request, res: Response) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ message: 'User ID and message are required' });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        message,
      },
    });

    return res.status(201).json(notification);
  } catch (error) {
    return res.status(500).json({ message: 'Error sending notification', error });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(notifications);
  } catch (error) {
    return res.status(500).json({ message: 'Error getting notifications', error });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const user = (req as AuthenticatedRequest).user;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return res.status(200).json(updatedNotification);
  } catch (error) {
    return res.status(500).json({ message: 'Error marking notification as read', error });
  }
};
