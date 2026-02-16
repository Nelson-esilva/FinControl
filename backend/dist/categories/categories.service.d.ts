import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateCategoryDto): any;
    findAll(type?: 'INCOME' | 'EXPENSE'): any;
    findOne(id: string): any;
    update(id: string, dto: UpdateCategoryDto): any;
    remove(id: string): any;
}
