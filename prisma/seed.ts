import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create access plans based on the requirements
  const plans = [
    // Daily Plans (4-hour access for morning, 5-hour for afternoon, 12-hour for night)
    {
      name: 'Morning Plan (Daily)',
      price: 2000,
      timeUnit: 'HOURS' as const,
      duration: 4,
      maxCapacity: null,
    },
    {
      name: 'Afternoon Plan (Daily)',
      price: 3000,
      timeUnit: 'HOURS' as const,
      duration: 5,
      maxCapacity: null,
    },
    {
      name: 'Night Plan (Daily)',
      price: 5000,
      timeUnit: 'HOURS' as const,
      duration: 12,
      maxCapacity: null,
    },
    
    // Weekly Plans
    {
      name: 'Morning Plan (Weekly)',
      price: 8000,
      timeUnit: 'WEEK' as const,
      duration: 1,
      maxCapacity: null,
    },
    {
      name: 'Afternoon Plan (Weekly)',
      price: 12000,
      timeUnit: 'WEEK' as const,
      duration: 1,
      maxCapacity: null,
    },
    {
      name: 'Night Plan (Weekly)',
      price: 20000,
      timeUnit: 'WEEK' as const,
      duration: 1,
      maxCapacity: null,
    },
    
    // Monthly Plans
    {
      name: 'Standard Monthly',
      price: 30000,
      timeUnit: 'MONTH' as const,
      duration: 1,
      maxCapacity: null,
    },
    {
      name: 'Premium Monthly',
      price: 40000,
      timeUnit: 'MONTH' as const,
      duration: 1,
      maxCapacity: null,
    },
    
    // Team Night Plan
    {
      name: 'Team Night Plan',
      price: 100000, // Team pricing
      timeUnit: 'WEEK' as const,
      duration: 1,
      maxCapacity: 14,
    },
  ];

  console.log('📋 Creating access plans...');
  
  // Clear existing plans first
  await prisma.plan.deleteMany({});
  
  for (const plan of plans) {
    const createdPlan = await prisma.plan.create({
      data: plan,
    });
    console.log(`✅ Created plan: ${createdPlan.name} - ₦${createdPlan.price}`);
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
