import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const USER_ID = 'user-id';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: { ...dto, name: dto.name.trim(), type: dto.type as 'INCOME' | 'EXPENSE', userId: USER_ID },
    });
  }

  findAll(type?: 'INCOME' | 'EXPENSE') {
    return this.prisma.category.findMany({
      where: { userId: USER_ID, type: type ?? { in: ['INCOME', 'EXPENSE'] } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.category.findFirst({ where: { id, userId: USER_ID } });
    if (!row) throw new NotFoundException('Categoria não encontrada.');
    return row;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    const data: Prisma.CategoryUpdateInput = { ...dto } as Prisma.CategoryUpdateInput;
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    const used = await this.prisma.transaction.count({ where: { categoryId: id } });
    if (used > 0) {
      throw new BadRequestException(`Categoria usada em ${used} lançamento(s). Recategorize-os antes de apagar.`);
    }
    return this.prisma.category.delete({ where: { id } });
  }
}
