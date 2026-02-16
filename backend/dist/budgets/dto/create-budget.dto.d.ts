export declare class CreateBudgetDto {
    amount: number;
    categoryId: string;
    period?: string;
    startDate: string;
    endDate: string;
    alertAt80?: boolean;
    alertAt100?: boolean;
    isActive?: boolean;
}
