import { ConflictException } from '@nestjs/common';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from './user.schema';
import { normalizeEmail, UsersService } from './users.service';

describe('UsersService', () => {
  it('normalizes email consistently', () => {
    expect(normalizeEmail('  USER@Example.COM ')).toBe('user@example.com');
  });

  it('converts duplicate-key errors into a safe conflict response', async () => {
    const model = {
      create: jest.fn().mockRejectedValue({ code: 11000 }),
    };
    const service = new UsersService(model as unknown as Model<User>);

    await expect(
      service.createUser({
        name: 'Example User',
        email: ' USER@example.com ',
        password: 'A-Strong-Password123!',
      }),
    ).rejects.toThrow(
      new ConflictException('An account with this email already exists.'),
    );
  });

  it('hashes the password and persists a normalized email without returning the hash', async () => {
    const user = {
      _id: { toString: () => '65aa00000000000000000001' },
      name: 'Example User',
      email: 'user@example.com',
      passwordHash: 'stored-hash',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const create = jest.fn().mockResolvedValue(user);
    const service = new UsersService({ create } as unknown as Model<User>);
    const hashSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValue('stored-hash');

    const result = await service.createUser({
      name: ' Example User ',
      email: ' USER@Example.COM ',
      password: 'A-Strong-Password123!',
    });

    expect(hashSpy).toHaveBeenCalledWith('A-Strong-Password123!', 12);
    expect(create).toHaveBeenCalledWith({
      name: 'Example User',
      email: 'user@example.com',
      passwordHash: 'stored-hash',
    });
    expect(result).not.toHaveProperty('passwordHash');
  });
});
