import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ACCOUNT_TYPES, AccountType } from '../account.schema';

export class CreateAccountDto {
  @ApiProperty({ example: 'Everyday checking', minLength: 1, maxLength: 100 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: ACCOUNT_TYPES, example: 'checking' })
  @IsIn(ACCOUNT_TYPES)
  type: AccountType;

  @ApiProperty({
    example: 'USD',
    description: 'Three-letter ISO 4217 currency code.',
    pattern: '^[A-Z]{3}$',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{3}$/, {
    message: 'currency must be a three-letter ISO 4217 code.',
  })
  currency: string;
}

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'Everyday checking', minLength: 1, maxLength: 100 })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: ACCOUNT_TYPES })
  @ValidateIf((_object, value) => value !== undefined)
  @IsIn(ACCOUNT_TYPES)
  type?: AccountType;

  @ApiPropertyOptional({
    example: 'USD',
    description: 'Three-letter ISO 4217 currency code.',
    pattern: '^[A-Z]{3}$',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{3}$/, {
    message: 'currency must be a three-letter ISO 4217 code.',
  })
  currency?: string;
}
