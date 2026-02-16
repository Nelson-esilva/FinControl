import { AttachmentsService } from './attachments.service';
export declare class AttachmentsController {
    private readonly attachments;
    constructor(attachments: AttachmentsService);
    findByTransaction(transactionId: string): any;
    findOne(id: string): any;
    remove(id: string): any;
}
