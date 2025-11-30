import cron from 'node-cron';
import { checkExpiringSubscriptions } from '../scripts/checkExpiringSubscriptions';

/**
 * Initialize all scheduled tasks
 */
export function initializeScheduledTasks() {
  console.log('🕐 Initializing scheduled tasks...');

  // Check for expiring subscriptions every 5 minutes
  // Cron format: minute hour day month weekday
  // */5 * * * * = every 5 minutes
  const expirationCheckTask = cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ Running scheduled expiration check...');
    try {
      await checkExpiringSubscriptions();
      console.log('✅ Expiration check completed');
    } catch (error) {
      console.error('❌ Expiration check failed:', error);
    }
  });

  // Run the check immediately on server start
  console.log('🚀 Running initial expiration check...');
  checkExpiringSubscriptions()
    .then(() => console.log('✅ Initial expiration check completed'))
    .catch((error) => console.error('❌ Initial expiration check failed:', error));

  console.log('✅ Scheduled tasks initialized successfully');
  console.log('📅 Expiration check will run every 5 minutes');

  // Return tasks for potential cleanup
  return {
    expirationCheckTask,
  };
}

/**
 * Stop all scheduled tasks
 */
export function stopScheduledTasks(tasks: ReturnType<typeof initializeScheduledTasks>) {
  console.log('🛑 Stopping scheduled tasks...');
  tasks.expirationCheckTask.stop();
  console.log('✅ All scheduled tasks stopped');
}
