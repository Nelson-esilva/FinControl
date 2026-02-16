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
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const USER_ID = 'user-id';
let AccountsService = class AccountsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(dto) {
        const initial = dto.initialBalance ?? 0;
        return this.prisma.account.create({
            data: {
                ...dto,
                userId: USER_ID,
                initialBalance: new library_1.Decimal(initial),
                currentBalance: new library_1.Decimal(initial),
                creditLimit: dto.creditLimit != null ? new library_1.Decimal(dto.creditLimit) : undefined,
            },
        });
    }
    findAll() {
        return this.prisma.account.findMany({
            where: { userId: USER_ID },
            orderBy: { createdAt: 'desc' },
        });
    }
    findOne(id) {
        return this.prisma.account.findFirstOrThrow({
            where: { id, userId: USER_ID },
        });
    }
    update(id, dto) {
        const data = { ...dto };
        if (dto.initialBalance != null)
            data.initialBalance = new library_1.Decimal(dto.initialBalance);
        if (dto.creditLimit != null)
            data.creditLimit = new library_1.Decimal(dto.creditLimit);
        return this.prisma.account.update({
            where: { id },
            data,
        });
    }
    remove(id) {
        return this.prisma.account.delete({ where: { id } });
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map