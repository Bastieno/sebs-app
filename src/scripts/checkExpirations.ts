import { prisma } from '../config/database';
import { sendEmail, sendSms, templates } from '../services/notificationService';

const EXPIRY_WARNING_DAYS = 3;

const checkAndSendExpirationWarnings = async () => {
  console.log('Checking for subscriptions nearing expiration...');

  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + EXPIRY_WARNING_DAYS);

  const expiringSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        lte: warningDate,
        gt: new Date(), // Ensure we don't re-notify for already expired ones
      },
      // Add a flag to prevent re-sending notifications, e.g., `warningSent: false`
    },
    include: {
      user: true,
      plan: true,
    },
  });

  if (expiringSubscriptions.length > 0) {
    console.log(`Found ${expiringSubscriptions.length} subscriptions to warn.`);
    for (const sub of expiringSubscriptions) {
      try {
        const expiryDateStr = sub.endDate.toLocaleDateString();
        const template = templates.subscriptionExpiresSoon(sub.user.name, sub.plan.name, expiryDateStr);
        
        await sendEmail({ to: sub.user.email, subject: template.subject, html: template.html });
        await sendSms({ to: sub.user.phone, body: template.sms });

        console.log(`Sent expiration warning to ${sub.user.email}`);
        // Here you would set a flag on the subscription to prevent re-sending warnings
      } catch (error) {
        console.error(`Failed to send warning for subscription ${sub.id}:`, error);
      }
    }
  } else {
    console.log('No subscriptions nearing expiration.');
  }
};

const handleExpiredSubscriptions = async () => {
  console.log('Handling subscriptions that have passed their end date...');
  const now = new Date();

  // Get all active subscriptions that have expired
  const expiredSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        lt: now,
      },
    },
    include: {
      user: true,
      plan: true,
    },
  });

  if (expiredSubscriptions.length > 0) {
    console.log(`Found ${expiredSubscriptions.length} expired subscriptions.`);
    
    // Mark all expired subscriptions as EXPIRED
    const idsToExpire = expiredSubscriptions.map(sub => sub.id);
    
    await prisma.subscription.updateMany({
      where: {
        id: { in: idsToExpire },
      },
      data: {
        status: 'EXPIRED',
      },
    });
    
    console.log(`Marked ${idsToExpire.length} subscriptions as EXPIRED.`);
  } else {
    console.log('No expired subscriptions to process.');
  }
};


const runAllChecks = async () => {
  console.log('--- Starting Daily Subscription Maintenance ---');
  try {
    await checkAndSendExpirationWarnings();
    await handleExpiredSubscriptions();
  } catch (error) {
    console.error('An error occurred during subscription maintenance:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('--- Daily Subscription Maintenance Finished ---');
  }
};

runAllChecks();
