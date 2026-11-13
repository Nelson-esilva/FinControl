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
        name: 'Conta corrente',
        type: 'CHECKING',
        initialBalance: 0,
        currentBalance: 0,
      },
    });
  }

  const defaultCategories = [
    { name: 'Salário', type: 'INCOME', color: '#5CC8FF', icon: 'Briefcase' },
    { name: 'Renda extra', type: 'INCOME', color: '#6ED3A8', icon: 'Sparkles' },
    { name: 'Rendimentos', type: 'INCOME', color: '#8B8CFF', icon: 'TrendingUp' },
    { name: 'Moradia', type: 'EXPENSE', color: '#8B8CFF', icon: 'Home' },
    { name: 'Mercado', type: 'EXPENSE', color: '#6ED3A8', icon: 'ShoppingCart' },
    { name: 'Restaurantes', type: 'EXPENSE', color: '#FF9F6B', icon: 'UtensilsCrossed' },
    { name: 'Transporte', type: 'EXPENSE', color: '#E68AD8', icon: 'Car' },
    { name: 'Saúde', type: 'EXPENSE', color: '#F47A8F', icon: 'HeartPulse' },
    { name: 'Educação', type: 'EXPENSE', color: '#5CC8FF', icon: 'GraduationCap' },
    { name: 'Lazer', type: 'EXPENSE', color: '#F7C948', icon: 'Gamepad2' },
    { name: 'Compras', type: 'EXPENSE', color: '#B48CFF', icon: 'ShoppingBag' },
    { name: 'Assinaturas', type: 'EXPENSE', color: '#4FD1C5', icon: 'Repeat' },
    { name: 'Dívidas e juros', type: 'EXPENSE', color: '#F2994A', icon: 'Landmark' },
    { name: 'Outros', type: 'EXPENSE', color: '#9AA1AD', icon: 'Tag' },
  ];

  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { userId: user.id, name: cat.name, type: cat.type as any }
    });
    if (!existing) {
      await prisma.category.create({
        data: { userId: user.id, name: cat.name, type: cat.type as any, color: cat.color, icon: cat.icon, isDefault: true }
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
