import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create access plans based on the requirements
  const plans = [
    // Daily Plans
    {
      name: 'Morning Plan (Daily)',
      price: 2000,
      durationType: 'DAILY' as const,
      timeStart: '08:00',
      timeEnd: '12:00',
      maxCapacity: null,
    },
    {
      name: 'Afternoon Plan (Daily)',
      price: 3000,
      durationType: 'DAILY' as const,
      timeStart: '12:00',
      timeEnd: '17:00',
      maxCapacity: null,
    },
    {
      name: 'Night Plan (Daily)',
      price: 5000,
      durationType: 'DAILY' as const,
      timeStart: '18:00',
      timeEnd: '06:00',
      maxCapacity: null,
    },
    
    // Weekly Plans
    {
      name: 'Morning Plan (Weekly)',
      price: 8000,
      durationType: 'WEEKLY' as const,
      timeStart: '08:00',
      timeEnd: '12:00',
      maxCapacity: null,
    },
    {
      name: 'Afternoon Plan (Weekly)',
      price: 12000,
      durationType: 'WEEKLY' as const,
      timeStart: '12:00',
      timeEnd: '17:00',
      maxCapacity: null,
    },
    {
      name: 'Night Plan (Weekly)',
      price: 20000,
      durationType: 'WEEKLY' as const,
      timeStart: '18:00',
      timeEnd: '06:00',
      maxCapacity: null,
    },
    
    // Monthly Plans
    {
      name: 'Standard Monthly',
      price: 30000,
      durationType: 'MONTHLY' as const,
      timeStart: null,
      timeEnd: null,
      maxCapacity: null,
    },
    {
      name: 'Premium Monthly',
      price: 40000,
      durationType: 'MONTHLY' as const,
      timeStart: null,
      timeEnd: null,
      maxCapacity: null,
    },
    
    // Team Night Plan (Custom)
    {
      name: 'Team Night Plan',
      price: 0, // Custom pricing
      durationType: 'WEEKLY' as const,
      timeStart: '18:00',
      timeEnd: '06:00',
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
