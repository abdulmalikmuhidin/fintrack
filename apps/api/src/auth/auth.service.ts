import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PublicUser } from '../users/user.types';
import { toPublicUser, UsersService } from '../users/users.service';
import { PASSWORD_HASH_ROUNDS } from './auth.constants';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.';

@Injectable()
export class AuthService {
  private readonly dummyPasswordHash = bcrypt.hashSync(
    randomBytes(32).toString('hex'),
    PASSWORD_HASH_ROUNDS,
  );

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  register(input: RegisterDto): Promise<PublicUser> {
    return this.usersService.createUser(input);
  }

  async login(
    input: LoginDto,
  ): Promise<{ user: PublicUser; accessToken: string }> {
    const user = await this.usersService.findByEmailForAuthentication(
      input.email,
    );
    const passwordIsValid = await bcrypt.compare(
      input.password,
      user?.passwordHash ?? this.dummyPasswordHash,
    );

    if (!user || !passwordIsValid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return {
      user: toPublicUser(user),
      accessToken: await this.jwtService.signAsync({ sub: user._id.toString() }),
    };
  }
}
