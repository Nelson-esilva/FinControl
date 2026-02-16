import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
export declare class BudgetsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateBudgetDto): any;
    findAll(): any;
    findOne(id: string): any;
    update(id: string, dto: UpdateBudgetDto): any;
    remove(id: string): any;
}
