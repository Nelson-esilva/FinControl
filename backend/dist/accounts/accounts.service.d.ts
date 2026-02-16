import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
export declare class AccountsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateAccountDto): any;
    findAll(): any;
    findOne(id: string): any;
    update(id: string, dto: UpdateAccountDto): any;
    remove(id: string): any;
}
