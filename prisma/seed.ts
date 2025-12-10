import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  console.log('\n👤 Creating admin user...');
  
  const adminEmail = 'admin@sebshub.com';
  const adminPassword = 'Admin123!';
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });
  
  if (existingAdmin) {
    console.log('ℹ️  Admin user already exists');
    console.log(`   Email: ${existingAdmin.email}`);
    console.log(`   Role: ${existingAdmin.role}`);
  } else {
    const hashedPassword = await hashPassword(adminPassword);
    
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        phone: '+2348012345678',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('\n📝 Admin Credentials:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: ${admin.role}`);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
  }

  // Create access plans based on the requirements
  console.log('\n📋 Creating/Updating access plans...');
  const plans = [
    // Daily Plans (4-hour access for morning, 5-hour for afternoon, 12-hour for night)
    {
      name: 'Morning Plan (Daily)',
      price: 2000,
      timeUnit: 'HOURS' as const,
      duration: 4,
      maxCapacity: null,
      planType: 'DAILY' as const,
      defaultTimeSlot: 'MORNING' as const,
    },
    {
      name: 'Afternoon Plan (Daily)',
      price: 3000,
      timeUnit: 'HOURS' as const,
      duration: 5,
      maxCapacity: null,
      planType: 'DAILY' as const,
      defaultTimeSlot: 'AFTERNOON' as const,
    },
    {
      name: 'Night Plan (Daily)',
      price: 5000,
      timeUnit: 'HOURS' as const,
      duration: 12,
      maxCapacity: null,
      planType: 'DAILY' as const,
      defaultTimeSlot: 'NIGHT' as const,
    },
    
    // Weekly Plans
    {
      name: 'Morning Plan (Weekly)',
      price: 8000,
      timeUnit: 'WEEK' as const,
      duration: 1,
      maxCapacity: null,
      planType: 'WEEKLY' as const,
      defaultTimeSlot: 'MORNING' as const,
    },
    {
      name: 'Afternoon Plan (Weekly)',
      price: 12000,
      timeUnit: 'WEEK' as const,
      duration: 1,
      maxCapacity: null,
      planType: 'WEEKLY' as const,
      defaultTimeSlot: 'AFTERNOON' as const,
    },
    {
      name: 'Night Plan (Weekly)',
      price: 20000,
      timeUnit: 'WEEK' as const,
      duration: 1,
      maxCapacity: null,
      planType: 'WEEKLY' as const,
      defaultTimeSlot: 'NIGHT' as const,
    },
    
    // Monthly Plans
    {
      name: 'Standard Monthly',
      price: 30000,
      timeUnit: 'MONTH' as const,
      duration: 1,
      maxCapacity: null,
      planType: 'MONTHLY' as const,
      defaultTimeSlot: null,
    },
    {
      name: 'Premium Monthly',
      price: 40000,
      timeUnit: 'MONTH' as const,
      duration: 1,
      maxCapacity: null,
      planType: 'MONTHLY' as const,
      defaultTimeSlot: 'ALL' as const,
    },
  ];

  // Update or create plans
  for (const plan of plans) {
    const existingPlan = await prisma.plan.findFirst({
      where: { name: plan.name }
    });

    if (existingPlan) {
      // Update existing plan with new metadata
      const updatedPlan = await prisma.plan.update({
        where: { id: existingPlan.id },
        data: {
          price: plan.price,
          timeUnit: plan.timeUnit,
          duration: plan.duration,
          maxCapacity: plan.maxCapacity,
          planType: plan.planType,
          defaultTimeSlot: plan.defaultTimeSlot,
        },
      });
      console.log(`✅ Updated plan: ${updatedPlan.name} - ₦${updatedPlan.price}`);
    } else {
      // Create new plan
      const createdPlan = await prisma.plan.create({
        data: plan,
      });
      console.log(`✅ Created plan: ${createdPlan.name} - ₦${createdPlan.price}`);
    }
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
