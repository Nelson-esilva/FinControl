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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const USER_ID = 'user-id';
let TransactionsService = class TransactionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const amount = new library_1.Decimal(dto.amount);
        const balanceChange = dto.type === client_1.TransactionType.INCOME ? dto.amount : -dto.amount;
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    userId: USER_ID,
                    accountId: dto.accountId,
                    categoryId: dto.categoryId,
                    amount,
                    date: new Date(dto.date),
                    description: dto.description,
                    type: dto.type,
                    status: dto.status ?? 'COMPLETED',
                    installmentNumber: dto.installmentNumber,
                    totalInstallments: dto.totalInstallments,
                    isRecurring: dto.isRecurring ?? false,
                    recurringFrequency: dto.recurringFrequency,
                },
            });
            await tx.account.update({
                where: { id: dto.accountId },
                data: { currentBalance: { increment: balanceChange } },
            });
            return transaction;
        });
    }
    findAll(filters) {
        const where = { userId: USER_ID };
        if (filters?.type)
            where.type = filters.type;
        if (filters?.accountId)
            where.accountId = filters.accountId;
        if (filters?.categoryId)
            where.categoryId = filters.categoryId;
        if (filters?.from || filters?.to) {
            where.date = {};
            if (filters.from)
                where.date.gte = new Date(filters.from);
            if (filters.to)
                where.date.lte = new Date(filters.to);
        }
        return this.prisma.transaction.findMany({
            where,
            include: { account: true, category: true },
            orderBy: { date: 'desc' },
        });
    }
    findOne(id) {
        return this.prisma.transaction.findFirstOrThrow({
            where: { id, userId: USER_ID },
            include: { account: true, category: true, attachments: true },
        });
    }
    async update(id, dto) {
        const existing = await this.prisma.transaction.findFirstOrThrow({
            where: { id, userId: USER_ID },
        });
        let balanceAdjustment = 0;
        if (dto.amount !== undefined || dto.type !== undefined) {
            const oldAmount = Number(existing.amount);
            balanceAdjustment += existing.type === client_1.TransactionType.INCOME ? -oldAmount : oldAmount;
            const newAmount = dto.amount ?? oldAmount;
            const newType = dto.type ?? existing.type;
            balanceAdjustment += newType === client_1.TransactionType.INCOME ? newAmount : -newAmount;
        }
        const data = { ...dto };
        if (dto.amount != null)
            data.amount = new library_1.Decimal(dto.amount);
        if (dto.date)
            data.date = new Date(dto.date);
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.transaction.update({ where: { id }, data });
            if (balanceAdjustment !== 0) {
                await tx.account.update({
                    where: { id: existing.accountId },
                    data: { currentBalance: { increment: balanceAdjustment } },
                });
            }
            return updated;
        });
    }
    async remove(id) {
        const tx = await this.prisma.transaction.findFirstOrThrow({
            where: { id, userId: USER_ID },
        });
        const balanceRevert = tx.type === client_1.TransactionType.INCOME
            ? -Number(tx.amount)
            : Number(tx.amount);
        return this.prisma.$transaction(async (prismaTx) => {
            await prismaTx.account.update({
                where: { id: tx.accountId },
                data: { currentBalance: { increment: balanceRevert } },
            });
            return prismaTx.transaction.delete({ where: { id } });
        });
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map