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
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsIn(ACCOUNT_TYPES)
  type: AccountType;

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
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsIn(ACCOUNT_TYPES)
  type?: AccountType;

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
