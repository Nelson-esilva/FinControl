import { AttachmentsService } from './attachments.service';
export declare class AttachmentsController {
    private readonly attachments;
    constructor(attachments: AttachmentsService);
    findByTransaction(transactionId: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        url: string;
        fileName: string;
        fileType: string;
        size: number;
        transactionId: string;
    }[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__AttachmentClient<{
        id: string;
        createdAt: Date;
        url: string;
        fileName: string;
        fileType: string;
        size: number;
        transactionId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__AttachmentClient<{
        id: string;
        createdAt: Date;
        url: string;
        fileName: string;
        fileType: string;
        size: number;
        transactionId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
