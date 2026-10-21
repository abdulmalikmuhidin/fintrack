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
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a user account' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'The user was registered. Password and password hash are omitted.',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Input validation failed.' })
  @ApiConflictResponse({ description: 'An account already exists for this email.' })
  @ApiForbiddenResponse({ description: 'Request origin is not allowed.' })
  @UseGuards(TrustedOriginGuard)
  async register(@Body() input: RegisterDto): Promise<{ user: PublicUser }> {
    return { user: await this.authService.register(input) };
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in and set the HttpOnly session cookie' })
  @ApiBody({ type: LoginDto })
  @ApiCreatedResponse({
    description: 'Login succeeded. The fintrack_session cookie is set; no JWT is returned in the response body.',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Input validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Email or password is invalid.' })
  @ApiForbiddenResponse({ description: 'Request origin is not allowed.' })
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
  @ApiCookieAuth('fintrack_session')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiOkResponse({ description: 'Safe public user profile.' })
  @ApiUnauthorizedResponse({ description: 'Session is missing, invalid, or expired.' })
  me(@CurrentUser() user: PublicUser): { user: PublicUser } {
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear the session cookie' })
  @ApiNoContentResponse({ description: 'Session cookie cleared.' })
  @ApiForbiddenResponse({ description: 'Request origin is not allowed.' })
  @UseGuards(TrustedOriginGuard)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(AUTH_COOKIE_NAME, this.cookieOptions());
  }

  private cookieOptions(): CookieOptions {
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN')?.trim();
    return {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      maxAge:
        this.configService.getOrThrow<number>('JWT_EXPIRES_IN_SECONDS') * 1000,
    };
  }
}
