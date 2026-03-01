import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const USER_ID = 'user-id';
const SUPERUSER_EMAIL = 'nelson.silvaem@gmail.com';
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin@123', 10);

  const superuser = await prisma.user.upsert({
    where: { email: SUPERUSER_EMAIL },
    create: {
      email: SUPERUSER_EMAIL,
      password: passwordHash,
      name: 'Nelson Silva',
      role: 'SUPERUSER',
    },
    update: { password: passwordHash, name: 'Nelson Silva', role: 'SUPERUSER' },
  });

  const user = await prisma.user.upsert({
    where: { id: USER_ID },
    create: {
      id: USER_ID,
      email: 'user@fincontrol.app',
      password: await bcrypt.hash('user@123', 10),
      name: 'Usuário FinControl',
      role: 'USER',
    },
    update: { password: await bcrypt.hash('user@123', 10) },
  });

  const countAccounts = await prisma.account.count({ where: { userId: user.id } });
  if (countAccounts === 0) {
    await prisma.account.create({
      data: {
        userId: user.id,
        name: 'Conta Principal',
        type: 'CHECKING',
        initialBalance: 0,
        currentBalance: 0,
      },
    });
  }

  const countCategories = await prisma.category.count({ where: { userId: user.id } });
  if (countCategories === 0) {
    await prisma.category.createMany({
      data: [
        { userId: user.id, name: 'Salário', type: 'INCOME', color: '#10b981' },
        { userId: user.id, name: 'Alimentação', type: 'EXPENSE', color: '#f43f5e' },
        { userId: user.id, name: 'Transporte', type: 'EXPENSE', color: '#f59e0b' },
        { userId: user.id, name: 'Lazer', type: 'EXPENSE', color: '#06b6d4' },
        { userId: user.id, name: 'Outros', description: 'gasto fixo', type: 'EXPENSE', color: '#6b7280' },
      ],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
