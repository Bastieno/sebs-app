import { prisma } from '../config/database';

/**
 * Comprehensive script to:
 * 1. Mark expired subscriptions as EXPIRED
 * 2. Reset plan capacities to match only ACTIVE users currently inside
 * 3. Clean up orphaned capacity counts
 */
const cleanupExpiredAndResetCapacity = async () => {
  console.log('========================================');
  console.log('Starting Cleanup: Expired Subscriptions & Capacity Reset');
  console.log('========================================');
  console.log(`Current time: ${new Date().toISOString()}\n`);
  
  try {
    const now = new Date();
    
    // ===== STEP 1: Mark Expired Subscriptions =====
    console.log('STEP 1: Checking for expired subscriptions...\n');
    
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
    
    console.log(`Found ${activeSubscriptions.length} subscriptions with ACTIVE/IN_GRACE_PERIOD status`);
    
    let expiredCount = 0;
    let graceCount = 0;
    let stillActiveCount = 0;
    
    for (const subscription of activeSubscriptions) {
      const endDate = new Date(subscription.endDate);
      
      // Check if fully expired (no grace period in current schema)
      const isExpired = now > endDate;
      
      // Check if in grace period (7 days after end date for MONTHLY plans)
      const gracePeriodDays = 7;
      const gracePeriodEnd = new Date(endDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
      const isInGracePeriod = subscription.plan.planType === 'MONTHLY' && 
                              now > endDate && 
                              now <= gracePeriodEnd;
      
      if (isExpired && !isInGracePeriod) {
        console.log(`\n❌ EXPIRED: ${subscription.user.name} - ${subscription.plan.name}`);
        console.log(`   End Date: ${endDate.toISOString()}`);
        
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED' }
        });
        
        console.log(`   ✓ Status updated to EXPIRED`);
        expiredCount++;
      } else if (isInGracePeriod && subscription.status === 'ACTIVE') {
        const gracePeriodDays = 7;
        const gracePeriodEnd = new Date(endDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
        console.log(`\n⚠️  GRACE PERIOD: ${subscription.user.name} - ${subscription.plan.name}`);
        console.log(`   Grace ends: ${gracePeriodEnd.toISOString()}`);
        
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'IN_GRACE_PERIOD' }
        });
        
        console.log(`   ✓ Status updated to IN_GRACE_PERIOD`);
        graceCount++;
      } else {
        stillActiveCount++;
      }
    }
    
    console.log(`\n--- Subscription Status Update Summary ---`);
    console.log(`Total checked: ${activeSubscriptions.length}`);
    console.log(`Marked as EXPIRED: ${expiredCount}`);
    console.log(`Moved to GRACE PERIOD: ${graceCount}`);
    console.log(`Still ACTIVE: ${stillActiveCount}`);
    
    // ===== STEP 2: Reset Plan Capacities =====
    console.log('\n\n========================================');
    console.log('STEP 2: Resetting plan capacities...\n');
    
    // Get all active plans
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            accessLogs: {
              where: {
                action: {
                  in: ['ENTRY', 'EXIT']
                }
              },
              orderBy: {
                timestamp: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });
    
    console.log(`Found ${plans.length} active plans to process\n`);
    
    for (const plan of plans) {
      const oldCapacity = plan.currentCapacity;
      
      // Calculate actual current capacity based on access logs
      let actualCapacity = 0;
      
      for (const subscription of plan.subscriptions) {
        // Check if user's last access log was an ENTRY (means they're inside)
        const lastLog = subscription.accessLogs[0];
        if (lastLog && lastLog.action === 'ENTRY' && lastLog.validationResult === 'SUCCESS') {
          actualCapacity++;
        }
      }
      
      // Update plan capacity to match actual
      if (oldCapacity !== actualCapacity) {
        await prisma.plan.update({
          where: { id: plan.id },
          data: { currentCapacity: actualCapacity }
        });
        
        console.log(`📊 ${plan.name}:`);
        console.log(`   Old Capacity: ${oldCapacity}`);
        console.log(`   New Capacity: ${actualCapacity}`);
        console.log(`   Difference: ${oldCapacity - actualCapacity} (cleaned up)`);
        console.log(`   Active Subscriptions: ${plan.subscriptions.length}`);
      } else {
        console.log(`✓ ${plan.name}: Capacity already correct (${actualCapacity})`);
      }
    }
    
    // ===== STEP 3: Summary =====
    console.log('\n\n========================================');
    console.log('FINAL SUMMARY');
    console.log('========================================');
    
    // Get updated totals
    const updatedPlans = await prisma.plan.findMany({
      where: { isActive: true },
      select: {
        name: true,
        maxCapacity: true,
        currentCapacity: true
      }
    });
    
    const totalCapacity = updatedPlans.reduce((acc, plan) => acc + (plan.maxCapacity || 0), 0);
    const totalOccupancy = updatedPlans.reduce((acc, plan) => acc + plan.currentCapacity, 0);
    
    console.log(`\nGlobal Hub Status:`);
    console.log(`  Total Capacity: 40 (global limit)`);
    console.log(`  Current Occupancy: ${totalOccupancy}`);
    console.log(`  Available Spots: ${40 - totalOccupancy}`);
    console.log(`  Plan-based Capacity: ${totalCapacity}`);
    
    console.log(`\nPlan Breakdown:`);
    updatedPlans.forEach(plan => {
      if (plan.currentCapacity > 0 || plan.maxCapacity) {
        console.log(`  - ${plan.name}: ${plan.currentCapacity}${plan.maxCapacity ? `/${plan.maxCapacity}` : ''}`);
      }
    });
    
    console.log('\n✅ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the cleanup
cleanupExpiredAndResetCapacity();
