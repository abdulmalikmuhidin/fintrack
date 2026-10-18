import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_COOKIE_NAME } from '../auth.constants';
import { UsersService } from '../../users/users.service';
import { PublicUser } from '../../users/user.types';

interface JwtPayload {
  sub: string;
}

function extractCookieToken(request: Request): string | null {
  return request.cookies?.[AUTH_COOKIE_NAME] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractCookieToken]),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<PublicUser> {
    if (!payload || typeof payload.sub !== 'string' || !payload.sub) {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findPublicById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
