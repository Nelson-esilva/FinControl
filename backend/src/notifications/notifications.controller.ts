import { Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  findAll(@Query('unreadOnly') unreadOnly?: string) {
    return this.notifications.findAll(unreadOnly === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notifications.findOne(id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notifications.markAsRead(id);
  }

  @Post('read-all')
  markAllAsRead() {
    return this.notifications.markAllAsRead();
  }
}
