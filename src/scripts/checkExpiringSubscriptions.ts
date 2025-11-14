import { PrismaClient } from '@prisma/client';
import { sendInAppNotification, templates } from '../services/notificationService';

const prisma = new PrismaClient();

/**
 * Check for subscriptions expiring in 15 minutes and send WhatsApp notifications
 * Also check for subscriptions that have just expired
 */
async function checkExpiringSubscriptions() {
  try {
    console.log('Starting subscription expiration check...');
    
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);

    // Find active subscriptions expiring in the next 15 minutes
    const subscriptionsExpiringSoon = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: now,
          lte: fifteenMinutesFromNow,
        },
      },
      include: {
        user: true,
        plan: true,
      },
    });

    console.log(`Found ${subscriptionsExpiringSoon.length} subscriptions expiring in the next 15 minutes`);

    // Send WhatsApp notifications for subscriptions expiring soon
    for (const subscription of subscriptionsExpiringSoon) {
      try {
        const template = templates.subscriptionExpiring15Min(
          subscription.user.name,
          subscription.plan.name,
          subscription.accessCode
        );

        await sendInAppNotification({
          userId: subscription.userId,
          message: template.inApp,
        });

        console.log(`Sent in-app expiration warning to ${subscription.user.name}`);
      } catch (error) {
        console.error(`Failed to send WhatsApp to ${subscription.user.phone}:`, error);
      }
    }

    // Find subscriptions that just expired (within the last minute)
    const justExpiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: oneMinuteAgo,
          lte: now,
        },
      },
      include: {
        user: true,
        plan: true,
      },
    });

    console.log(`Found ${justExpiredSubscriptions.length} subscriptions that just expired`);

    // Send WhatsApp notifications for expired subscriptions
    for (const subscription of justExpiredSubscriptions) {
      try {
        const template = templates.subscriptionExpired(
          subscription.user.name,
          subscription.plan.name
        );

        await sendInAppNotification({
          userId: subscription.userId,
          message: template.inApp,
        });

        // Update subscription status to EXPIRED (or IN_GRACE_PERIOD if applicable)
        const hasGracePeriod = subscription.graceEndDate && new Date(subscription.graceEndDate) > now;
        
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: hasGracePeriod ? 'IN_GRACE_PERIOD' : 'EXPIRED',
          },
        });

        console.log(`Sent in-app expiration notice to ${subscription.user.name} and updated status`);
      } catch (error) {
        console.error(`Failed to process expired subscription for ${subscription.user.phone}:`, error);
      }
    }

    console.log('Subscription expiration check completed successfully');
  } catch (error) {
    console.error('Error checking expiring subscriptions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkExpiringSubscriptions();
