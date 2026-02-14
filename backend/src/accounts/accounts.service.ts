import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Decimal } from '@prisma/client/runtime/library';

const USER_ID = 'user-id';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateAccountDto) {
    const initial = dto.initialBalance ?? 0;
    return this.prisma.account.create({
      data: {
        ...dto,
        userId: USER_ID,
        initialBalance: new Decimal(initial),
        currentBalance: new Decimal(initial),
        creditLimit: dto.creditLimit != null ? new Decimal(dto.creditLimit) : undefined,
      },
    });
  }

  findAll() {
    return this.prisma.account.findMany({
      where: { userId: USER_ID },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.account.findFirstOrThrow({
      where: { id, userId: USER_ID },
    });
  }

  update(id: string, dto: UpdateAccountDto) {
    const data: Record<string, unknown> = { ...dto };
    if (dto.initialBalance != null) data.initialBalance = new Decimal(dto.initialBalance);
    if (dto.creditLimit != null) data.creditLimit = new Decimal(dto.creditLimit);
    return this.prisma.account.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.account.delete({ where: { id } });
  }
}
