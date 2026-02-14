import { Controller, Delete, Get, Param } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';

@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Get('transaction/:transactionId')
  findByTransaction(@Param('transactionId') transactionId: string) {
    return this.attachments.findByTransaction(transactionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attachments.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attachments.remove(id);
  }
}
