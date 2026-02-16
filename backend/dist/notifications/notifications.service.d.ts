import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(unreadOnly?: boolean): any;
    findOne(id: string): any;
    markAsRead(id: string): any;
    markAllAsRead(): any;
}
