import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UserDocument } from '../users/user.schema';
import { UsersService } from '../users/users.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hashSync: jest.fn(() => 'dummy-hash'),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<
    Pick<UsersService, 'createUser' | 'findByEmailForAuthentication'>
  >;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;

  beforeEach(async () => {
    usersService = {
      createUser: jest.fn(),
      findByEmailForAuthentication: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the same unauthorized response for an unknown email', async () => {
    usersService.findByEmailForAuthentication.mockResolvedValue(null);
    jest.mocked(bcrypt.compare).mockResolvedValue(false);

    await expect(
      authService.login({ email: 'missing@example.com', password: 'password' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password.'));
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'password',
      expect.any(String),
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('returns the same unauthorized response for an incorrect password', async () => {
    const user = {
      _id: { toString: () => '65aa00000000000000000001' },
      name: 'Example User',
      email: 'user@example.com',
      passwordHash: 'stored-hash',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    } as unknown as UserDocument;
    usersService.findByEmailForAuthentication.mockResolvedValue(user);
    jest.mocked(bcrypt.compare).mockResolvedValue(false);

    await expect(
      authService.login({ email: 'user@example.com', password: 'incorrect' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password.'));
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('issues a subject-based token and only returns public user data', async () => {
    const user = {
      _id: { toString: () => '65aa00000000000000000001' },
      name: 'Example User',
      email: 'user@example.com',
      passwordHash: 'stored-hash',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    } as unknown as UserDocument;
    usersService.findByEmailForAuthentication.mockResolvedValue(user);
    jest.mocked(bcrypt.compare).mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('signed-token');

    const result = await authService.login({
      email: 'user@example.com',
      password: 'A-Strong-Password123!',
    } satisfies LoginDto);

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: '65aa00000000000000000001',
    });
    expect(result).toEqual({
      user: {
        id: '65aa00000000000000000001',
        name: 'Example User',
        email: 'user@example.com',
        createdAt: user.createdAt,
      },
      accessToken: 'signed-token',
    });
    expect(result.user).not.toHaveProperty('passwordHash');
  });
});
