import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
export declare class AccountsController {
    private readonly accounts;
    constructor(accounts: AccountsService);
    create(dto: CreateAccountDto): any;
    findAll(): any;
    findOne(id: string): any;
    update(id: string, dto: UpdateAccountDto): any;
    remove(id: string): any;
}
