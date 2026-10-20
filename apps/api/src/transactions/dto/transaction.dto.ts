import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { TRANSACTION_TYPES, TransactionType } from '../transaction.schema';

export class CreateTransactionDto {
  @ApiProperty({
    example: '65aa00000000000000000001',
    description: 'Account owned by the authenticated user.',
  })
  @IsMongoId()
  accountId: string;

  @ApiProperty({ enum: TRANSACTION_TYPES })
  @IsEnum(TRANSACTION_TYPES)
  type: TransactionType;

  @ApiProperty({
    example: 1299,
    minimum: 1,
    maximum: 100_000_000_000,
    description:
      'Positive integer in the account currency minor units (e.g. 1299 USD = $12.99).',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000_000_000)
  amountMinor: number;

  @ApiProperty({ example: 'Food', minLength: 1, maxLength: 60 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category: string;

  @ApiPropertyOptional({ example: 'Lunch', maxLength: 500 })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: '2026-10-19', format: 'date' })
  @IsDateString({ strict: true })
  date: string;
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({
    example: '65aa00000000000000000001',
    description: 'Must be owned by the authenticated user.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsMongoId()
  accountId?: string;

  @ApiPropertyOptional({ enum: TRANSACTION_TYPES })
  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(TRANSACTION_TYPES)
  type?: TransactionType;

  @ApiPropertyOptional({
    example: 1299,
    minimum: 1,
    maximum: 100_000_000_000,
    description: 'Positive integer in the transaction currency minor units.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000_000_000)
  amountMinor?: number;

  @ApiPropertyOptional({ example: 'Food', minLength: 1, maxLength: 60 })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category?: string;

  @ApiPropertyOptional({ example: 'Lunch', maxLength: 500 })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: '2026-10-19', format: 'date' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsDateString({ strict: true })
  date?: string;
}

export class TransactionQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100_000, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: TRANSACTION_TYPES })
  @IsOptional()
  @IsEnum(TRANSACTION_TYPES)
  type?: TransactionType;

  @ApiPropertyOptional({ example: '65aa00000000000000000001' })
  @IsOptional()
  @IsMongoId()
  accountId?: string;

  @ApiPropertyOptional({ example: 'Food', maxLength: 60 })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category?: string;

  @ApiPropertyOptional({ example: '2026-10-01', format: 'date' })
  @IsOptional()
  @IsDateString({ strict: true })
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-31', format: 'date' })
  @IsOptional()
  @IsDateString({ strict: true })
  endDate?: string;

  @ApiPropertyOptional({
    enum: ['date', 'createdAt', 'amountMinor'],
    default: 'date',
  })
  @IsOptional()
  @IsEnum(['date', 'createdAt', 'amountMinor'])
  sortBy?: 'date' | 'createdAt' | 'amountMinor';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
