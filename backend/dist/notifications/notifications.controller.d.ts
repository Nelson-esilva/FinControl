import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    findAll(unreadOnly?: string): any;
    findOne(id: string): any;
    markAsRead(id: string): any;
    markAllAsRead(): any;
}
