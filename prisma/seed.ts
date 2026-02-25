import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!', 12);
  const agentHash = await bcrypt.hash(process.env.SEED_AGENT_PASSWORD || 'ChangeMe123!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { passwordHash: adminHash, role: Role.ADMIN },
    create: {
      email: 'admin@example.com',
      passwordHash: adminHash,
      role: Role.ADMIN
    }
  });

  await prisma.user.upsert({
    where: { email: 'agent@example.com' },
    update: { passwordHash: agentHash, role: Role.AGENT },
    create: {
      email: 'agent@example.com',
      passwordHash: agentHash,
      role: Role.AGENT
    }
  });

  console.log('Seed complete');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
