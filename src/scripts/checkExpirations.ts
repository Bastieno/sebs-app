import { prisma } from '../config/database';
import { sendEmail, sendSms, templates } from '../services/notificationService';

const EXPIRY_WARNING_DAYS = 3;

const checkSubscriptionExpirations = async () => {
  console.log('Running subscription expiration check...');

  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + EXPIRY_WARNING_DAYS);

  const expiringSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        lte: warningDate,
      },
    },
    include: {
      user: true,
      plan: true,
    },
  });

  console.log(`Found ${expiringSubscriptions.length} subscriptions expiring soon.`);

  for (const sub of expiringSubscriptions) {
    try {
      const expiryDateStr = sub.endDate.toLocaleDateString();
      const template = templates.subscriptionExpiresSoon(sub.user.name, sub.plan.name, expiryDateStr);
      
      await sendEmail({
        to: sub.user.email,
        subject: template.subject,
        html: template.html,
      });

      await sendSms({
        to: sub.user.phone,
        body: template.sms,
      });

      console.log(`Sent expiration warning to ${sub.user.email}`);
    } catch (error) {
      console.error(`Failed to send warning for subscription ${sub.id}:`, error);
    }
  }

  console.log('Subscription expiration check finished.');
};

checkSubscriptionExpirations()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
