import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @ApiProperty({ example: 'user@example.com', format: 'email', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    example: 'A-Strong-Password123!',
    minLength: 1,
    maxLength: 128,
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}
