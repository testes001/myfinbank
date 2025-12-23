/**
 * Create Initial Admin User Script
 * Run with: npx tsx scripts/create-admin.ts
 */

import bcrypt from 'bcryptjs';
import { PrismaClient, AdminRole } from '@prisma/client';

const prisma = new PrismaClient();

async function createInitialAdmin() {
  console.log('🔧 Creating initial admin user...\n');

  const username = process.env.ADMIN_USERNAME || 'superadmin';
  const email = process.env.ADMIN_EMAIL || 'admin@finbank.local';
  const password = process.env.ADMIN_PASSWORD || 'AdminPass123!@#$';
  const fullName = process.env.ADMIN_FULLNAME || 'Super Administrator';

  try {
    // Check if admin already exists
    const existing = await prisma.adminUser.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existing) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Username: ${existing.username}`);
      console.log(`   Email: ${existing.email}`);
      console.log(`   Role: ${existing.role}`);
      console.log(`   Status: ${existing.status}\n`);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin user
    const admin = await prisma.adminUser.create({
      data: {
        username,
        email,
        passwordHash,
        fullName,
        role: AdminRole.SUPERADMIN,
        status: 'ACTIVE',
      },
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.status}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    console.log('⚠️  Store these credentials securely.\n');

    // Create audit log (without actorId since this is system initialization)
    await prisma.auditLog.create({
      data: {
        actorType: 'SYSTEM',
        action: 'admin_created',
        resource: 'admin_user',
        resourceId: admin.id,
        status: 'SUCCESS',
        details: {
          username: admin.username,
          email: admin.email,
          role: admin.role,
          method: 'initial_setup',
        },
      },
    });

    console.log('📊 Login URL: http://localhost:4000/api/admin/login');
    console.log('\n📋 Example login request:');
    console.log(`
curl -X POST http://localhost:4000/api/admin/login \\
  -H 'Content-Type: application/json' \\
  -d '{
    "username": "${username}",
    "password": "${password}"
  }'
    `);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createInitialAdmin()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
