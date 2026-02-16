import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    create(dto: CreateUserDto): any;
    findAll(): any;
    findOne(id: string): any;
    update(id: string, dto: UpdateUserDto): any;
    remove(id: string): any;
}
