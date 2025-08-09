import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

async function testPaymentApprovalWorkflow() {
  console.log('🔧 Testing Complete Payment Approval Workflow...\n');

  try {
    // Step 1: Create a test user
    console.log('📝 Step 1: Creating test user...');
    const testUserEmail = 'testuser@example.com';
    
    // Check if test user exists
    let testUser = await prisma.user.findUnique({
      where: { email: testUserEmail }
    });

    if (!testUser) {
      const hashedPassword = await hashPassword('TestUser123!');
      testUser = await prisma.user.create({
        data: {
          name: 'Test User',
          email: testUserEmail,
          phone: '+2348012345678',
          passwordHash: hashedPassword,
          role: 'USER',
          isActive: true
        }
      });
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user already exists');
    }
    console.log(`   User ID: ${testUser.id}`);
    console.log(`   Email: ${testUser.email}\n`);

    // Step 2: Get an active plan
    console.log('📝 Step 2: Getting an active plan...');
    const plan = await prisma.plan.findFirst({
      where: { isActive: true }
    });

    if (!plan) {
      console.log('❌ No active plans found. Please create a plan first.');
      return;
    }
    console.log(`✅ Using plan: ${plan.name}`);
    console.log(`   Plan ID: ${plan.id}`);
    console.log(`   Price: ₦${plan.price}\n`);

    // Step 3: Create a subscription for the user
    console.log('📝 Step 3: Creating subscription for test user...');
    
    // Check if user already has a pending subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: testUser.id,
        status: { in: ['PENDING', 'ACTIVE'] }
      }
    });

    let subscription;
    if (existingSubscription) {
      console.log('✅ User already has a subscription');
      subscription = existingSubscription;
    } else {
      subscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          planId: plan.id,
          status: 'PENDING',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          graceEndDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000), // 37 days from now
          qrToken: `QR-${testUser.id}-${Date.now()}`
        }
      });
      console.log('✅ Subscription created');
    }
    console.log(`   Subscription ID: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}\n`);

    // Step 4: Create a payment receipt (simulating user upload)
    console.log('📝 Step 4: Creating payment receipt (simulating upload)...');
    
    // Check if payment receipt already exists
    const existingReceipt = await prisma.paymentReceipt.findFirst({
      where: {
        subscriptionId: subscription.id,
        status: 'PENDING'
      }
    });

    let paymentReceipt;
    if (existingReceipt) {
      console.log('✅ Payment receipt already exists');
      paymentReceipt = existingReceipt;
    } else {
      paymentReceipt = await prisma.paymentReceipt.create({
        data: {
          subscriptionId: subscription.id,
          receiptUrl: '/uploads/receipts/test-receipt.jpg',
          amount: plan.price,
          status: 'PENDING',
          uploadedAt: new Date()
        }
      });
      console.log('✅ Payment receipt created');
    }
    console.log(`   Receipt ID: ${paymentReceipt.id}`);
    console.log(`   Amount: ₦${paymentReceipt.amount}`);
    console.log(`   Status: ${paymentReceipt.status}\n`);

    // Step 5: Display approval command
    console.log('🎉 Payment receipt ready for approval!\n');
    console.log('📋 COMPLETE WORKFLOW COMMANDS:\n');
    console.log('1️⃣  User Login (to get user token):');
    console.log(`curl -X POST http://localhost:3002/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"${testUser.email}","password":"TestUser123!"}'`);
    
    console.log('\n2️⃣  Apply for Subscription (using user token from step 1):');
    console.log(`curl -X POST http://localhost:3002/api/subscriptions/apply \\
  -H "Authorization: Bearer USER_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{"planId":"${plan.id}","timeSlot":"MORNING"}'`);
    
    console.log('\n3️⃣  Upload Payment Receipt (using user token and subscription ID from step 2):');
    console.log(`curl -X POST http://localhost:3002/api/subscriptions/SUBSCRIPTION_ID/upload-receipt \\
  -H "Authorization: Bearer USER_TOKEN_HERE" \\
  -F "receipt=@/path/to/receipt.jpg" \\
  -F "amount=${plan.price}"`);
    
    console.log('\n4️⃣  Admin Login:');
    console.log(`curl -X POST http://localhost:3002/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@sebshub.com","password":"Admin123!"}'`);
    
    console.log('\n5️⃣  Admin Check Pending Payments:');
    console.log(`curl -X GET http://localhost:3002/api/admin/pending-payments \\
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"`);
    
    console.log('\n6️⃣  Admin Approve Payment (USE THIS TO APPROVE):');
    console.log(`curl -X PUT http://localhost:3002/api/admin/approve-payment/${paymentReceipt.id} \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4OGNkMGNkZC05NmFlLTQ3N2EtOTkxNi1mMGIyOGYwZTFlZGEiLCJlbWFpbCI6ImFkbWluQHNlYnNodWIuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU0NjQyNjcxLCJleHAiOjE3NTUyNDc0NzF9.LPHNJ9A3B2Ts5WtSPUOlr-erOe5vrU2S3fOX-YBPLC0" \\
  -H "Content-Type: application/json" \\
  -d '{"adminNotes":"Payment verified and approved"}'`);
    
    console.log('\n\n⚠️  IMPORTANT NOTES:');
    console.log(`   • Use Payment Receipt ID (${paymentReceipt.id}), NOT Subscription ID`);
    console.log('   • The admin token above is already included for convenience');
    console.log('   • After approval, both payment receipt and subscription will be activated');
    console.log('   • The user will receive email/SMS notifications upon approval');

  } catch (error) {
    console.error('❌ Error in test workflow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentApprovalWorkflow();
