"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const USER_ID = 'user-id';
let BudgetsService = class BudgetsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(dto) {
        return this.prisma.budget.create({
            data: {
                ...dto,
                userId: USER_ID,
                amount: new library_1.Decimal(dto.amount),
                period: dto.period ?? 'MONTHLY',
            },
        });
    }
    findAll() {
        return this.prisma.budget.findMany({
            where: { userId: USER_ID },
            include: { category: true },
            orderBy: { startDate: 'desc' },
        });
    }
    findOne(id) {
        return this.prisma.budget.findFirstOrThrow({
            where: { id, userId: USER_ID },
            include: { category: true },
        });
    }
    update(id, dto) {
        const data = { ...dto };
        if (dto.amount != null)
            data.amount = new library_1.Decimal(dto.amount);
        return this.prisma.budget.update({ where: { id }, data });
    }
    remove(id) {
        return this.prisma.budget.delete({ where: { id } });
    }
};
exports.BudgetsService = BudgetsService;
exports.BudgetsService = BudgetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BudgetsService);
//# sourceMappingURL=budgets.service.js.map