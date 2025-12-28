
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const email = 'alice@demo.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true }
  });

  if (!user) {
    console.log(`❌ User ${email} not found!`);
  } else {
    console.log(`✅ User ${email} found (ID: ${user.id})`);
    console.log(`Accounts: ${user.accounts.length}`);
    user.accounts.forEach(acc => {
      console.log(` - ID: ${acc.id}, Type: ${acc.accountType}, Balance: ${acc.balance}`);
    });
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
