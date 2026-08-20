import { IsUUID } from 'class-validator';

export class RegisterPluggyItemDto {
  @IsUUID()
  itemId: string;
}
