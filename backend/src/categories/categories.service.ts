import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const USER_ID = 'user-id';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: { ...dto, userId: USER_ID },
    });
  }

  findAll(type?: 'INCOME' | 'EXPENSE') {
    return this.prisma.category.findMany({
      where: { userId: USER_ID, ...(type && { type }) },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.category.findFirstOrThrow({
      where: { id, userId: USER_ID },
    });
  }

  update(id: string, dto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
