import { Body, Controller, Delete, Get, Headers, HttpCode, Logger, Param, Post } from '@nestjs/common';
import { PluggyService } from './pluggy.service';
import { RegisterPluggyItemDto } from './dto/register-item.dto';
import { PluggyWebhookDto } from './dto/pluggy-webhook.dto';

@Controller('pluggy')
export class PluggyController {
  private readonly logger = new Logger(PluggyController.name);

  constructor(private readonly pluggy: PluggyService) {}

  @Get('items')
  findAll() {
    return this.pluggy.findAll();
  }

  @Post('items')
  register(@Body() dto: RegisterPluggyItemDto) {
    return this.pluggy.register(dto);
  }

  @Post('webhooks')
  @HttpCode(200)
  handleWebhook(
    @Body() dto: PluggyWebhookDto,
    @Headers('x-webhook-secret') secret?: string,
  ) {
    this.pluggy.assertWebhookSecret(secret);
    void this.pluggy.handleWebhook(dto).catch((err: unknown) => {
      this.logger.error(err instanceof Error ? err.message : 'webhook');
    });
    return { received: true };
  }

  @Post('items/:id/sync')
  sync(@Param('id') id: string) {
    return this.pluggy.syncByLocalId(id);
  }

  @Delete('items/:id')
  unlink(@Param('id') id: string) {
    return this.pluggy.unlink(id);
  }
}
