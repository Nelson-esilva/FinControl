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

  const defaultCategories = [
    { name: 'Salário', type: 'INCOME', color: '#10b981' },
    { name: 'Alimentação', type: 'EXPENSE', color: '#f43f5e' },
    { name: 'Transporte', type: 'EXPENSE', color: '#f59e0b' },
    { name: 'Saúde', type: 'EXPENSE', color: '#ec4899' },
    { name: 'Educação', type: 'EXPENSE', color: '#8b5cf6' },
    { name: 'Moradia', type: 'EXPENSE', color: '#6366f1' },
    { name: 'Lazer', type: 'EXPENSE', color: '#06b6d4' },
    { name: 'Imprevistos', type: 'EXPENSE', color: '#ef4444' },
    { name: 'Outros', description: 'gasto fixo', type: 'EXPENSE', color: '#6b7280' },
  ];

  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { userId: user.id, name: cat.name, type: cat.type as any }
    });
    if (!existing) {
      await prisma.category.create({
        data: { userId: user.id, name: cat.name, type: cat.type as any, color: cat.color, description: cat.description }
      });
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
