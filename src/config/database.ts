import { PrismaClient } from '@prisma/client';

// Create Prisma client instance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

// Database connection test
async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Database connection failed:', errorMessage);
    console.log('💡 Please set up PostgreSQL and update DATABASE_URL in .env file');
    // Don't exit in development - allow server to run without database
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// Graceful shutdown
async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

export {
  prisma,
  connectDatabase,
  disconnectDatabase
};
