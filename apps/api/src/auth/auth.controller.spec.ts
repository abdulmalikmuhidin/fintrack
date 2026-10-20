import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AuthController } from './auth.controller';
import { TrustedOriginGuard } from './guards/trusted-origin.guard';

describe('AuthController', () => {
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
  };
  const configService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };
  const controller = new AuthController(authService as never, configService as never);

  it('protects the current-user endpoint with the JWT guard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      AuthController.prototype.me,
    );
    expect(guards).toHaveLength(1);
    expect(guards[0].name).toContain('AuthGuard');
  });

  it('requires a trusted origin on registration and logout mutations', () => {
    for (const endpoint of ['register', 'logout'] as const) {
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        AuthController.prototype[endpoint],
      );
      expect(guards).toContain(TrustedOriginGuard);
    }
  });

  it('returns the authenticated public profile without querying a caller-supplied id', () => {
    const user = {
      id: '65aa00000000000000000001',
      name: 'Example User',
      email: 'user@example.com',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    expect(controller.me(user)).toEqual({ user });
  });
});
