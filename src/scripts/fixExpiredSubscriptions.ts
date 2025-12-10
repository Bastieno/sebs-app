import { prisma } from '../config/database';

/**
 * Script to fix expired subscriptions that are still marked as ACTIVE or IN_GRACE_PERIOD
 * This will update their status to EXPIRED based on their end date and grace period
 */
const fixExpiredSubscriptions = async () => {
  console.log('--- Starting Fix for Expired Subscriptions ---');
  console.log(`Current time: ${new Date().toISOString()}`);
  
  try {
    const now = new Date();
    
    // Find all subscriptions that are ACTIVE or IN_GRACE_PERIOD
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'IN_GRACE_PERIOD']
        }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        plan: {
          select: {
            name: true,
            planType: true,
            timeUnit: true
          }
        }
      }
    });
    
    console.log(`Found ${activeSubscriptions.length} subscriptions with ACTIVE or IN_GRACE_PERIOD status`);
    
    let expiredCount = 0;
    let stillActiveCount = 0;
    
    for (const subscription of activeSubscriptions) {
      const endDate = new Date(subscription.endDate);
      
      // Calculate grace period end (7 days after end date for MONTHLY plans)
      const gracePeriodDays = 7;
      const gracePeriodEnd = new Date(endDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
      const hasGracePeriod = subscription.plan.planType === 'MONTHLY';
      
      // Check if the subscription is expired
      const isExpired = now > endDate && (!hasGracePeriod || now > gracePeriodEnd);
      
      if (isExpired) {
        console.log(`\nExpired subscription found:`);
        console.log(`  - ID: ${subscription.id}`);
        console.log(`  - User: ${subscription.user.name} (${subscription.user.email})`);
        console.log(`  - Plan: ${subscription.plan.name}`);
        console.log(`  - End Date: ${endDate.toISOString()}`);
        console.log(`  - Current Status: ${subscription.status}`);
        
        // Update the subscription status to EXPIRED
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED' }
        });
        
        console.log(`  ✓ Status updated to EXPIRED`);
        expiredCount++;
      } else {
        stillActiveCount++;
        
        // For subscriptions that should be IN_GRACE_PERIOD
        if (subscription.status === 'ACTIVE' && 
            now > endDate && 
            hasGracePeriod && 
            now <= gracePeriodEnd) {
          
          console.log(`\nSubscription in grace period:`);
          console.log(`  - ID: ${subscription.id}`);
          console.log(`  - User: ${subscription.user.name} (${subscription.user.email})`);
          console.log(`  - Plan: ${subscription.plan.name}`);
          console.log(`  - Grace ends: ${gracePeriodEnd.toISOString()}`);
          
          // Update to IN_GRACE_PERIOD
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'IN_GRACE_PERIOD' }
          });
          
          console.log(`  ✓ Status updated to IN_GRACE_PERIOD`);
        }
      }
    }
    
    console.log(`\n--- Summary ---`);
    console.log(`Total subscriptions checked: ${activeSubscriptions.length}`);
    console.log(`Subscriptions marked as EXPIRED: ${expiredCount}`);
    console.log(`Subscriptions still active/valid: ${stillActiveCount}`);
    
  } catch (error) {
    console.error('Error fixing expired subscriptions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n--- Fix Completed ---');
  }
};

// Run the fix
fixExpiredSubscriptions();
