import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateUserDto, userId?: string): any;
    findAll(): any;
    findOne(id: string): any;
    update(id: string, dto: UpdateUserDto): any;
    remove(id: string): any;
}
