import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('🔧 Creating/Updating Admin User...');

  try {
    // Check if the admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@sebshub.com' }
    });

    if (existingAdmin) {
      // Update existing user to ADMIN role
      const updatedUser = await prisma.user.update({
        where: { email: 'admin@sebshub.com' },
        data: { role: 'ADMIN' }
      });
      
      console.log('✅ Updated existing user to ADMIN role:');
      console.log('   Email: admin@sebshub.com');
      console.log('   Password: Admin123!');
      console.log('   Role: ADMIN');
      console.log('   ID:', updatedUser.id);
    } else {
      // Create new admin user
      const hashedPassword = await hashPassword('Admin123!');
      
      const adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@sebshub.com',
          phone: '+2348012345678',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          isActive: true
        }
      });

      console.log('✅ Created new ADMIN user:');
      console.log('   Email: admin@sebshub.com');
      console.log('   Password: Admin123!');
      console.log('   Role: ADMIN');
      console.log('   ID:', adminUser.id);
    }

    // Also create a SUPER_ADMIN user for system management
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: 'superadmin@sebshub.com' }
    });

    if (!existingSuperAdmin) {
      const superAdminPassword = await hashPassword('SuperAdmin123!');
      
      const superAdmin = await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: 'superadmin@sebshub.com',
          phone: '+2348098765432',
          passwordHash: superAdminPassword,
          role: 'SUPER_ADMIN',
          isActive: true
        }
      });

      console.log('\n✅ Created SUPER_ADMIN user:');
      console.log('   Email: superadmin@sebshub.com');
      console.log('   Password: SuperAdmin123!');
      console.log('   Role: SUPER_ADMIN');
      console.log('   ID:', superAdmin.id);
    } else {
      console.log('\n✅ Super Admin already exists');
    }

    console.log('\n🎉 Admin users setup completed successfully!');
    console.log('\n📝 You can now login with these credentials:');
    console.log('   Admin: admin@sebshub.com / Admin123!');
    console.log('   Super Admin: superadmin@sebshub.com / SuperAdmin123!');

  } catch (error) {
    console.error('❌ Error creating admin users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
