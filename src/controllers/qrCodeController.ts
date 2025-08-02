import { Request, Response } from 'express';
import qr from 'qrcode';
import { prisma } from '../config/database';

export const generateQRCode = async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ message: 'Subscription ID is required' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const qrToken = `${subscription.id}-${Date.now()}`;

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { qrToken },
    });

    const qrCodeImage = await qr.toDataURL(qrToken);

    return res.status(201).json({ qrCode: qrCodeImage });
  } catch (error) {
    return res.status(500).json({ message: 'Error generating QR code', error });
  }
};

export const validateQRCode = async (req: Request, res: Response) => {
  try {
    const { qrCodeData } = req.body;

    if (!qrCodeData) {
      return res.status(400).json({ message: 'QR code data is required' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { qrToken: qrCodeData },
      include: { plan: true, user: true },
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    return res.status(200).json({ message: 'QR code validated successfully', subscription });
  } catch (error) {
    return res.status(500).json({ message: 'Error validating QR code', error });
  }
};
