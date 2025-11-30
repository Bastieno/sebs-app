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

  // Get all active subscriptions
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      user: true,
      plan: true,
    },
  });

  const newlyExpired = activeSubscriptions.filter(sub => {
    // For custom plans, check plan's endDateTime
    if (sub.plan.isCustom && sub.plan.endDateTime) {
      return new Date(sub.plan.endDateTime) < now;
    }
    // For system plans, check subscription's endDate
    return sub.endDate < now;
  });

  if (newlyExpired.length > 0) {
    console.log(`Found ${newlyExpired.length} newly expired subscriptions.`);
    for (const sub of newlyExpired) {
      // Custom plans don't have grace periods - expire immediately
      if (sub.plan.isCustom) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED' },
        });
        console.log(`Custom plan subscription ${sub.id} has been marked as EXPIRED.`);
      } else if (sub.plan.durationType === 'MONTHLY' && sub.graceEndDate && sub.graceEndDate > now) {
        // --- System plan: Move to Grace Period ---
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'IN_GRACE_PERIOD' },
        });
        
        const graceEndDateStr = sub.graceEndDate.toLocaleDateString();
        const template = templates.gracePeriodAlert(sub.user.name, sub.plan.name, graceEndDateStr);
        
        await sendEmail({ to: sub.user.email, subject: template.subject, html: template.html });
        await sendSms({ to: sub.user.phone, body: template.sms });

        console.log(`Subscription ${sub.id} moved to IN_GRACE_PERIOD.`);
      } else {
        // --- System plan: Expire Immediately ---
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED' },
        });
        console.log(`Subscription ${sub.id} has been marked as EXPIRED.`);
      }
    }
  } else {
    console.log('No newly expired subscriptions to process.');
  }
};

const handleGracePeriodEnd = async () => {
  console.log('Handling subscriptions at the end of their grace period...');
  const now = new Date();

  const graceEndedSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'IN_GRACE_PERIOD',
      graceEndDate: {
        lt: now,
      },
    },
  });

  if (graceEndedSubscriptions.length > 0) {
    console.log(`Found ${graceEndedSubscriptions.length} subscriptions whose grace period has ended.`);
    const idsToExpire = graceEndedSubscriptions.map(sub => sub.id);
    
    await prisma.subscription.updateMany({
      where: {
        id: { in: idsToExpire },
      },
      data: {
        status: 'EXPIRED',
      },
    });
    console.log(`Marked ${idsToExpire.length} subscriptions as EXPIRED after grace period.`);
  } else {
    console.log('No grace periods have ended.');
  }
};

const runAllChecks = async () => {
  console.log('--- Starting Daily Subscription Maintenance ---');
  try {
    await checkAndSendExpirationWarnings();
    await handleExpiredSubscriptions();
    await handleGracePeriodEnd();
  } catch (error) {
    console.error('An error occurred during subscription maintenance:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('--- Daily Subscription Maintenance Finished ---');
  }
};

runAllChecks();
