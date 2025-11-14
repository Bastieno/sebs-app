import nodemailer from 'nodemailer';
import { prisma } from '../config/database';

// --- Email Configuration ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      ...options,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

interface SmsOptions {
  to: string; // Must be in E.164 format, e.g., +1234567890
  body: string;
}

export const sendSms = async (options: SmsOptions) => {
  console.log(`[SMS STUB] To: ${options.to}, Body: ${options.body}`);
  return { sid: 'sms_stub_' + Date.now() };
};

// In-app notification
interface InAppNotificationOptions {
  userId: string;
  message: string;
}

export const sendInAppNotification = async (options: InAppNotificationOptions) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: options.userId,
        message: options.message,
        isRead: false,
      },
    });
    console.log('In-app notification created for user:', options.userId);
    return notification;
  } catch (error) {
    console.error('Error creating in-app notification:', error);
    throw new Error('Failed to create in-app notification');
  }
};

// --- Notification Templates ---

export const templates = {
  subscriptionApproved: (userName: string, planName: string) => ({
    subject: 'Your Subscription is Active!',
    html: `<p>Hi ${userName},</p><p>Your subscription for the <strong>${planName}</strong> plan has been approved and is now active. Welcome to Seb's Hub!</p>`,
    sms: `Hi ${userName}, your ${planName} subscription is now active. Welcome to Seb's Hub!`
  }),

  subscriptionRejected: (userName: string, reason: string) => ({
    subject: 'Update on Your Subscription Payment',
    html: `<p>Hi ${userName},</p><p>There was an issue with your recent payment for your subscription. The reason provided by our admin is: <em>"${reason}"</em>.</p><p>Please contact us for more details.</p>`,
    sms: `Hi ${userName}, there was an issue with your subscription payment. Reason: "${reason}". Please contact us.`
  }),

  subscriptionExpiresSoon: (userName: string, planName: string, expiryDate: string) => ({
    subject: 'Your Subscription is Expiring Soon',
    html: `<p>Hi ${userName},</p><p>This is a reminder that your <strong>${planName}</strong> subscription will expire on ${expiryDate}. Please renew to continue enjoying our services.</p>`,
    sms: `Hi ${userName}, your ${planName} subscription expires on ${expiryDate}. Renew soon!`
  }),

  gracePeriodAlert: (userName: string, planName: string, graceEndDate: string) => ({
    subject: 'Your Subscription is in a Grace Period',
    html: `<p>Hi ${userName},</p><p>Your <strong>${planName}</strong> subscription has expired. You are currently in a 2-day grace period, which ends on ${graceEndDate}. Please renew your subscription immediately to avoid service interruption.</p>`,
    sms: `Hi ${userName}, your ${planName} subscription has expired. Your grace period ends on ${graceEndDate}. Please renew now.`
  }),

  subscriptionExpiring15Min: (userName: string, planName: string, accessCode: string) => ({
    inApp: `Hi ${userName}, your ${planName} subscription will expire in 15 minutes. Access Code: ${accessCode}. Please renew to continue using Seb's Hub.`
  }),

  subscriptionExpiringSoon: (userName: string, planName: string, expiryDate: string) => ({
    inApp: `Hi ${userName}, your ${planName} subscription will expire on ${expiryDate}. Please renew to continue using Seb's Hub.`
  }),

  subscriptionExpired: (userName: string, planName: string) => ({
    inApp: `Hi ${userName}, your ${planName} subscription has now expired. Please visit Seb's Hub to renew your subscription. Thank you!`
  }),
};
