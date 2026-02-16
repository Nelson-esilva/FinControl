import { PrismaService } from '../prisma/prisma.service';
export declare class AttachmentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByTransaction(transactionId: string): any;
    findOne(id: string): any;
    remove(id: string): any;
}
