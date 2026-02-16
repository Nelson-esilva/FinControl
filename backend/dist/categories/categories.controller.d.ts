import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesController {
    private readonly categories;
    constructor(categories: CategoriesService);
    create(dto: CreateCategoryDto): any;
    findAll(type?: 'INCOME' | 'EXPENSE'): any;
    findOne(id: string): any;
    update(id: string, dto: UpdateCategoryDto): any;
    remove(id: string): any;
}
