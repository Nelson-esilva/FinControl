"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("./prisma/prisma.module");
const users_module_1 = require("./users/users.module");
const accounts_module_1 = require("./accounts/accounts.module");
const categories_module_1 = require("./categories/categories.module");
const transactions_module_1 = require("./transactions/transactions.module");
const budgets_module_1 = require("./budgets/budgets.module");
const notifications_module_1 = require("./notifications/notifications.module");
const attachments_module_1 = require("./attachments/attachments.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            dashboard_module_1.DashboardModule,
            users_module_1.UsersModule,
            accounts_module_1.AccountsModule,
            categories_module_1.CategoriesModule,
            transactions_module_1.TransactionsModule,
            budgets_module_1.BudgetsModule,
            notifications_module_1.NotificationsModule,
            attachments_module_1.AttachmentsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map