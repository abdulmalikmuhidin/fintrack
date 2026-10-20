import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const usersService = {
    findPublicById: jest.fn(),
  };
  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(
      {
        getOrThrow: jest.fn().mockReturnValue('test-secret'),
      } as unknown as ConfigService,
      usersService as unknown as UsersService,
    );
  });

  it('rejects a token payload without a valid subject', async () => {
    await expect(strategy.validate({ sub: '' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(usersService.findPublicById).not.toHaveBeenCalled();
  });

  it('rejects a token for a user that no longer exists', async () => {
    usersService.findPublicById.mockResolvedValue(null);
    await expect(
      strategy.validate({ sub: '65aa00000000000000000001' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns only the public user loaded from the verified subject', async () => {
    const user = {
      id: '65aa00000000000000000001',
      name: 'Example User',
      email: 'user@example.com',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    usersService.findPublicById.mockResolvedValue(user);

    await expect(
      strategy.validate({ sub: user.id }),
    ).resolves.toEqual(user);
    expect(usersService.findPublicById).toHaveBeenCalledWith(user.id);
  });
});
