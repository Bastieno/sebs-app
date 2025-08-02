import nodemailer from 'nodemailer';
// import Twilio from 'twilio'; // Or your preferred SMS provider

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

// --- SMS Configuration ---
// const twilioClient = Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

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
  try {
    // const message = await twilioClient.messages.create({
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   ...options,
    // });
    // console.log('SMS sent: %s', message.sid);
    // return message;
    console.log(`[SMS STUB] To: ${options.to}, Body: ${options.body}`);
    return { sid: 'sms_stub_' + Date.now() };
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error('Failed to send SMS');
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
};
