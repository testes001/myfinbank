
import { PrismaClient, UserRole, UserStatus, KYCStatus, AccountType, AccountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create/Update Demo User
  const demoEmail = 'alice@demo.com';
  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      passwordHash,
      status: UserStatus.ACTIVE,
      kycStatus: KYCStatus.APPROVED,
    },
    create: {
      email: demoEmail,
      passwordHash,
      fullName: 'Alice Demo',
      phoneNumber: '+15550000000',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      kycStatus: KYCStatus.APPROVED,
    },
  });

  console.log(`✅ User seeded: ${user.email}`);

  // 2. Create Accounts if not exist
  const accounts = await prisma.account.findMany({ where: { userId: user.id } });

  if (accounts.length === 0) {
    await prisma.account.create({
      data: {
        userId: user.id,
        accountNumber: '1234567890',
        routingNumber: '098765432',
        accountType: AccountType.CHECKING,
        balance: 5000.00,
        availableBalance: 5000.00,
        status: AccountStatus.ACTIVE,
        currency: 'USD',
      },
    });
    
    await prisma.account.create({
      data: {
        userId: user.id,
        accountNumber: '0987654321',
        routingNumber: '098765432',
        accountType: AccountType.SAVINGS,
        balance: 12000.00,
        availableBalance: 12000.00,
        status: AccountStatus.ACTIVE,
        currency: 'USD',
        interestRate: 0.045, // 4.5% APY
      },
    });
    console.log(`✅ Accounts seeded for ${user.email}`);
  } else {
    console.log(`ℹ️ Accounts already exist for ${user.email}`);
  }

  console.log('🌱 Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
