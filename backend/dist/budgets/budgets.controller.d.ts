import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
export declare class BudgetsController {
    private readonly budgets;
    constructor(budgets: BudgetsService);
    create(dto: CreateBudgetDto): any;
    findAll(): any;
    findOne(id: string): any;
    update(id: string, dto: UpdateBudgetDto): any;
    remove(id: string): any;
}
