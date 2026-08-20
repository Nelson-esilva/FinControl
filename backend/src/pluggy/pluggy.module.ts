import { Module } from '@nestjs/common';
import { PluggyController } from './pluggy.controller';
import { PluggyService } from './pluggy.service';
import { PluggyClient } from './pluggy.client';

@Module({
  controllers: [PluggyController],
  providers: [PluggyService, PluggyClient],
})
export class PluggyModule {}
