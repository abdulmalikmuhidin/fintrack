import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  TRANSACTION_TYPES,
  TransactionType,
} from '../transaction.schema';

export class CreateTransactionDto {
  @IsMongoId()
  accountId: string;

  @IsEnum(TRANSACTION_TYPES)
  type: TransactionType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000_000_000)
  amountMinor: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsDateString({ strict: true })
  date: string;
}

export class UpdateTransactionDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsMongoId()
  accountId?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(TRANSACTION_TYPES)
  type?: TransactionType;

  @ValidateIf((_object, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000_000_000)
  amountMinor?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  description?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsDateString({ strict: true })
  date?: string;
}

export class TransactionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(TRANSACTION_TYPES)
  type?: TransactionType;

  @IsOptional()
  @IsMongoId()
  accountId?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  startDate?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  endDate?: string;

  @IsOptional()
  @IsEnum(['date', 'createdAt', 'amountMinor'])
  sortBy?: 'date' | 'createdAt' | 'amountMinor';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
