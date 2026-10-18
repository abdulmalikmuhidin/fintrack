import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class TrustedOriginGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const origin = request.get('origin');
    const allowedOrigin = this.configService.getOrThrow<string>('FRONTEND_URL');

    if (origin !== allowedOrigin) {
      throw new ForbiddenException('Request origin is not allowed.');
    }

    return true;
  }
}
