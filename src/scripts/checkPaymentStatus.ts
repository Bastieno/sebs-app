import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPaymentStatus() {
  const paymentId = process.argv[2];
  
  if (!paymentId) {
    console.log('Usage: npx ts-node src/scripts/checkPaymentStatus.ts <payment-receipt-id>');
    console.log('Example: npx ts-node src/scripts/checkPaymentStatus.ts 4d39a818-4a17-4eb9-97e8-99e25888f15d');
    return;
  }

  try {
    const paymentReceipt = await prisma.paymentReceipt.findUnique({
      where: { id: paymentId },
      include: {
        subscription: {
          include: {
            user: true,
            plan: true
          }
        }
      }
    });

    if (!paymentReceipt) {
      console.log(`❌ Payment receipt not found: ${paymentId}`);
      return;
    }

    console.log('\n📄 PAYMENT RECEIPT DETAILS:');
    console.log('----------------------------');
    console.log(`Receipt ID: ${paymentReceipt.id}`);
    console.log(`Status: ${paymentReceipt.status}`);
    console.log(`Amount: ₦${paymentReceipt.amount}`);
    console.log(`Uploaded At: ${paymentReceipt.uploadedAt}`);
    
    if (paymentReceipt.status === 'APPROVED') {
      console.log(`✅ ALREADY APPROVED`);
      console.log(`Processed At: ${paymentReceipt.processedAt}`);
      console.log(`Processed By: ${paymentReceipt.processedBy}`);
      if (paymentReceipt.adminNotes) {
        console.log(`Admin Notes: ${paymentReceipt.adminNotes}`);
      }
    } else if (paymentReceipt.status === 'REJECTED') {
      console.log(`❌ REJECTED`);
      console.log(`Processed At: ${paymentReceipt.processedAt}`);
      console.log(`Admin Notes: ${paymentReceipt.adminNotes}`);
    } else {
      console.log(`⏳ Status: ${paymentReceipt.status} - Awaiting admin approval`);
    }

    console.log('\n📋 SUBSCRIPTION DETAILS:');
    console.log('------------------------');
    console.log(`Subscription ID: ${paymentReceipt.subscription.id}`);
    console.log(`Status: ${paymentReceipt.subscription.status}`);
    console.log(`User: ${paymentReceipt.subscription.user.name} (${paymentReceipt.subscription.user.email})`);
    console.log(`Plan: ${paymentReceipt.subscription.plan.name}`);
    
    if (paymentReceipt.subscription.status === 'ACTIVE') {
      console.log(`✅ Subscription is ACTIVE`);
      console.log(`Approved At: ${paymentReceipt.subscription.approvedAt}`);
      console.log(`Valid Until: ${paymentReceipt.subscription.endDate}`);
    }

    // Check for other pending payments
    const pendingPayments = await prisma.paymentReceipt.findMany({
      where: { status: 'PENDING' },
      include: {
        subscription: {
          include: {
            user: true,
            plan: true
          }
        }
      }
    });

    console.log(`\n📊 SYSTEM STATUS:`);
    console.log('------------------');
    console.log(`Total Pending Payments: ${pendingPayments.length}`);
    
    if (pendingPayments.length > 0) {
      console.log('\n🔔 PENDING PAYMENTS AWAITING APPROVAL:');
      pendingPayments.forEach((payment, index) => {
        console.log(`\n${index + 1}. Receipt ID: ${payment.id}`);
        console.log(`   User: ${payment.subscription.user.name}`);
        console.log(`   Amount: ₦${payment.amount}`);
        console.log(`   Uploaded: ${payment.uploadedAt}`);
      });
    }

  } catch (error) {
    console.error('Error checking payment status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPaymentStatus();
