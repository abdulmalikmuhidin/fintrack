import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { CookieOptions, Response } from 'express';
import { AUTH_COOKIE_NAME } from './auth.constants';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TrustedOriginGuard } from './guards/trusted-origin.guard';
import { PublicUser } from '../users/user.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @UseGuards(TrustedOriginGuard)
  async register(@Body() input: RegisterDto): Promise<{ user: PublicUser }> {
    return { user: await this.authService.register(input) };
  }

  @Post('login')
  @UseGuards(TrustedOriginGuard)
  async login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: PublicUser }> {
    const session = await this.authService.login(input);
    response.cookie(
      AUTH_COOKIE_NAME,
      session.accessToken,
      this.cookieOptions(),
    );
    return { user: session.user };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@CurrentUser() user: PublicUser): { user: PublicUser } {
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TrustedOriginGuard)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(AUTH_COOKIE_NAME, this.cookieOptions());
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge:
        this.configService.getOrThrow<number>('JWT_EXPIRES_IN_SECONDS') * 1000,
    };
  }
}
